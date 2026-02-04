import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Phone, CheckCircle2, Clock, Users, Target, TrendingUp,
  PlayCircle, SkipForward, RefreshCw, Calendar,
  ChevronRight, ChevronUp, ChevronDown, Flame, Snowflake,
  Sun, CheckCheck, Archive, Trash2, Edit3, GripVertical,
  MoreVertical, X, MessageSquare, ArrowUpCircle, ArrowDownCircle
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
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'archived';
  call_outcome?: string;
  notes?: string;
  completed_at?: string;
  owner?: Owner;
}

interface DailyTasksPageProps {
  onSelectOwner: (ownerId: string) => void;
  onOpenCallModal: (owner: Owner, onCallEnd?: (outcome: string, taskId: string) => void) => void;
}

export const DailyTasksPage: React.FC<DailyTasksPageProps> = ({ onSelectOwner, onOpenCallModal }) => {
  const [folder, setFolder] = useState<DailyFolder | null>(null);
  const [tasks, setTasks] = useState<DailyTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [sortBy, setSortBy] = useState<'priority' | 'name' | 'type'>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Carica cartella e task del giorno
  const loadDailyTasks = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    try {
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

        const { data: tasksData, error: tasksError } = await supabase
          .from('daily_task_items')
          .select(`*, owner:owners(*)`)
          .eq('folder_id', folderData.id)
          .order('priority', { ascending: false });

        if (tasksError) throw tasksError;
        setTasks(tasksData || []);
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

  // Realtime subscription
  useEffect(() => {
    if (!supabase || !folder) return;

    const channel = supabase
      .channel('daily-tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_task_items', filter: `folder_id=eq.${folder.id}` }, () => loadDailyTasks())
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
    if (!confirm('Chiudere la giornata? I risultati verranno salvati.')) return;
    try {
      const { error } = await supabase.rpc('close_daily_tasks');
      if (error) throw error;
      await loadDailyTasks();
    } catch (error) {
      console.error('Errore chiusura giornata:', error);
    }
  };

  // Archivia task e crea follow-up
  const archiveTaskWithFollowUp = async (taskId: string, outcome: string) => {
    if (!supabase || !folder) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      // 1. Archivia il task corrente
      await supabase
        .from('daily_task_items')
        .update({
          status: 'archived',
          call_outcome: outcome,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      // 2. Se l'esito richiede follow-up, crea appuntamento
      const followUpOutcomes = ['Richiamare', 'Attesa Info', 'Occupato adesso'];
      if (followUpOutcomes.includes(outcome) && task.owner) {
        // Crea appuntamento per domani
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);

        await supabase.from('appointments').insert({
          owner_id: task.owner_id,
          date: tomorrow.toISOString(),
          type: 'CALL',
          title: `Richiamata: ${task.owner.firstName} ${task.owner.lastName}`,
          whatsappScript: generateWhatsAppScript(task.owner, outcome),
          voiceScript: generateVoiceScript(task.owner, outcome)
        });

        // Notifica
        await supabase.from('notifications').insert({
          type: 'appointment',
          title: 'Follow-up programmato',
          message: `Richiamata ${task.owner.firstName} ${task.owner.lastName} programmata per domani alle 10:00`,
          owner_id: task.owner_id
        });
      }

      // 3. Aggiorna esito sul proprietario
      await supabase
        .from('owners')
        .update({ esitoChiamata: outcome, lastContact: new Date().toLocaleDateString('it-IT') })
        .eq('id', task.owner_id);

      await loadDailyTasks();
    } catch (error) {
      console.error('Errore archiviazione:', error);
    }
  };

  // Script generators
  const generateWhatsAppScript = (owner: Owner, outcome: string) => {
    return `Buongiorno ${owner.firstName},\n\nLa contatto in seguito alla nostra telefonata di oggi. Come concordato, le scrivo per ${
      outcome === 'Richiamare' ? 'fissare un nuovo appuntamento telefonico' :
      outcome === 'Attesa Info' ? 'inviarle le informazioni richieste' :
      'risentirci in un momento più comodo per lei'
    }.\n\nResto a disposizione.\nCordiali saluti`;
  };

  const generateVoiceScript = (owner: Owner, outcome: string) => {
    return `Buongiorno ${owner.firstName}, sono [Nome] dell'agenzia immobiliare. La richiamo come d'accordo. ${
      outcome === 'Richiamare' ? 'Ha avuto modo di riflettere sulla nostra proposta?' :
      outcome === 'Attesa Info' ? 'Ho le informazioni che mi aveva richiesto.' :
      'Spero di trovarla in un momento più comodo.'
    }`;
  };

  // Chiama e archivia
  const handleCall = (task: DailyTaskItem) => {
    if (!task.owner) return;

    // Apri modal chiamata con callback per archiviazione
    onOpenCallModal(task.owner, (outcome: string) => {
      archiveTaskWithFollowUp(task.id, outcome);
    });
  };

  // Elimina task
  const deleteTask = async (taskId: string) => {
    if (!supabase) return;
    if (!confirm('Eliminare questo contatto dalla lista?')) return;

    try {
      await supabase.from('daily_task_items').delete().eq('id', taskId);
      await loadDailyTasks();
    } catch (error) {
      console.error('Errore eliminazione:', error);
    }
  };

  // Modifica priorità (sposta su/giù)
  const movePriority = async (taskId: string, direction: 'up' | 'down') => {
    if (!supabase) return;

    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex < 0) return;

    const swapIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    if (swapIndex < 0 || swapIndex >= tasks.length) return;

    const task = tasks[taskIndex];
    const swapTask = tasks[swapIndex];

    try {
      // Scambia priorità
      await supabase.from('daily_task_items').update({ priority: swapTask.priority }).eq('id', task.id);
      await supabase.from('daily_task_items').update({ priority: task.priority }).eq('id', swapTask.id);
      await loadDailyTasks();
    } catch (error) {
      console.error('Errore spostamento:', error);
    }
  };

  // Salva note
  const saveNotes = async (taskId: string) => {
    if (!supabase) return;

    try {
      await supabase.from('daily_task_items').update({ notes: editNotes }).eq('id', taskId);
      setEditingTask(null);
      setEditNotes('');
      await loadDailyTasks();
    } catch (error) {
      console.error('Errore salvataggio note:', error);
    }
  };

  // Archivia manualmente
  const archiveTask = async (taskId: string) => {
    if (!supabase) return;
    try {
      await supabase
        .from('daily_task_items')
        .update({ status: 'archived', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      await loadDailyTasks();
    } catch (error) {
      console.error('Errore archiviazione:', error);
    }
  };

  // Ripristina da archivio
  const restoreTask = async (taskId: string) => {
    if (!supabase) return;
    try {
      await supabase
        .from('daily_task_items')
        .update({ status: 'pending', completed_at: null })
        .eq('id', taskId);
      await loadDailyTasks();
    } catch (error) {
      console.error('Errore ripristino:', error);
    }
  };

  // Ordina task
  const sortedTasks = [...tasks]
    .filter(t => filter === 'active' ? !['archived', 'completed'].includes(t.status) : ['archived', 'completed'].includes(t.status))
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'priority') cmp = a.priority - b.priority;
      else if (sortBy === 'name') cmp = `${a.owner?.lastName}`.localeCompare(`${b.owner?.lastName}`);
      else if (sortBy === 'type') cmp = a.task_type.localeCompare(b.task_type);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  // Stats
  const stats = {
    total: tasks.length,
    active: tasks.filter(t => !['archived', 'completed'].includes(t.status)).length,
    archived: tasks.filter(t => ['archived', 'completed'].includes(t.status)).length,
    appointments: tasks.filter(t => t.call_outcome === 'Appuntamento Fissato').length
  };

  const completionPercent = stats.total > 0 ? Math.round((stats.archived / stats.total) * 100) : 0;

  // Components
  const TaskTypeBadge = ({ type }: { type: string }) => {
    const config: Record<string, { label: string; color: string }> = {
      new_contact: { label: 'Nuovo', color: 'bg-blue-100 text-blue-700' },
      follow_up: { label: 'Follow-up', color: 'bg-purple-100 text-purple-700' },
      callback: { label: 'Richiamata', color: 'bg-amber-100 text-amber-700' }
    };
    const c = config[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.color}`}>{c.label}</span>;
  };

  const TempBadge = ({ temp }: { temp?: string }) => {
    if (!temp) return null;
    const config: Record<string, { icon: any; color: string }> = {
      HOT: { icon: Flame, color: 'text-red-500' },
      WARM: { icon: Sun, color: 'text-amber-500' },
      COLD: { icon: Snowflake, color: 'text-blue-500' }
    };
    const c = config[temp];
    if (!c) return null;
    const Icon = c.icon;
    return <Icon className={`w-4 h-4 ${c.color}`} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Nessun task per oggi</h2>
          <p className="text-gray-500 mb-8">Genera la lista dei contatti da chiamare.</p>
          <button
            onClick={generateDailyTasks}
            disabled={generating}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all inline-flex items-center gap-3 disabled:opacity-50"
          >
            {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            {generating ? 'Generazione...' : 'Genera Task Giornalieri'}
          </button>
        </div>
      </div>
    );
  }

  if (folder.status === 'completed') {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white mb-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-8 h-8" />
              <h1 className="text-2xl font-black">Giornata Completata!</h1>
            </div>
            <p className="opacity-90">Chiusa alle {folder.closed_at ? new Date(folder.closed_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-black text-gray-900">{folder.completed_calls}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Chiamate</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-black text-green-600">{folder.appointments_set}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Appuntamenti</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-black text-blue-600">{folder.successful_calls}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Successo</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-black text-purple-600">
                {folder.completed_calls > 0 ? Math.round((folder.appointments_set / folder.completed_calls) * 100) : 0}%
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Conversion</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-sm">{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-2xl font-black">Task Giornalieri</h1>
          </div>
          <button onClick={closeDailyTasks} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold transition-all">
            Chiudi Giornata
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>{stats.archived} completati</span>
            <span>{stats.active} da fare</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div><p className="text-2xl font-black">{stats.total}</p><p className="text-[10px] text-blue-200 uppercase">Totali</p></div>
          <div><p className="text-2xl font-black">{stats.active}</p><p className="text-[10px] text-blue-200 uppercase">Attivi</p></div>
          <div><p className="text-2xl font-black text-green-300">{stats.appointments}</p><p className="text-[10px] text-blue-200 uppercase">Appunt.</p></div>
          <div><p className="text-2xl font-black">{completionPercent}%</p><p className="text-[10px] text-blue-200 uppercase">Progresso</p></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'active' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            Attivi ({stats.active})
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'archived' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            <Archive className="w-4 h-4 inline mr-1" />
            Archivio ({stats.archived})
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-600"
          >
            <option value="priority">Priorità</option>
            <option value="name">Nome</option>
            <option value="type">Tipo</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"
          >
            {sortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {sortedTasks.map((task, index) => (
          <div
            key={task.id}
            className={`bg-white rounded-2xl border transition-all ${
              task.status === 'archived' ? 'border-gray-200 bg-gray-50' : 'border-gray-100 hover:border-blue-200 hover:shadow-md'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Drag handle & priority controls */}
                {filter === 'active' && (
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => movePriority(task.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-gray-400">{index + 1}</span>
                    <button
                      onClick={() => movePriority(task.id, 'down')}
                      disabled={index === sortedTasks.length - 1}
                      className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Main content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => task.owner && onSelectOwner(task.owner_id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-bold truncate ${task.status === 'archived' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {task.owner?.firstName} {task.owner?.lastName}
                    </p>
                    <TempBadge temp={task.owner?.temperature} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <TaskTypeBadge type={task.task_type} />
                    {task.call_outcome && (
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {task.call_outcome}
                      </span>
                    )}
                    {task.notes && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Note
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {filter === 'active' ? (
                    <>
                      <button
                        onClick={() => handleCall(task)}
                        className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-200 active:scale-90 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === task.id ? null : task.id)}
                          className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {showActions === task.id && (
                          <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20 min-w-[160px]">
                            <button
                              onClick={() => { setEditingTask(task.id); setEditNotes(task.notes || ''); setShowActions(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" /> Modifica note
                            </button>
                            <button
                              onClick={() => { archiveTask(task.id); setShowActions(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Archive className="w-4 h-4" /> Archivia
                            </button>
                            <button
                              onClick={() => { deleteTask(task.id); setShowActions(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Elimina
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => restoreTask(task.id)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-200"
                    >
                      Ripristina
                    </button>
                  )}
                </div>
              </div>

              {/* Edit notes inline */}
              {editingTask === task.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Aggiungi note..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => { setEditingTask(null); setEditNotes(''); }}
                      className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => saveNotes(task.id)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium"
                    >
                      Salva
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {sortedTasks.length === 0 && (
        <div className="text-center py-12">
          {filter === 'active' ? (
            <>
              <CheckCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Tutti i task completati!</p>
            </>
          ) : (
            <>
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nessun task archiviato</p>
            </>
          )}
        </div>
      )}

      {/* Click outside to close actions menu */}
      {showActions && (
        <div className="fixed inset-0 z-10" onClick={() => setShowActions(null)} />
      )}
    </div>
  );
};
