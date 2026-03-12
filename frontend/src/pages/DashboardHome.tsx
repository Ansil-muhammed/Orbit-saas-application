import { PlusIcon } from '@heroicons/react/24/outline';

export const DashboardHome = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50">
            <div className="bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col items-center max-w-md w-full relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center mb-8 relative z-10 transform -rotate-3 transition-transform hover:rotate-0">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight relative z-10">Welcome to Orbit</h3>

                <p className="text-center text-gray-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed relative z-10">
                    Select a workspace and board from the sidebar to start collaborating.
                    <br /><br />
                    If you're new here, look for the <strong className="text-indigo-600">New Workspace</strong> button or the <PlusIcon className="w-3.5 h-3.5 inline text-indigo-500 -mt-0.5" /> icon in the menu.
                </p>

                <div className="flex gap-4 w-full relative z-10 opacity-60">
                    <div className="h-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full w-full"></div>
                </div>
            </div>
        </div>
    );
};
