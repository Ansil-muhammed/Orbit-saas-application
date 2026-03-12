import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import api from '../api';
import { Task } from '../types';
import { XMarkIcon, UserCircleIcon, ChatBubbleLeftRightIcon, Bars3BottomLeftIcon } from '@heroicons/react/24/outline';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    boardId: string;
}

export default function TaskModal({ isOpen, onClose, task, boardId }: TaskModalProps) {
    const queryClient = useQueryClient();
    const [commentContent, setCommentContent] = useState('');
    const [description, setDescription] = useState(task.description || '');
    const [isEditingDesc, setIsEditingDesc] = useState(false);

    const updateDescMutation = useMutation({
        mutationFn: async (desc: string) => {
            const res = await api.patch(`/tasks/${task.id}/`, { description: desc });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            setIsEditingDesc(false);
        }
    });

    const addCommentMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await api.post('/comments/', { content, task: task.id });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] });
            setCommentContent('');
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{task.title}</h2>
                        <p className="text-sm text-gray-500 mt-1">in list</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8 flex-1">

                    {/* Description */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-gray-700 font-semibold">
                            <Bars3BottomLeftIcon className="w-5 h-5" />
                            <h3>Description</h3>
                        </div>
                        {isEditingDesc ? (
                            <div className="space-y-3">
                                <textarea
                                    autoFocus
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full border-2 border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-lg p-3 text-sm text-gray-700 outline-none transition-all resize-y min-h-[100px]"
                                    placeholder="Add a more detailed description..."
                                />
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => updateDescMutation.mutate(description)}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDescription(task.description || '');
                                            setIsEditingDesc(false);
                                        }}
                                        className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditingDesc(true)}
                                className={`text-sm p-4 rounded-lg cursor-pointer transition-colors border-2 border-transparent hover:bg-gray-50 ${!task.description ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'text-gray-700 bg-white'}`}
                            >
                                {task.description || "Add a more detailed description..."}
                            </div>
                        )}
                    </div>

                    {/* Comments section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-gray-700 font-semibold mb-4">
                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                            <h3>Activity & Comments</h3>
                        </div>

                        {/* Add Comment */}
                        <div className="flex space-x-3 items-start">
                            <div className="flex-shrink-0">
                                <UserCircleIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                <textarea
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="w-full p-3 text-sm text-gray-700 outline-none resize-none min-h-[80px]"
                                />
                                <div className="bg-gray-50 px-3 py-2 flex justify-end">
                                    <button
                                        onClick={() => commentContent.trim() && addCommentMutation.mutate(commentContent)}
                                        disabled={!commentContent.trim() || addCommentMutation.isPending}
                                        className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition disabled:opacity-50"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Comment List */}
                        <div className="space-y-4 mt-6">
                            {task.comments && [...task.comments].reverse().map(comment => (
                                <div key={comment.id} className="flex space-x-3">
                                    <div className="flex-shrink-0 pt-1">
                                        {comment.user.avatar ?
                                            <img src={comment.user.avatar} className="w-8 h-8 rounded-full object-cover" /> :
                                            <UserCircleIcon className="w-8 h-8 text-indigo-400" />
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline space-x-2">
                                            <span className="font-semibold text-sm text-gray-800">{comment.user.username}</span>
                                            <span className="text-xs text-gray-400">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <div className="bg-white border border-gray-100 shadow-sm p-3 mt-1 rounded-xl rounded-tl-none text-sm text-gray-700 whitespace-pre-wrap">
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
