export interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
}

export interface Workspace {
    id: number;
    name: string;
    owner: User;
    members: User[];
    created_at: string;
    boards: Board[];
}

export interface Board {
    id: number;
    title: string;
    workspace: number;
    created_at: string;
    lists: List[];
    activities: ActivityLog[];
}

export interface List {
    id: number;
    title: string;
    board: number;
    position: number;
    created_at: string;
    tasks: Task[];
}

export interface Task {
    id: number;
    title: string;
    description: string;
    list: number;
    position: number;
    created_at: string;
    comments: Comment[];
}

export interface Comment {
    id: number;
    content: string;
    task: number;
    user: User;
    created_at: string;
}

export interface ActivityLog {
    id: number;
    board: number;
    user: User | null;
    action: string;
    created_at: string;
}
