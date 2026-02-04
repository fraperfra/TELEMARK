
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Phone, Users, Flame, Calendar, ArrowUpRight, ArrowDownRight, Plus, Upload, Play } from 'lucide-react';
import { ModalType, Owner } from '../types';
import { supabase } from '../lib/supabase';

const data = [
  { name: 'Lun', value: 45 },
  { name: 'Mar', value: 52 },
  { name: 'Mer', value: 38 },
  { name: 'Gio', value: 65 },
  { name: 'Ven', value: 48 },
  { name: 'Sab', value: 30 },
  { name: 'Dom', value: 15 },
];

interface DashboardProps {
  onNavigateToOwner: (id: string) => void;
  onOpenModal: (type: ModalType, owner?: Owner) => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  trend: string;
  isUp: boolean;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, isUp, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trend}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToOwner, onOpenModal }) => {
  const [stats, setStats] = useState({
    ownersTotal: 0,
    ownersToday: 0,
    ownersYesterday: 0,
    callsToday: 0,
    callsYesterday: 0,
    hotLeads: 0,
    hotLeadsYesterday: 0,
    appointmentsToday: 0,
    appointmentsYesterday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;

    const loadStats = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayEnd);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

        const [
          ownersTotal,
          ownersToday,
          ownersYesterday,
          callsToday,
          callsYesterday,
          hotLeads,
          hotLeadsYesterday,
          appointmentsToday,
          appointmentsYesterday,
        ] = await Promise.all([
          supabase.from('owners').select('id', { count: 'exact', head: true }),
          supabase.from('owners').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).lte('created_at', todayEnd.toISOString()),
          supabase.from('owners').select('id', { count: 'exact', head: true }).gte('created_at', yesterdayStart.toISOString()).lte('created_at', yesterdayEnd.toISOString()),
          supabase.from('calls').select('id', { count: 'exact', head: true }).gte('date', todayStart.toISOString()).lte('date', todayEnd.toISOString()),
          supabase.from('calls').select('id', { count: 'exact', head: true }).gte('date', yesterdayStart.toISOString()).lte('date', yesterdayEnd.toISOString()),
          supabase.from('owners').select('id', { count: 'exact', head: true }).eq('temperature', 'HOT'),
          supabase.from('owners').select('id', { count: 'exact', head: true }).eq('temperature', 'HOT').gte('created_at', yesterdayStart.toISOString()).lte('created_at', yesterdayEnd.toISOString()),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('date', todayStart.toISOString()).lte('date', todayEnd.toISOString()),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('date', yesterdayStart.toISOString()).lte('date', yesterdayEnd.toISOString()),
        ]);

        setStats({
          ownersTotal: ownersTotal.count || 0,
          ownersToday: ownersToday.count || 0,
          ownersYesterday: ownersYesterday.count || 0,
          callsToday: callsToday.count || 0,
          callsYesterday: callsYesterday.count || 0,
          hotLeads: hotLeads.count || 0,
          hotLeadsYesterday: hotLeadsYesterday.count || 0,
          appointmentsToday: appointmentsToday.count || 0,
          appointmentsYesterday: appointmentsYesterday.count || 0,
        });
      } catch (error) {
        console.error('Errore caricamento dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    const channel = supabase
      .channel('dashboard-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'owners' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, loadStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatChange = (today: number, yesterday: number) => {
    if (yesterday === 0) {
      return today === 0 ? '0%' : '+100%';
    }
    const diff = ((today - yesterday) / yesterday) * 100;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Bentornato, ecco i tuoi progressi di oggi 📈</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onOpenModal('ADD_OWNER')}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            Nuovo Proprietario
          </button>
          <button 
            onClick={() => onOpenModal('BULK_CALL')}
            className="flex items-center gap-2 bg-blue-600 px-4 py-2.5 rounded-xl font-semibold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            Inizia Chiamate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Totale Proprietari"
          value={loading ? '—' : stats.ownersTotal.toLocaleString()}
          trend={loading ? '—' : formatChange(stats.ownersToday, stats.ownersYesterday)}
          isUp={stats.ownersToday >= stats.ownersYesterday}
          icon="📊"
          color="bg-blue-100"
        />
        <StatCard
          title="Chiamate Oggi"
          value={loading ? '—' : stats.callsToday.toLocaleString()}
          trend={loading ? '—' : formatChange(stats.callsToday, stats.callsYesterday)}
          isUp={stats.callsToday >= stats.callsYesterday}
          icon="📞"
          color="bg-green-100"
        />
        <StatCard
          title="Lead Caldi"
          value={loading ? '—' : stats.hotLeads.toLocaleString()}
          trend={loading ? '—' : formatChange(stats.hotLeads, stats.hotLeadsYesterday)}
          isUp={stats.hotLeads >= stats.hotLeadsYesterday}
          icon="🔥"
          color="bg-red-100"
        />
        <StatCard
          title="Appuntamenti"
          value={loading ? '—' : stats.appointmentsToday.toLocaleString()}
          trend={loading ? '—' : formatChange(stats.appointmentsToday, stats.appointmentsYesterday)}
          isUp={stats.appointmentsToday >= stats.appointmentsYesterday}
          icon="📅"
          color="bg-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-w-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Andamento Chiamate</h3>
              <p className="text-sm text-gray-500">Ultime 7 giornate</p>
            </div>
            <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
              <option>Settimana</option>
              <option>Mese</option>
            </select>
          </div>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: '#3B82F6', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            🚀 Prossimi Follow-up
          </h3>
          <div className="space-y-4">
            {[
              { id: '1', name: 'Marco Rossi', time: '14:30', urgent: true },
              { id: '2', name: 'Laura Bianchi', time: '16:00', urgent: false },
              { id: '3', name: 'Roberto Esposito', time: '17:15', urgent: false },
              { id: '4', name: 'Giuseppe Verdi', time: 'Dom 10:00', urgent: false },
            ].map((f) => (
              <div 
                key={f.id} 
                onClick={() => onNavigateToOwner(f.id)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${f.urgent ? 'bg-red-500 shadow-lg shadow-red-200' : 'bg-blue-500 shadow-lg shadow-blue-200'}`}>
                  {f.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{f.name}</p>
                  <p className="text-xs text-gray-500">Chiamata fissata</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${f.urgent ? 'text-red-500' : 'text-gray-400'}`}>{f.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2.5 text-blue-600 font-bold text-sm bg-blue-50 hover:bg-blue-100 rounded-xl transition-all">
            Vedi Tutti
          </button>
        </div>
      </div>
    </div>
  );
};
