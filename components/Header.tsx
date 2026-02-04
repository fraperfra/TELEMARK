
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Bell, Search, LogOut, ChevronDown, X, Phone, CheckCheck, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  owner_id?: string;
  read: boolean;
  created_at: string;
}

interface HeaderProps {
  username: string;
  userId?: string;
  onOpenSettings?: () => void;
  onLogout?: () => void;
  onSelectOwner?: (ownerId: string) => void;
}

// Funzione per formattare il tempo relativo
const timeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Adesso';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min fa`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ore fa`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} giorni fa`;
  return then.toLocaleDateString('it-IT');
};

// Icona per tipo notifica
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'call': return '📞';
    case 'appointment': return '📅';
    case 'owner': return '👤';
    case 'success': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    default: return '🔔';
  }
};

export const Header: React.FC<HeaderProps> = ({ username, userId, onOpenSettings, onLogout, onSelectOwner }) => {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Suono notifica
  const playNotificationSound = useCallback(() => {
    try {
      // Crea audio context per suono notifica
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // La4
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  // Vibrazione mobile
  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }, []);

  // Carica notifiche esistenti
  const fetchNotifications = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sottoscrizione Realtime
  useEffect(() => {
    if (!supabase) return;

    fetchNotifications();

    // Sottoscrivi a INSERT sulla tabella notifications
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const notification = payload.new as Notification;

          // Aggiungi in cima alla lista
          setNotifications((prev) => [notification, ...prev]);

          // Mostra toast
          setNewNotification(notification);

          // Suono e vibrazione
          playNotificationSound();
          vibrate();

          // Nascondi toast dopo 5 secondi
          setTimeout(() => setNewNotification(null), 5000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const deleted = payload.old as Notification;
          setNotifications((prev) => prev.filter((n) => n.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, playNotificationSound, vibrate]);

  // Click outside handlers
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
        setNewNotification(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Segna tutto come letto
  const markAllAsRead = async () => {
    if (!supabase) return;

    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Ottimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);
    } catch (error) {
      console.error('Errore aggiornamento notifiche:', error);
      fetchNotifications(); // Rollback
    }
  };

  // Segna singola come letta
  const markAsRead = async (id: string) => {
    if (!supabase) return;

    // Ottimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    } catch (error) {
      console.error('Errore aggiornamento notifica:', error);
    }
  };

  // Rimuovi notifica
  const removeNotification = async (id: string) => {
    if (!supabase) return;

    // Ottimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (error) {
      console.error('Errore rimozione notifica:', error);
      fetchNotifications(); // Rollback
    }
  };

  // Cancella tutte
  const clearAll = async () => {
    if (!supabase) return;

    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;

    setNotifications([]);

    try {
      await supabase.from('notifications').delete().in('id', ids);
    } catch (error) {
      console.error('Errore cancellazione notifiche:', error);
      fetchNotifications();
    }
  };

  // Gestisci click su notifica
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.owner_id && onSelectOwner) {
      onSelectOwner(notification.owner_id);
      setOpen(false);
    }
  };

  return (
    <>
      {/* Toast notifica nuova */}
      {newNotification && (
        <div
          className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-[200] animate-in slide-in-from-top fade-in duration-300"
          onClick={() => handleNotificationClick(newNotification)}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">
                {getNotificationIcon(newNotification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{newNotification.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{newNotification.message}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNewNotification(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
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
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">Notifiche</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" />
                      Letto
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearAll} className="text-xs font-bold text-red-500 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-y-auto max-h-[65vh] scroll-touch">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nessuna notifica</p>
                    <p className="text-xs mt-1">Le nuove notifiche appariranno qui</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-4 border-b border-gray-100 active:bg-gray-50 ${
                        notification.read ? 'opacity-60' : 'bg-blue-50/50'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                          notification.read ? 'bg-gray-100' : 'bg-blue-100'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2">{timeAgo(notification.created_at)}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
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
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 border-2 border-white rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
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
                      <span className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full">
                        {unreadCount} nuove
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" />
                        Segna lette
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Cancella
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
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nessuna notifica</p>
                      <p className="text-xs mt-1">Le nuove notifiche appariranno qui</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          notification.read ? 'opacity-70' : 'bg-blue-50/50'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                            notification.read ? 'bg-gray-100' : 'bg-blue-100'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-[11px] text-gray-400">{timeAgo(notification.created_at)}</p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                              >
                                Rimuovi
                              </button>
                            </div>
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
