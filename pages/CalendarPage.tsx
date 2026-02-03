
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Video, Phone, Users } from 'lucide-react';
import { MOCK_APPOINTMENTS } from '../constants';

export const CalendarPage: React.FC = () => {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario Appuntamenti</h1>
          <p className="text-gray-500">Gestisci i tuoi sopralluoghi e call pianificate 📅</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex items-center">
            <button onClick={() => setView('month')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'month' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}>Mese</button>
            <button onClick={() => setView('week')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'week' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}>Settimana</button>
            <button onClick={() => setView('day')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'day' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}>Giorno</button>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4" /> Nuovo Appuntamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Calendar View Placeholder */}
        <div className="lg:col-span-9 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900 uppercase">Ottobre 2023</h2>
              <div className="flex items-center gap-2">
                <button className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></button>
                <button className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-inner">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
              <div key={day} className="bg-gray-50 py-3 text-center text-xs font-bold text-gray-500 uppercase">{day}</div>
            ))}
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i} className={`bg-white min-h-[120px] p-2 relative group hover:bg-blue-50/30 transition-colors ${i + 1 === 27 ? 'bg-blue-50/50' : ''}`}>
                <span className={`text-sm font-bold ${i + 1 === 27 ? 'text-blue-600 flex items-center justify-center w-7 h-7 bg-white rounded-full shadow-sm mx-auto' : 'text-gray-400'}`}>
                  {i + 1}
                </span>
                {i + 1 === 27 && (
                  <div className="mt-2 space-y-1">
                    <div className="p-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold truncate shadow-md shadow-blue-100">🏠 Visita Rossi</div>
                    <div className="p-1.5 bg-green-500 text-white rounded-lg text-[10px] font-bold truncate shadow-md shadow-green-100">📞 Call Bianchi</div>
                  </div>
                )}
                {i + 1 === 30 && (
                   <div className="mt-2">
                    <div className="p-1.5 bg-purple-500 text-white rounded-lg text-[10px] font-bold truncate shadow-md shadow-purple-100">📝 Firma Incarico</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel - Upcoming List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              🔔 Oggi
            </h3>
            <div className="space-y-4">
              {MOCK_APPOINTMENTS.slice(0, 2).map(app => (
                <div key={app.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:border-blue-200 transition-all group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md ${
                      app.type === 'VISIT' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {app.type === 'VISIT' ? <MapPin className="w-4 h-4" /> : <Phone className="w-4 h-4 fill-current" />}
                    </div>
                    <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600">{app.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{app.date.split(' ')[1]}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 border border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-300 text-sm font-bold transition-all">
              + Aggiungi impegno
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-xl shadow-blue-200 text-white">
            <h3 className="text-lg font-bold mb-2">Migliora la tua agenda 🚀</h3>
            <p className="text-xs opacity-80 leading-relaxed mb-6">L'intelligenza artificiale ha notato che il martedì pomeriggio sei più produttivo nelle call.</p>
            <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur text-white py-2.5 rounded-xl text-sm font-bold transition-all">
              Ottimizza Settimana
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
