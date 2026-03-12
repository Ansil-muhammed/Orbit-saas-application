import { useAuth } from '../context/AuthContext';
import { MagnifyingGlassIcon, ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface TopbarProps {
    onSearch?: (query: string) => void;
    onMenuClick?: () => void;
}

const Topbar = ({ onSearch, onMenuClick }: TopbarProps) => {
    const { user, logout } = useAuth();

    return (
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 flex-shrink-0">
            <div className="flex items-center flex-1 gap-2 sm:gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-1.5 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>
                <div className="relative w-full max-w-xs sm:max-w-md hidden sm:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-full text-sm leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        placeholder="Search tasks..."
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-sm">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Logout"
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Topbar;
