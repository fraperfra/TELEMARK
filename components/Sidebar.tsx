
import React, { useState } from 'react';
import { LayoutDashboard, Users, Phone, Calendar, Upload, Settings, X, ChevronRight, Download, Plus, ClipboardList } from 'lucide-react';
import { SettingsTab, ViewState } from '../types';

interface SidebarProps {
  activeView: ViewState;
  onViewChange: (view: ViewState) => void;
  activeSettingsTab: SettingsTab;
  onSettingsTabChange: (tab: SettingsTab) => void;
  onQuickAction?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  activeSettingsTab,
  onSettingsTabChange,
  onQuickAction,
}) => {
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  const menuItems = [
    { id: 'DASHBOARD' as ViewState, icon: LayoutDashboard, emoji: '📊', label: 'Dashboard' },
    { id: 'DAILY_TASKS' as ViewState, icon: ClipboardList, emoji: '📋', label: 'Task Giornalieri' },
    { id: 'OWNERS_LIST' as ViewState, icon: Users, emoji: '👥', label: 'Proprietari' },
    { id: 'CALENDAR' as ViewState, icon: Calendar, emoji: '📅', label: 'Calendario' },
    { id: 'UPLOAD' as ViewState, icon: Upload, emoji: '⬆️', label: 'Upload' },
    { id: 'SETTINGS' as ViewState, icon: Settings, emoji: '⚙️', label: 'Impostazioni' },
  ];

  const mobileMenuItems = [
    { id: 'DASHBOARD' as ViewState, icon: LayoutDashboard, label: 'Home' },
    { id: 'DAILY_TASKS' as ViewState, icon: ClipboardList, label: 'Task' },
    { id: 'OWNERS_LIST' as ViewState, icon: Users, label: 'Contatti' },
    { id: 'CALENDAR' as ViewState, icon: Calendar, label: 'Agenda' },
    { id: 'SETTINGS' as ViewState, icon: Settings, label: 'Menu' },
  ];

  const settingsItems: Array<{ id: SettingsTab; label: string }> = [
    { id: 'profile', label: 'Profilo Personale' },
    { id: 'agency', label: 'Agenzia' },
    { id: 'team', label: 'Gestione Team' },
    { id: 'notifications', label: 'Notifiche' },
    { id: 'security', label: 'Sicurezza Account' },
  ];

  const handleInstallPWA = () => {
    if (typeof window !== 'undefined' && (window as any).installPWA) {
      (window as any).installPWA();
    }
    setShowInstallBanner(false);
  };

  return (
    <>
      {/* Desktop Sidebar - nascosta su mobile */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
            I
          </div>
          <span className="font-black text-gray-800 text-lg">ImmoCRM</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.id} className="space-y-2">
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${
                  activeView === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className={`font-medium ${activeView === item.id ? 'text-blue-600' : 'text-gray-600'}`}>
                  {item.label}
                </span>
                {activeView === item.id && (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
                )}
              </button>
              {item.id === 'SETTINGS' && activeView === 'SETTINGS' && (
                <div className="flex flex-col gap-1 ml-8">
                  {settingsItems.map((setting) => (
                    <button
                      key={setting.id}
                      onClick={() => {
                        onViewChange('SETTINGS');
                        onSettingsTabChange(setting.id);
                      }}
                      className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                        activeSettingsTab === setting.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {setting.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white">
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

      {/* Mobile FAB - Floating Action Button */}
      {onQuickAction && (
        <button
          onClick={onQuickAction}
          className="md:hidden fixed right-4 bottom-24 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-200 flex items-center justify-center z-50 active:scale-95 transition-all haptic"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 bottom-nav-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {mobileMenuItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full touch-target haptic no-select ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className={`relative p-2 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                  <item.icon className={`w-6 h-6 transition-all ${isActive ? 'scale-110' : ''}`} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* PWA Install Banner - Mobile */}
      {showInstallBanner && (
        <div className="md:hidden install-banner fade-in">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 shadow-2xl shadow-blue-200/50 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Installa ImmoCRM</p>
              <p className="text-white/70 text-xs">Accesso rapido dalla home</p>
            </div>
            <button
              onClick={handleInstallPWA}
              className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
            >
              Installa
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-white/70 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
