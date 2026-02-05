
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Phone, Video, FileSignature, CalendarDays } from 'lucide-react';
import { Appointment } from '../types';

// Nomi dei mesi in italiano
const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

// Nomi dei giorni in italiano (partendo da Lunedì)
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const DAY_NAMES_FULL = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

// Helper: ottieni il giorno della settimana (0 = Lunedì, 6 = Domenica)
const getDayOfWeek = (date: Date): number => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // Converti da DOM=0 a LUN=0
};

// Helper: formatta l'ora
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

// Helper: formatta la data
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Helper: controlla se due date sono lo stesso giorno
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};

// Helper: ottieni i giorni del mese con padding per allineamento griglia
const getCalendarDays = (year: number, month: number): (Date | null)[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = getDayOfWeek(firstDay);

  const days: (Date | null)[] = [];

  // Aggiungi celle vuote per allineamento
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Aggiungi i giorni del mese
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
};

// Helper: ottieni i giorni della settimana corrente
const getWeekDays = (date: Date): Date[] => {
  const dayOfWeek = getDayOfWeek(date);
  const monday = new Date(date);
  monday.setDate(date.getDate() - dayOfWeek);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
};

// Helper: ottieni le ore del giorno (8:00 - 20:00)
const getHoursOfDay = (): number[] => {
  return Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00
};

