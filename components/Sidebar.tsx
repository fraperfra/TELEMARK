
import React from 'react';
import { LayoutDashboard, Users, Phone, Calendar, TrendingUp, Upload, Settings } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  activeView: ViewState;
  onViewChange: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const menuItems = [
    { id: 'DASHBOARD' as ViewState, icon: '📊', label: 'Dashboard' },
    { id: 'OWNERS_LIST' as ViewState, icon: '👥', label: 'Proprietari' },
    { id: 'CALENDAR' as ViewState, icon: '📅', label: 'Appuntamenti' },
    { id: 'UPLOAD' as ViewState, icon: '⬆️', label: 'Upload File' },
    { id: 'SETTINGS' as ViewState, icon: '⚙️', label: 'Impostazioni' },
  ];

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          I
        </div>
        <span className="hidden md:block font-bold text-gray-800 text-lg">ImmoCRM</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${
              activeView === item.id 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`hidden md:block font-medium ${activeView === item.id ? 'text-blue-600' : 'text-gray-600'}`}>
              {item.label}
            </span>
            {activeView === item.id && (
              <div className="hidden md:block ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white hidden md:block">
          <p className="text-xs font-semibold opacity-80 uppercase mb-1">Status Obiettivo</p>
          <div className="flex justify-between items-end mb-2">
            <span className="text-lg font-bold">12 / 20</span>
            <span className="text-xs">60%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white w-[60%]" />
          </div>
        </div>
      </div>
    </aside>
  );
};
