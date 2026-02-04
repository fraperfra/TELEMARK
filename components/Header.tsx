
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Search, LogOut, ChevronDown, X, Phone } from 'lucide-react';

interface HeaderProps {
  username: string;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ username, onOpenSettings, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => [
    {
      id: 'n1',
      title: 'Nuovo proprietario assegnato',
      message: 'Marco Rossi è stato assegnato alla tua lista.',
      time: '2 min fa',
      read: false,
    },
    {
      id: 'n2',
      title: 'Promemoria chiamata',
      message: 'Richiamare Laura Bianchi alle 16:30.',
      time: '35 min fa',
      read: false,
    },
    {
      id: 'n3',
      title: 'Appuntamento confermato',
      message: 'Visita Via Roma confermata per domani.',
      time: '1 giorno fa',
      read: true,
    },
  ]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setUserMenuOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              I
            </div>
            <span className="font-black text-gray-800">ImmoCRM</span>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-1">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl touch-target haptic"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={containerRef}>
              <button
                onClick={() => setOpen((prev) => !prev)}
                className="p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl touch-target haptic relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>

            {/* User Avatar */}
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="ml-1"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden border-2 border-white shadow-sm">
                <img src="https://picsum.photos/seed/agente/100" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {searchOpen && (
          <div className="fixed inset-0 bg-white z-50 fade-in">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <button
                onClick={() => setSearchOpen(false)}
                className="p-2 text-gray-500 touch-target"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cerca proprietari, immobili..."
                  autoFocus
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">Ricerche recenti</p>
              <div className="space-y-2">
                <button className="w-full text-left p-3 bg-gray-50 rounded-xl text-sm text-gray-600 active:bg-gray-100">
                  Mario Rossi
                </button>
                <button className="w-full text-left p-3 bg-gray-50 rounded-xl text-sm text-gray-600 active:bg-gray-100">
                  Via Roma 15
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Notifications Panel */}
        {open && (
          <div className="fixed inset-0 bg-black/50 z-50 fade-in" onClick={() => setOpen(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">Notifiche</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600">
                    Segna tutto letto
                  </button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[60vh] scroll-touch">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nessuna notifica</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-4 border-b border-gray-100 active:bg-gray-50 ${
                        notification.read ? 'opacity-60' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-100 bottom-nav-safe">
                <button
                  onClick={() => setOpen(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm active:bg-gray-200"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile User Menu */}
        {userMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 fade-in" onClick={() => setUserMenuOpen(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
              <div className="p-6 text-center border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto overflow-hidden border-4 border-white shadow-lg">
                  <img src="https://picsum.photos/seed/agente/100" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <p className="font-bold text-gray-900 mt-3">{username}</p>
                <p className="text-xs text-gray-500">Agente Senior</p>
              </div>
              <div className="p-4 space-y-2">
                <button
                  className="w-full text-left p-4 bg-gray-50 rounded-xl font-medium text-gray-700 active:bg-gray-100 flex items-center gap-3"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenSettings?.();
                  }}
                >
                  <span className="text-xl">⚙️</span>
                  Impostazioni
                </button>
                <button
                  className="w-full text-left p-4 bg-red-50 rounded-xl font-medium text-red-600 active:bg-red-100 flex items-center gap-3"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout?.();
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  Esci dall'account
                </button>
              </div>
              <div className="p-4 border-t border-gray-100 bottom-nav-safe">
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm active:bg-gray-200"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex h-20 bg-white border-b border-gray-200 items-center justify-between px-6 sticky top-0 z-30">
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
          <div className="relative" ref={containerRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-controls="notifications-panel"
              className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors group"
            >
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </button>

            {open && (
              <div
                id="notifications-panel"
                className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-200 z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Notifiche</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {unreadCount} nuove
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                      >
                        Segna tutto come letto
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nessuna notifica</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 border-b border-gray-100 ${
                          notification.read ? 'opacity-70' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                            <p className="text-[11px] text-gray-400 mt-2">{notification.time}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {!notification.read && (
                              <button
                                type="button"
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Leggi
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeNotification(notification.id)}
                              className="text-xs font-semibold text-gray-400 hover:text-gray-600"
                            >
                              Rimuovi
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-gray-200 mx-1" />

          <div className="relative" ref={userMenuRef}>
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-expanded={userMenuOpen}
              aria-controls="user-menu"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setUserMenuOpen((v) => !v);
                }
              }}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{username}</p>
                <p className="text-xs text-gray-500">Agente Senior</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                <img src="https://picsum.photos/seed/agente/100" alt="Avatar" />
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            {userMenuOpen && (
              <div
                id="user-menu"
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
              >
                <div className="py-2">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenSettings?.();
                    }}
                  >
                    Impostazioni
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout?.();
                    }}
                  >
                    Esci
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            onClick={() => onLogout?.()}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
    </>
  );
};
