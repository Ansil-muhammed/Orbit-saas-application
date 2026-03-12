import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PlusIcon, ChatBubbleLeftIcon, PencilSquareIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import api from '../api';
import TaskModal from '../components/TaskModal';
import { Board, Task } from '../types';
import { useDebounce } from '../hooks/useDebounce';

interface BoardViewProps {
    searchQuery: string;
}

const BoardView = ({ searchQuery }: BoardViewProps) => {
    const { boardId } = useParams();
    const queryClient = useQueryClient();
    const debouncedSearch = useDebounce(searchQuery, 300);

    const [isCreatingList, setIsCreatingList] = useState(false);
    const [listTitle, setListTitle] = useState('');
    const [isCreatingTaskFor, setIsCreatingTaskFor] = useState<number | null>(null);
    const [taskTitle, setTaskTitle] = useState('');
    const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
    const [editingBoardTitle, setEditingBoardTitle] = useState('');
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editingTaskTitle, setEditingTaskTitle] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isActivityOpen, setIsActivityOpen] = useState(false);

    const { data: board, isLoading } = useQuery<Board>({
        queryKey: ['board', boardId],
        queryFn: async () => {
            const res = await api.get(`/boards/${boardId}/`);
            return res.data;
        },
        enabled: !!boardId
    });

    const createListMutation = useMutation({
        mutationFn: async (title: string) => {
            const res = await api.post('/lists/', { title, board: Number(boardId) });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    });

    const updateBoardMutation = useMutation({
        mutationFn: async ({ title }: { title: string }) => {
            const res = await api.patch(`/boards/${boardId}/`, { title });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            queryClient.invalidateQueries({ queryKey: ['workspaces'] }); // update sidebar
        }
    });

    const createTaskMutation = useMutation({
        mutationFn: async ({ title, listId }: { title: string, listId: number }) => {
            const res = await api.post('/tasks/', { title, list: listId });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ taskId, title }: { taskId: number, title: string }) => {
            const res = await api.patch(`/tasks/${taskId}/`, { title });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (taskId: number) => {
            const res = await api.delete(`/tasks/${taskId}/`);
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    });

    const updateTaskPositionMutation = useMutation({
        mutationFn: async ({ taskId, sourceListId, destListId, newPosition }: any) => {
            const res = await api.patch('/tasks/reorder/', {
                task_id: taskId,
                source_list_id: sourceListId,
                destination_list_id: destListId,
                new_position: newPosition
            });
            return res.data;
        },
        onMutate: async (variables) => {
            // Optimistic update logic
            await queryClient.cancelQueries({ queryKey: ['board', boardId] });
            const previousBoard = queryClient.getQueryData<Board>(['board', boardId]);

            if (previousBoard) {
                // We create a deep copy to mutate
                const newBoard = JSON.parse(JSON.stringify(previousBoard)) as Board;

                const sourceList = newBoard.lists.find(l => l.id === variables.sourceListId);
                const destList = newBoard.lists.find(l => l.id === variables.destListId);

                if (sourceList && destList) {
                    const taskIndex = sourceList.tasks.findIndex(t => t.id === variables.taskId);
                    if (taskIndex !== -1) {
                        const [movedTask] = sourceList.tasks.splice(taskIndex, 1);
                        destList.tasks.splice(variables.newPosition, 0, movedTask);
                        queryClient.setQueryData(['board', boardId], newBoard);
                    }
                }
            }
            return { previousBoard };
        },
        onError: (_err, _newVal, context) => {
            // Rollback on error
            if (context?.previousBoard) {
                queryClient.setQueryData(['board', boardId], context.previousBoard);
            }
        },
        onSettled: () => {
            // Refetch to ensure sync
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
        }
    });

    const handleCreateList = () => {
        setIsCreatingList(true);
    };

    const submitCreateList = (e: React.FormEvent) => {
        e.preventDefault();
        if (listTitle.trim()) {
            createListMutation.mutate(listTitle.trim());
            setListTitle('');
            setIsCreatingList(false);
        }
    }

    const handleEditBoardTitle = () => {
        if (!board) return;
        setEditingBoardTitle(board.title);
        setIsEditingBoardTitle(true);
    };

    const submitEditBoardTitle = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBoardTitle.trim() && board && editingBoardTitle.trim() !== board.title) {
            updateBoardMutation.mutate({ title: editingBoardTitle.trim() });
        }
        setIsEditingBoardTitle(false);
    }

    const handleCreateTask = (listId: number) => {
        setIsCreatingTaskFor(listId);
    };

    const submitCreateTask = (e: React.FormEvent, listId: number) => {
        e.preventDefault();
        if (taskTitle.trim()) {
            createTaskMutation.mutate({ title: taskTitle.trim(), listId });
            setTaskTitle('');
            setIsCreatingTaskFor(null);
        }
    };

    const handleEditTask = (task: Task) => {
        setEditingTaskTitle(task.title);
        setEditingTaskId(task.id);
    };

    const submitEditTask = (e: React.FormEvent, taskId: number) => {
        e.preventDefault();
        if (editingTaskTitle.trim()) {
            updateTaskMutation.mutate({ taskId, title: editingTaskTitle.trim() });
        }
        setEditingTaskId(null);
    };

    const handleDeleteTask = (e: React.MouseEvent, taskId: number) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this card?')) {
            deleteTaskMutation.mutate(taskId);
        }
    };

    const handleDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        const sourceListId = parseInt(source.droppableId.replace('list-', ''));
        const destListId = parseInt(destination.droppableId.replace('list-', ''));
        const taskId = parseInt(draggableId.replace('task-', ''));

        updateTaskPositionMutation.mutate({
            taskId,
            sourceListId,
            destListId,
            newPosition: destination.index
        });
    };

    // Filter lists tasks by debounced search
    const lists = useMemo(() => {
        if (!board) return [];

        if (!debouncedSearch) {
            // Sort lists by position
            return [...board.lists].sort((a, b) => a.position - b.position).map(list => ({
                ...list,
                tasks: [...list.tasks].sort((a, b) => a.position - b.position)
            }));
        }

        const lowerSearch = debouncedSearch.toLowerCase();
        return [...board.lists].sort((a, b) => a.position - b.position).map(list => ({
            ...list,
            tasks: [...list.tasks].filter(t =>
                t.title.toLowerCase().includes(lowerSearch) ||
                t.description?.toLowerCase().includes(lowerSearch)
            ).sort((a, b) => a.position - b.position)
        }));
    }, [board, debouncedSearch]);

    if (isLoading) {
        return (
            <div className="h-full flex px-6 py-6 overflow-x-auto gap-6 transition-all">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-80 flex-shrink-0 flex flex-col bg-gray-200/50 rounded-xl p-3 animate-pulse h-96">
                        <div className="h-5 bg-gray-300 rounded w-1/2 mb-4"></div>
                        <div className="h-20 bg-white rounded-lg mb-3"></div>
                        <div className="h-20 bg-white rounded-lg mb-3"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!board) return <div className="p-6 text-gray-500">Board not found.</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between group">
                <div className="flex items-center">
                    {isEditingBoardTitle ? (
                        <form onSubmit={submitEditBoardTitle} className="mr-3">
                            <input
                                autoFocus
                                type="text"
                                className="text-2xl font-bold tracking-tight text-gray-800 bg-white border border-indigo-300 rounded px-2 py-1 outline-none ring-2 ring-indigo-500/20"
                                value={editingBoardTitle}
                                onChange={(e) => setEditingBoardTitle(e.target.value)}
                                onBlur={submitEditBoardTitle}
                            />
                        </form>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-800 mr-3">{board.title}</h2>
                            <button
                                onClick={handleEditBoardTitle}
                                className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-indigo-50"
                                title="Edit board title"
                            >
                                <PencilSquareIcon className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
                <button
                    onClick={() => setIsActivityOpen(!isActivityOpen)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${isActivityOpen ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                    <ClockIcon className="w-4 h-4" />
                    <span>Activity</span>
                </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex-1 px-6 pb-6 overflow-x-auto overflow-y-hidden custom-scrollbar">
                    <div className="flex gap-6 h-full items-start">
                        {lists.map(list => (
                            <div key={list.id} className="w-80 max-w-[85vw] flex-shrink-0 flex flex-col bg-gray-100/80 backdrop-blur shadow-sm border border-gray-200/60 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-80" />
                                <div className="px-4 py-3 mt-1 font-semibold text-gray-800 flex justify-between items-center group">
                                    {list.title}
                                    <span className="text-xs bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full">
                                        {list.tasks.length}
                                    </span>
                                </div>

                                <Droppable droppableId={`list-${list.id}`}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50 rounded-b-xl' : ''}`}
                                        >
                                            {list.tasks.map((task, index) => (
                                                <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => {
                                                                if (editingTaskId !== task.id) {
                                                                    // Do not open if clicking inside an active edit form
                                                                    setSelectedTask(task);
                                                                }
                                                            }}
                                                            className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 group transition-all
                                                                ${snapshot.isDragging ? 'shadow-xl rotate-2 scale-105 border-indigo-200 ring-2 ring-indigo-500/20' : 'hover:border-indigo-100 hover:shadow-md'}
                                                                ${editingTaskId !== task.id ? 'cursor-pointer' : ''}
                                                            `}
                                                            style={provided.draggableProps.style}
                                                        >
                                                            {editingTaskId === task.id ? (
                                                                <form onSubmit={(e) => submitEditTask(e, task.id)} className="mb-2">
                                                                    <textarea
                                                                        autoFocus
                                                                        value={editingTaskTitle}
                                                                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                                                                        className="w-full bg-white p-2 rounded shadow border border-indigo-300 outline-none ring-2 ring-indigo-500/20 resize-none text-sm text-gray-800"
                                                                        rows={2}
                                                                        onBlur={(e) => submitEditTask(e as any, task.id)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                                e.preventDefault();
                                                                                submitEditTask(e as any, task.id);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className="flex items-center space-x-2 mt-2">
                                                                        <button type="submit" className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition">Save</button>
                                                                        <button type="button" onMouseDown={(e) => { e.preventDefault(); setEditingTaskId(null); }} className="px-3 py-1 text-gray-500 hover:text-gray-800 text-xs font-medium hover:bg-gray-200 rounded transition">Cancel</button>
                                                                    </div>
                                                                </form>
                                                            ) : (
                                                                <div className="flex justify-between items-start group/card">
                                                                    <p className="text-sm font-medium text-gray-800 break-words flex-1 pr-2">{task.title}</p>
                                                                    <div className="flex opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                                        <button onClick={(e) => { e.stopPropagation(); handleEditTask(task); }} className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50" title="Edit task">
                                                                            <PencilSquareIcon className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button onClick={(e) => handleDeleteTask(e, task.id)} className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete task">
                                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {task.description && editingTaskId !== task.id && (
                                                                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{task.description}</p>
                                                            )}
                                                            {task.comments && task.comments.length > 0 && editingTaskId !== task.id && (
                                                                <div className="flex items-center text-xs text-gray-400 mt-3 font-medium">
                                                                    <ChatBubbleLeftIcon className="w-3.5 h-3.5 mr-1" />
                                                                    {task.comments.length}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>

                                <div className="p-3">
                                    {isCreatingTaskFor === list.id ? (
                                        <form onSubmit={(e) => submitCreateTask(e, list.id)}>
                                            <textarea
                                                autoFocus
                                                value={taskTitle}
                                                onChange={(e) => setTaskTitle(e.target.value)}
                                                onBlur={(e) => {
                                                    if (!e.target.value.trim()) setIsCreatingTaskFor(null);
                                                }}
                                                placeholder="Enter a title for this card..."
                                                className="w-full bg-white p-3 rounded-lg shadow-sm border border-indigo-300 outline-none ring-2 ring-indigo-500/20 resize-none text-sm text-gray-800 mb-2"
                                                rows={2}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        submitCreateTask(e, list.id);
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    type="submit"
                                                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                                                >
                                                    Add card
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreatingTaskFor(null)}
                                                    className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button
                                            onClick={() => handleCreateTask(list.id)}
                                            className="w-full py-2 flex items-center justify-center text-sm font-medium text-gray-500 hover:bg-gray-300/50 hover:text-gray-800 rounded-lg transition-colors"
                                        >
                                            <PlusIcon className="w-4 h-4 mr-1" /> Add a card
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="w-80 flex-shrink-0">
                            {isCreatingList ? (
                                <form onSubmit={submitCreateList} className="bg-white p-3 rounded-xl shadow-sm border border-indigo-200">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={listTitle}
                                        onChange={(e) => setListTitle(e.target.value)}
                                        placeholder="Enter list title..."
                                        className="w-full bg-gray-50 border border-indigo-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mb-3"
                                    />
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="submit"
                                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                                        >
                                            Add list
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsCreatingList(false)}
                                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={handleCreateList}
                                    className="w-full flex items-center px-4 py-3 bg-white/50 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-white rounded-xl font-medium transition-colors"
                                >
                                    <PlusIcon className="w-5 h-5 mr-1" /> Add another list
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </DragDropContext>

            {/* Activity Drawer */}
            {isActivityOpen && (
                <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col h-full shadow-[-4px_0_15px_rgba(0,0,0,0.03)] absolute right-0 top-0 z-10 animate-in slide-in-from-right">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                        <div className="flex items-center space-x-2 text-gray-800 font-semibold">
                            <ClockIcon className="w-5 h-5 text-indigo-500" />
                            <h3>Board Activity</h3>
                        </div>
                        <button onClick={() => setIsActivityOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {board.activities && board.activities.length > 0 ? (
                            board.activities.map(activity => (
                                <div key={activity.id} className="text-sm border-b border-gray-100 pb-3 last:border-0 relative pl-4">
                                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-indigo-400"></div>
                                    <p className="text-gray-700">
                                        <span className="font-semibold text-gray-900">{activity.user ? activity.user.username : 'Unknown'}</span>{' '}
                                        {activity.action}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 mt-10 text-sm">No recent activity.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {selectedTask && (
                <TaskModal
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    task={board.lists.flatMap(l => l.tasks).find(t => t.id === selectedTask.id) || selectedTask}
                    boardId={boardId as string}
                />
            )}
        </div>
    );
};

export default BoardView;
