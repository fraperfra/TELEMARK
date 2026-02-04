import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone, CheckCircle2, Clock, Users, Target, TrendingUp,
  PlayCircle, PauseCircle, SkipForward, RefreshCw, Calendar,
  ChevronRight, Filter, ArrowUp, ArrowDown, Flame, Snowflake,
  Sun, AlertCircle, CheckCheck, XCircle, PhoneOff, Building2
} from 'lucide-react';
import { Owner } from '../types';
import { supabase } from '../lib/supabase';

interface DailyFolder {
  id: string;
  date: string;
  status: 'active' | 'completed' | 'cancelled';
  total_contacts: number;
  total_followups: number;
  completed_calls: number;
  successful_calls: number;
  appointments_set: number;
  started_at: string;
  closed_at?: string;
}

interface DailyTaskItem {
  id: string;
  folder_id: string;
  owner_id: string;
  task_type: 'new_contact' | 'follow_up' | 'callback';
  priority: number;
  scheduled_time?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  call_outcome?: string;
  notes?: string;
  completed_at?: string;
  owner?: Owner;
}

interface DailyKPI {
  total_assigned: number;
  calls_made: number;
  appointments_set: number;
  conversion_rate: number;
  completion_rate: number;
}

interface DailyTasksPageProps {
  onSelectOwner: (ownerId: string) => void;
  onOpenCallModal: (owner: Owner) => void;
}

