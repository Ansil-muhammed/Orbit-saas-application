import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { PlusIcon, ChevronRightIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../api';
import { Workspace } from '../types';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { boardId } = useParams();
    const queryClient = useQueryClient();

    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
    const [workspaceName, setWorkspaceName] = useState('');
    const [isCreatingBoardFor, setIsCreatingBoardFor] = useState<number | null>(null);
    const [boardTitle, setBoardTitle] = useState('');

    const { data: workspaces, isLoading } = useQuery<Workspace[]>({
        queryKey: ['workspaces'],
        queryFn: async () => {
            const res = await api.get('/workspaces/');
            return res.data;
        }
    });

    const createWorkspaceMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await api.post('/workspaces/', { name });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
        onError: (err: any) => {
            const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            alert(`Error creating workspace: ${msg}`);
        }
    });

    const createBoardMutation = useMutation({
        mutationFn: async ({ title, workspaceId }: { title: string, workspaceId: number }) => {
            const res = await api.post('/boards/', { title, workspace: workspaceId });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
        onError: (err: any) => {
            const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            alert(`Error creating board: ${msg}`);
        }
    });

    const updateWorkspaceMutation = useMutation({
        mutationFn: async ({ id, name }: { id: number, name: string }) => {
            const res = await api.patch(`/workspaces/${id}/`, { name });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        }
    });

    const updateBoardMutation = useMutation({
        mutationFn: async ({ id, title }: { id: number, title: string }) => {
            const res = await api.patch(`/boards/${id}/`, { title });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        }
    });

    const handleCreateWorkspace = () => {
        setIsCreatingWorkspace(true);
    };

    const submitCreateWorkspace = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = workspaceName.trim();
        if (trimmed) {
            createWorkspaceMutation.mutate(trimmed);
        }
        setWorkspaceName('');
        setIsCreatingWorkspace(false);
    }

    const handleEditWorkspace = (ws: Workspace) => {
        const name = prompt('Edit workspace name:', ws.name);
        if (name && name !== ws.name) updateWorkspaceMutation.mutate({ id: ws.id, name });
    };

    const handleCreateBoard = (workspaceId: number) => {
        setIsCreatingBoardFor(workspaceId);
    };

    const submitCreateBoard = (e: React.FormEvent, workspaceId: number) => {
        e.preventDefault();
        const trimmed = boardTitle.trim();
        if (trimmed) {
            createBoardMutation.mutate({ title: trimmed, workspaceId });
        }
        setBoardTitle('');
        setIsCreatingBoardFor(null);
    }

    const handleEditBoard = (e: React.MouseEvent, boardId: number, currentTitle: string) => {
        e.preventDefault();
        e.stopPropagation();
        const title = prompt('Edit board title:', currentTitle);
        if (title && title !== currentTitle) updateBoardMutation.mutate({ id: boardId, title });
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 md:hidden transition-opacity"
                    onClick={onClose}
                />
            )}
            <div className={`fixed inset-y-0 left-0 z-40 transform md:relative md:translate-x-0 w-64 bg-gray-900 text-gray-300 flex flex-col transition-transform duration-300 shadow-xl h-full ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-14 flex items-center justify-between px-4 font-bold text-xl border-b border-gray-800 tracking-wider text-white">
                    <div className="flex items-center">
                        <span className="text-indigo-400 mr-2">O</span>Orbit
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="md:hidden p-1 text-gray-400 hover:text-white rounded-md">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
                    <div className="px-4 flex items-center justify-between group mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspaces</span>
                        <button
                            onClick={handleCreateWorkspace}
                            className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {isCreatingWorkspace && (
                        <form onSubmit={submitCreateWorkspace} className="px-4 mb-4 flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                placeholder="Workspace name..."
                                className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreatingWorkspace(false);
                                    setWorkspaceName('');
                                }}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </form>
                    )}

                    {isLoading ? (
                        <div className="px-4 py-2 space-y-3">
                            <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"></div>
                            <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2"></div>
                        </div>
                    ) : workspaces?.length === 0 ? (
                        <div className="px-4 py-6 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 text-gray-500">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">You don't have any workspaces yet.</p>
                            <button
                                onClick={handleCreateWorkspace}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg w-full transition-colors flex items-center justify-center"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                New Workspace
                            </button>
                        </div>
                    ) : (
                        workspaces?.map((ws) => (
                            <div key={ws.id} className="mb-4">
                                <div className="px-4 py-2 flex items-center justify-between hover:bg-gray-800 group transition-colors">
                                    <span className="font-medium text-sm text-gray-200">{ws.name}</span>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditWorkspace(ws)}
                                            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                                            title="Edit workspace"
                                        >
                                            <PencilSquareIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleCreateBoard(ws.id)}
                                            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                                            title="Add board"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-1 space-y-1">
                                    {ws.boards?.map(board => (
                                        <Link
                                            key={board.id}
                                            to={`/b/${board.id}`}
                                            className={`pl-8 pr-4 py-1.5 flex items-center justify-between text-sm transition-colors group/board ${Number(boardId) === board.id ? 'bg-indigo-900/50 text-indigo-300 border-r-2 border-indigo-500' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}
                                        >
                                            <div className="flex items-center overflow-hidden">
                                                <ChevronRightIcon className="w-3 h-3 mr-2 opacity-50 flex-shrink-0" />
                                                <span className="truncate">{board.title}</span>
                                            </div>
                                            <button
                                                onClick={(e) => handleEditBoard(e, board.id, board.title)}
                                                className="text-gray-500 hover:text-white opacity-0 group-hover/board:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-600 ml-2"
                                                title="Edit board"
                                            >
                                                <PencilSquareIcon className="w-3 h-3" />
                                            </button>
                                        </Link>
                                    ))}
                                    {isCreatingBoardFor === ws.id && (
                                        <form onSubmit={(e) => submitCreateBoard(e, ws.id)} className="pl-8 pr-4 py-1 flex gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={boardTitle}
                                                onChange={(e) => setBoardTitle(e.target.value)}
                                                placeholder="Board title..."
                                                className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                                            />
                                            <button
                                                type="submit"
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                            >
                                                Add
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsCreatingBoardFor(null);
                                                    setBoardTitle('');
                                                }}
                                                className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
                    Orbit Workspace v1.0
                </div>
            </div>
        </>
    );
};

export default Sidebar;
