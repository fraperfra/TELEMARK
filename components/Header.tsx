
import React from 'react';
import { Bell, Search, LogOut, ChevronDown } from 'lucide-react';

interface HeaderProps {
  username: string;
}

export const Header: React.FC<HeaderProps> = ({ username }) => {
  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex-1 flex items-center max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cerca proprietari, immobili, numeri..." 
            className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors group">
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
        </button>

        <div className="h-8 w-px bg-gray-200 mx-1" />

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{username}</p>
            <p className="text-xs text-gray-500">Agente Senior</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
            <img src="https://picsum.photos/seed/agente/100" alt="Avatar" />
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
