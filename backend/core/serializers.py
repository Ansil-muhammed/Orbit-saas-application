from rest_framework import serializers
from .models import User, Workspace, Board, List, Task, Comment, ActivityLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar']

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'avatar']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            avatar=validated_data.get('avatar', '')
        )
        return user

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'content', 'task', 'user', 'created_at']
        read_only_fields = ['task', 'user']

class TaskSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'list', 'position', 'created_at', 'comments']
        read_only_fields = ['list']

class ListSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = List
        fields = ['id', 'title', 'board', 'position', 'created_at', 'tasks']
        read_only_fields = ['board']

class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'board', 'user', 'action', 'created_at']

class BoardSerializer(serializers.ModelSerializer):
    lists = ListSerializer(many=True, read_only=True)
    activities = ActivityLogSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = ['id', 'title', 'workspace', 'created_at', 'lists', 'activities']
        read_only_fields = ['workspace']

class WorkspaceSerializer(serializers.ModelSerializer):
    boards = BoardSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Workspace
        fields = ['id', 'name', 'owner', 'members', 'created_at', 'boards']
        read_only_fields = ['owner']