export const DailyTasksPage: React.FC<DailyTasksPageProps> = ({ onSelectOwner, onOpenCallModal }) => {
  const [folder, setFolder] = useState<DailyFolder | null>(null);
  const [tasks, setTasks] = useState<DailyTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // Carica cartella e task del giorno
  const loadDailyTasks = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // Carica cartella di oggi
      const today = new Date().toISOString().split('T')[0];
      const { data: folderData, error: folderError } = await supabase
        .from('daily_task_folders')
        .select('*')
        .eq('date', today)
        .single();

      if (folderError && folderError.code !== 'PGRST116') {
        console.error('Errore caricamento cartella:', folderError);
      }

      if (folderData) {
        setFolder(folderData);

        // Carica task con dati proprietario
        const { data: tasksData, error: tasksError } = await supabase
          .from('daily_task_items')
          .select(`
            *,
            owner:owners(*)
          `)
          .eq('folder_id', folderData.id)
          .order('priority', { ascending: false });

        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        // Trova primo task pendente
        const firstPending = (tasksData || []).findIndex(t => t.status === 'pending');
        if (firstPending >= 0) setCurrentTaskIndex(firstPending);
      } else {
        setFolder(null);
        setTasks([]);
      }
    } catch (error) {
      console.error('Errore caricamento task:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDailyTasks();
  }, [loadDailyTasks]);

  // Sottoscrizione realtime
  useEffect(() => {
    if (!supabase || !folder) return;

    const channel = supabase
      .channel('daily-tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_task_items', filter: `folder_id=eq.${folder.id}` },
        () => loadDailyTasks()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_task_folders', filter: `id=eq.${folder.id}` },
        () => loadDailyTasks()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [folder?.id, loadDailyTasks]);

  // Genera task giornalieri
  const generateDailyTasks = async () => {
    if (!supabase) return;
    setGenerating(true);

    try {
      const { error } = await supabase.rpc('generate_daily_tasks');
      if (error) throw error;
      await loadDailyTasks();
    } catch (error) {
      console.error('Errore generazione task:', error);
      alert('Errore nella generazione dei task');
    } finally {
      setGenerating(false);
    }
  };

  // Chiudi giornata
  const closeDailyTasks = async () => {
    if (!supabase || !folder) return;

    if (!confirm('Sei sicuro di voler chiudere la giornata? I risultati verranno salvati.')) return;

    try {
      const { error } = await supabase.rpc('close_daily_tasks');
      if (error) throw error;
      await loadDailyTasks();
    } catch (error) {
      console.error('Errore chiusura giornata:', error);
      alert('Errore nella chiusura');
    }
  };

  // Aggiorna stato task
  const updateTaskStatus = async (taskId: string, status: string, outcome?: string) => {
    if (!supabase) return;

    try {
      await supabase
        .from('daily_task_items')
        .update({
          status,
          call_outcome: outcome,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      // Aggiorna conteggi cartella
      if (folder) {
        const completed = tasks.filter(t => t.id === taskId ? status === 'completed' : t.status === 'completed').length;
        await supabase
          .from('daily_task_folders')
          .update({ completed_calls: completed })
          .eq('id', folder.id);
      }

      await loadDailyTasks();

      // Passa al prossimo task
      if (status === 'completed' || status === 'skipped') {
        const nextPending = tasks.findIndex((t, i) => i > currentTaskIndex && t.status === 'pending');
        if (nextPending >= 0) setCurrentTaskIndex(nextPending);
      }
    } catch (error) {
      console.error('Errore aggiornamento task:', error);
    }
  };

  // Filtra task
  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending' || t.status === 'in_progress';
    if (filter === 'completed') return t.status === 'completed' || t.status === 'skipped';
    return true;
  });

  // Statistiche
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    skipped: tasks.filter(t => t.status === 'skipped').length,
    followups: tasks.filter(t => t.task_type !== 'new_contact').length,
    appointments: tasks.filter(t => t.call_outcome === 'Appuntamento Fissato').length
  };

  const completionPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Render task type badge
  const TaskTypeBadge = ({ type }: { type: string }) => {
    const config = {
      new_contact: { label: 'Nuovo', icon: Users, color: 'bg-blue-100 text-blue-700' },
      follow_up: { label: 'Follow-up', icon: Calendar, color: 'bg-purple-100 text-purple-700' },
      callback: { label: 'Richiamata', icon: Phone, color: 'bg-amber-100 text-amber-700' }
    }[type] || { label: type, icon: Phone, color: 'bg-gray-100 text-gray-700' };

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Render temperature badge
  const TempBadge = ({ temp }: { temp?: string }) => {
    if (!temp) return null;
    const config = {
      HOT: { icon: Flame, color: 'text-red-500' },
      WARM: { icon: Sun, color: 'text-amber-500' },
      COLD: { icon: Snowflake, color: 'text-blue-500' }
    }[temp] || { icon: Sun, color: 'text-gray-500' };
    const Icon = config.icon;
    return <Icon className={`w-4 h-4 ${config.color}`} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Caricamento task...</p>
        </div>
      </div>
    );
  }

  // Nessuna cartella - genera nuova
  if (!folder) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Nessun task per oggi</h2>
          <p className="text-gray-500 mb-8">
            Genera la lista dei contatti da chiamare oggi, inclusi i follow-up programmati.
          </p>
          <button
            onClick={generateDailyTasks}
            disabled={generating}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-3"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                Genera Task Giornalieri
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Cartella completata
  if (folder.status === 'completed') {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header completato */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 md:p-8 text-white mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-8 h-8" />
              <h1 className="text-2xl font-black">Giornata Completata!</h1>
            </div>
            <p className="opacity-90">
              Hai chiuso la giornata alle {folder.closed_at ? new Date(folder.closed_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
          </div>

          {/* KPI Riepilogo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Chiamate</p>
              <p className="text-2xl font-black text-gray-900">{folder.completed_calls}/{folder.total_contacts + folder.total_followups}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Appuntamenti</p>
              <p className="text-2xl font-black text-green-600">{folder.appointments_set}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Successo</p>
              <p className="text-2xl font-black text-blue-600">{folder.successful_calls}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Conversion</p>
              <p className="text-2xl font-black text-purple-600">
                {folder.completed_calls > 0 ? Math.round((folder.appointments_set / folder.completed_calls) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Nuovo giorno */}
          <button
            onClick={generateDailyTasks}
            disabled={generating}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all"
          >
            Genera Task per Domani
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-8">
      {/* Header con progress */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">
              {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-2xl font-black">Task Giornalieri</h1>
          </div>
          <button
            onClick={closeDailyTasks}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            Chiudi Giornata
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>{stats.completed} completati</span>
            <span>{stats.pending} rimanenti</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-2xl font-black">{stats.total}</p>
            <p className="text-[10px] text-blue-200 uppercase">Totali</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black">{stats.followups}</p>
            <p className="text-[10px] text-blue-200 uppercase">Follow-up</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-green-300">{stats.appointments}</p>
            <p className="text-[10px] text-blue-200 uppercase">Appunt.</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black">{completionPercent}%</p>
            <p className="text-[10px] text-blue-200 uppercase">Progresso</p>
          </div>
        </div>
      </div>

      {/* Current task highlight */}
      {tasks[currentTaskIndex] && tasks[currentTaskIndex].status === 'pending' && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase">Prossima chiamata</p>
              <p className="font-black text-gray-900">
                {tasks[currentTaskIndex].owner?.firstName} {tasks[currentTaskIndex].owner?.lastName}
              </p>
            </div>
            <div className="ml-auto">
              <TaskTypeBadge type={tasks[currentTaskIndex].task_type} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (tasks[currentTaskIndex].owner) {
                  onOpenCallModal(tasks[currentTaskIndex].owner as Owner);
                }
              }}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Chiama Ora
            </button>
            <button
              onClick={() => updateTaskStatus(tasks[currentTaskIndex].id, 'skipped')}
              className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold active:scale-95 transition-all"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'Tutti', count: stats.total },
          { id: 'pending', label: 'Da fare', count: stats.pending },
          { id: 'completed', label: 'Completati', count: stats.completed }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {filteredTasks.map((task, index) => (
          <div
            key={task.id}
            className={`bg-white rounded-2xl border transition-all ${
              task.status === 'completed'
                ? 'border-green-200 bg-green-50/50'
                : task.status === 'skipped'
                ? 'border-gray-200 bg-gray-50 opacity-60'
                : index === currentTaskIndex
                ? 'border-blue-300 shadow-lg shadow-blue-100'
                : 'border-gray-100'
            }`}
          >
            <div
              className="p-4 flex items-center gap-3 cursor-pointer"
              onClick={() => task.owner && onSelectOwner(task.owner_id)}
            >
              {/* Status indicator */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                task.status === 'completed'
                  ? 'bg-green-100'
                  : task.status === 'skipped'
                  ? 'bg-gray-100'
                  : 'bg-blue-100'
              }`}>
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : task.status === 'skipped' ? (
                  <SkipForward className="w-5 h-5 text-gray-400" />
                ) : (
                  <span className="text-sm font-black text-blue-600">{index + 1}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-gray-900 truncate">
                    {task.owner?.firstName} {task.owner?.lastName}
                  </p>
                  <TempBadge temp={task.owner?.temperature} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <TaskTypeBadge type={task.task_type} />
                  {task.scheduled_time && (
                    <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.scheduled_time.slice(0, 5)}
                    </span>
                  )}
                  {task.call_outcome && (
                    <span className="text-[10px] font-medium text-gray-500">
                      {task.call_outcome}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {task.status === 'pending' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (task.owner) onOpenCallModal(task.owner as Owner);
                  }}
                  className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-200 active:scale-90 transition-all"
                >
                  <Phone className="w-4 h-4" />
                </button>
              )}

              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === 'pending' ? 'Tutti i task completati!' : 'Nessun task in questa categoria'}
          </p>
        </div>
      )}
    </div>
  );
};
