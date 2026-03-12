from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db import transaction, models

from .models import User, Workspace, Board, List, Task, Comment, ActivityLog
from .serializers import (
    UserSerializer, UserRegisterSerializer, WorkspaceSerializer,
    BoardSerializer, ListSerializer, TaskSerializer, CommentSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegisterSerializer

class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Workspace.objects.filter(owner=user) | Workspace.objects.filter(members=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Board.objects.filter(workspace__owner=self.request.user) | Board.objects.filter(workspace__members=self.request.user)

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        workspace = Workspace.objects.get(id=workspace_id)
        serializer.save(workspace=workspace)
        ActivityLog.objects.create(board=serializer.instance, user=self.request.user, action="created this board")

class ListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return List.objects.filter(
            board__workspace__owner=self.request.user
        ) | List.objects.filter(
            board__workspace__members=self.request.user
        )
    
    def perform_create(self, serializer):
        board_id = self.request.data.get('board')
        board = Board.objects.get(id=board_id)
        
        # Simple auto-increment position logic
        max_pos = board.lists.count()
        serializer.save(board=board, position=max_pos)
        ActivityLog.objects.create(board=board, user=self.request.user, action=f"added list '{serializer.instance.title}'")

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(
            list__board__workspace__owner=self.request.user
        ) | Task.objects.filter(
            list__board__workspace__members=self.request.user
        )

    def perform_create(self, serializer):
        list_id = self.request.data.get('list')
        parent_list = List.objects.get(id=list_id)
        
        max_pos = parent_list.tasks.count()
        serializer.save(list=parent_list, position=max_pos)
        ActivityLog.objects.create(board=parent_list.board, user=self.request.user, action=f"added card '{serializer.instance.title}' to '{parent_list.title}'")

    def perform_update(self, serializer):
        serializer.save()
        ActivityLog.objects.create(board=serializer.instance.list.board, user=self.request.user, action=f"updated card '{serializer.instance.title}'")

    def perform_destroy(self, instance):
        board = instance.list.board
        title = instance.title
        instance.delete()
        ActivityLog.objects.create(board=board, user=self.request.user, action=f"deleted card '{title}'")

    @action(detail=False, methods=['patch'])
    def reorder(self, request):
        """
        Custom endpoint to handle drag-and-drop task ordering.
        Expects a payload like:
        {
            "task_id": 1,
            "source_list_id": 1,
            "destination_list_id": 2,
            "new_position": 0
        }
        """
        task_id = request.data.get('task_id')
        dest_list_id = request.data.get('destination_list_id')
        new_position = request.data.get('new_position')

        try:
            task = Task.objects.get(id=task_id)
            dest_list = List.objects.get(id=dest_list_id)
        except (Task.DoesNotExist, List.DoesNotExist):
            return Response(status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            # If moved to a new list, update the tasks in the old list and the new list
            if task.list_id != dest_list.id:
                # shift tasks down in old list
                Task.objects.filter(list=task.list, position__gt=task.position).update(position=models.F('position') - 1)
                
                # shift tasks up in new list
                Task.objects.filter(list=dest_list, position__gte=new_position).update(position=models.F('position') + 1)
                
                task.list = dest_list
                task.position = new_position
                task.save()
            else:
                # Moved within same list
                old_position = task.position
                if new_position > old_position:
                    Task.objects.filter(list=dest_list, position__gt=old_position, position__lte=new_position).update(position=models.F('position') - 1)
                elif new_position < old_position:
                    Task.objects.filter(list=dest_list, position__lt=old_position, position__gte=new_position).update(position=models.F('position') + 1)
                
                task.position = new_position
                task.save()
            
            ActivityLog.objects.create(board=dest_list.board, user=request.user, action=f"moved card '{task.title}' to '{dest_list.title}'")

        return Response({"status": "Success"}, status=status.HTTP_200_OK)

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(
            task__list__board__workspace__owner=self.request.user
        ) | Comment.objects.filter(
            task__list__board__workspace__members=self.request.user
        )
    
    def perform_create(self, serializer):
        task_id = self.request.data.get('task')
        task = Task.objects.get(id=task_id)
        serializer.save(user=self.request.user, task=task)
        ActivityLog.objects.create(board=task.list.board, user=self.request.user, action=f"commented on card '{task.title}'")