interface CalendarPageProps {
  appointments?: Appointment[];
  onAddAppointment?: () => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  appointments = [],
  onAddAppointment
}) => {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Aggiorna l'ora corrente ogni minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // Ogni minuto
    return () => clearInterval(interval);
  }, []);

  // Calcola i giorni da mostrare
  const calendarDays = useMemo(() =>
    getCalendarDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  );

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const hoursOfDay = useMemo(() => getHoursOfDay(), []);

  // Navigazione
  const goToPrevious = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() - 7);
      setSelectedDate(newDate);
    } else {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() - 1);
      setSelectedDate(newDate);
    }
  };

  const goToNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + 7);
      setSelectedDate(newDate);
    } else {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + 1);
      setSelectedDate(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Filtra appuntamenti per data
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    return appointments.filter(app => {
      const appDate = new Date(app.date);
      return isSameDay(appDate, date);
    });
  };

  // Filtra appuntamenti per oggi
  const todayAppointments = useMemo(() =>
    appointments.filter(app => isSameDay(new Date(app.date), now)),
    [appointments, now]
  );

  // Icona per tipo appuntamento
  const getAppointmentIcon = (type: string) => {
    switch (type) {
      case 'VISIT': return <MapPin className="w-3 h-3" />;
      case 'CALL': return <Phone className="w-3 h-3" />;
      case 'VIDEO': return <Video className="w-3 h-3" />;
      case 'SIGNING': return <FileSignature className="w-3 h-3" />;
      default: return <CalendarDays className="w-3 h-3" />;
    }
  };

  // Colore per tipo appuntamento
  const getAppointmentColor = (type: string) => {
    switch (type) {
      case 'VISIT': return 'bg-blue-500';
      case 'CALL': return 'bg-green-500';
      case 'VIDEO': return 'bg-purple-500';
      case 'SIGNING': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  // Titolo header basato sulla vista
  const getHeaderTitle = () => {
    if (view === 'month') {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (view === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
      }
      return `${start.getDate()} ${MONTH_NAMES[start.getMonth()].slice(0, 3)} - ${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
    } else {
      return `${DAY_NAMES_FULL[getDayOfWeek(selectedDate)]} ${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]}`;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in slide-in-from-right-4 duration-500 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Calendario</h1>
            <p className="text-xs md:text-sm text-gray-500">
              <span className="hidden sm:inline">Gestisci i tuoi appuntamenti 📅 • </span>
              <span className="text-blue-600 font-semibold">{formatTime(now)}</span>
              <span className="text-gray-400"> • {formatDate(now)}</span>
            </p>
          </div>
          <button
            onClick={onAddAppointment}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white p-3 md:px-5 md:py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline text-sm">Nuovo</span>
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex items-center flex-1 sm:flex-none">
            <button onClick={() => setView('month')} className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${view === 'month' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}>Mese</button>
            <button onClick={() => setView('week')} className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${view === 'week' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}>Sett.</button>
            <button onClick={() => setView('day')} className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${view === 'day' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}>Giorno</button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs md:text-sm font-bold text-gray-600 transition-all"
          >
            Oggi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
        {/* Main Calendar */}
        <div className="lg:col-span-9 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-4">
              <h2 className="text-base md:text-xl font-bold text-gray-900">{getHeaderTitle()}</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPrevious}
                  className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Month View */}
          {view === 'month' && (
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden">
              {/* Day Headers */}
              {DAY_NAMES.map(day => (
                <div key={day} className="bg-gray-50 py-2 md:py-3 text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase">
                  {day}
                </div>
              ))}
              {/* Calendar Days */}
              {calendarDays.map((date, i) => {
                const isToday = date && isSameDay(date, now);
                const isSelected = date && isSameDay(date, selectedDate);
                const dayAppointments = date ? getAppointmentsForDate(date) : [];
                const isWeekend = date && (getDayOfWeek(date) >= 5);

                return (
                  <div
                    key={i}
                    onClick={() => date && setSelectedDate(date)}
                    className={`bg-white min-h-[60px] md:min-h-[100px] p-1 md:p-2 relative group transition-colors cursor-pointer
                      ${!date ? 'bg-gray-50' : 'hover:bg-blue-50/50'}
                      ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}
                      ${isWeekend && !isSelected ? 'bg-gray-50/50' : ''}
                    `}
                  >
                    {date && (
                      <>
                        <span className={`text-xs md:text-sm font-bold flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full mx-auto md:mx-0
                          ${isToday ? 'bg-blue-600 text-white shadow-md' : ''}
                          ${isWeekend && !isToday ? 'text-gray-400' : 'text-gray-600'}
                        `}>
                          {date.getDate()}
                        </span>
                        {/* Appointments */}
                        <div className="mt-1 space-y-0.5 hidden md:block">
                          {dayAppointments.slice(0, 2).map((app, idx) => (
                            <div
                              key={idx}
                              className={`${getAppointmentColor(app.type)} text-white rounded px-1.5 py-0.5 text-[9px] font-bold truncate flex items-center gap-1`}
                            >
                              {getAppointmentIcon(app.type)}
                              <span className="truncate">{app.title}</span>
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-[9px] text-gray-400 font-bold px-1">
                              +{dayAppointments.length - 2} altri
                            </div>
                          )}
                        </div>
                        {/* Mobile: dot indicator */}
                        {dayAppointments.length > 0 && (
                          <div className="flex justify-center gap-0.5 mt-1 md:hidden">
                            {dayAppointments.slice(0, 3).map((app, idx) => (
                              <div key={idx} className={`w-1.5 h-1.5 rounded-full ${getAppointmentColor(app.type)}`} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Week View */}
          {view === 'week' && (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Day Headers */}
                <div className="grid grid-cols-8 gap-px bg-gray-200 border border-gray-200 rounded-t-xl overflow-hidden">
                  <div className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-400">Ora</div>
                  {weekDays.map((date, i) => {
                    const isToday = isSameDay(date, now);
                    return (
                      <div key={i} className={`p-2 text-center ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">{DAY_NAMES[i]}</div>
                        <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Time Slots */}
                <div className="grid grid-cols-8 gap-px bg-gray-200 border-x border-b border-gray-200 rounded-b-xl overflow-hidden">
                  {hoursOfDay.map(hour => (
                    <React.Fragment key={hour}>
                      <div className="bg-gray-50 p-2 text-xs font-bold text-gray-400 text-center">
                        {hour}:00
                      </div>
                      {weekDays.map((date, dayIdx) => {
                        const isToday = isSameDay(date, now);
                        const isCurrentHour = isToday && now.getHours() === hour;
                        return (
                          <div
                            key={dayIdx}
                            className={`bg-white min-h-[50px] p-1 border-t border-gray-100 relative
                              ${isToday ? 'bg-blue-50/30' : ''}
                              ${isCurrentHour ? 'bg-blue-100/50' : ''}
                            `}
                          >
                            {isCurrentHour && (
                              <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500" />
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Day View */}
          {view === 'day' && (
            <div className="space-y-2">
              {hoursOfDay.map(hour => {
                const isCurrentHour = isSameDay(selectedDate, now) && now.getHours() === hour;
                const isPastHour = isSameDay(selectedDate, now) && now.getHours() > hour;

                return (
                  <div
                    key={hour}
                    className={`flex gap-4 p-3 rounded-xl border transition-all
                      ${isCurrentHour ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20' : 'border-gray-100 hover:bg-gray-50'}
                      ${isPastHour ? 'opacity-50' : ''}
                    `}
                  >
                    <div className={`text-sm font-bold w-16 ${isCurrentHour ? 'text-blue-600' : 'text-gray-400'}`}>
                      {hour.toString().padStart(2, '0')}:00
                      {isCurrentHour && (
                        <div className="text-[10px] text-red-500 font-bold animate-pulse">ORA</div>
                      )}
                    </div>
                    <div className="flex-1 min-h-[40px] border-l-2 border-dashed border-gray-200 pl-4">
                      {/* Placeholder per appuntamenti */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {/* Today's Appointments */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                🔔 Oggi
              </h3>
              <span className="text-xs text-gray-400 font-medium">
                {formatDate(now)}
              </span>
            </div>

            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map(app => (
                  <div key={app.id} className="p-3 md:p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-blue-200 transition-all group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md ${getAppointmentColor(app.type)}`}>
                        {getAppointmentIcon(app.type)}
                      </div>
                      <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 truncate">{app.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(app.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-sm text-gray-400 font-medium">Nessun appuntamento oggi</p>
              </div>
            )}

            <button
              onClick={onAddAppointment}
              className="w-full mt-4 py-3 border border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-300 text-sm font-bold transition-all active:scale-95"
            >
              + Aggiungi impegno
            </button>
          </div>

          {/* Selected Date Info */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 md:p-6 rounded-2xl shadow-xl shadow-blue-200/50 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-black">{selectedDate.getDate()}</span>
              </div>
              <div>
                <p className="text-xs opacity-70 uppercase font-bold">{DAY_NAMES_FULL[getDayOfWeek(selectedDate)]}</p>
                <p className="font-bold">{MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}</p>
              </div>
            </div>
            <div className="text-xs opacity-80 mb-4">
              {isSameDay(selectedDate, now) ? (
                <span className="bg-white/20 px-2 py-1 rounded-full font-bold">Oggi</span>
              ) : (
                <span>{getAppointmentsForDate(selectedDate).length} appuntamenti</span>
              )}
            </div>
            <button
              onClick={onAddAppointment}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur text-white py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
            >
              + Nuovo Appuntamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
