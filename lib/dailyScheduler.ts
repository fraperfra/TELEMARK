import { supabase } from './supabase';

// Scheduler per task giornalieri
// Controlla e esegue operazioni programmate

interface SchedulerState {
  lastGenerateCheck: string | null;
  lastCloseCheck: string | null;
}

const STORAGE_KEY = 'immocrm_scheduler_state';

// Ottieni stato salvato
const getState = (): SchedulerState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { lastGenerateCheck: null, lastCloseCheck: null };
  } catch {
    return { lastGenerateCheck: null, lastCloseCheck: null };
  }
};

// Salva stato
const saveState = (state: SchedulerState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// Controlla se è ora di generare task (8:00)
export const checkAndGenerateDailyTasks = async () => {
  if (!supabase) return;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const hour = now.getHours();

  const state = getState();

  // Genera task se:
  // 1. Sono le 8:00 o dopo
  // 2. Non abbiamo già generato oggi
  if (hour >= 8 && state.lastGenerateCheck !== today) {
    try {
      // Verifica se esiste già una cartella per oggi
      const { data: existing } = await supabase
        .from('daily_task_folders')
        .select('id')
        .eq('date', today)
        .single();

      if (!existing) {
        console.log('[Scheduler] Generazione task giornalieri...');
        await supabase.rpc('generate_daily_tasks');
        console.log('[Scheduler] Task generati con successo');
      }

      saveState({ ...state, lastGenerateCheck: today });
    } catch (error) {
      console.error('[Scheduler] Errore generazione task:', error);
    }
  }
};

// Controlla se è ora di chiudere la giornata (20:00)
export const checkAndCloseDailyTasks = async () => {
  if (!supabase) return;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const hour = now.getHours();

  const state = getState();

  // Chiudi task se:
  // 1. Sono le 20:00 o dopo
  // 2. Non abbiamo già chiuso oggi
  if (hour >= 20 && state.lastCloseCheck !== today) {
    try {
      // Verifica se esiste una cartella attiva per oggi
      const { data: folder } = await supabase
        .from('daily_task_folders')
        .select('id, status')
        .eq('date', today)
        .eq('status', 'active')
        .single();

      if (folder) {
        console.log('[Scheduler] Chiusura giornata lavorativa...');
        await supabase.rpc('close_daily_tasks');
        console.log('[Scheduler] Giornata chiusa con successo');
      }

      saveState({ ...state, lastCloseCheck: today });
    } catch (error) {
      console.error('[Scheduler] Errore chiusura giornata:', error);
    }
  }
};

// Esegui tutti i controlli
export const runSchedulerChecks = async () => {
  await checkAndGenerateDailyTasks();
  await checkAndCloseDailyTasks();
};

// Inizializza scheduler con intervallo
let schedulerInterval: NodeJS.Timeout | null = null;

export const initDailyScheduler = () => {
  // Esegui immediatamente al caricamento
  runSchedulerChecks();

  // Controlla ogni 5 minuti
  if (schedulerInterval) clearInterval(schedulerInterval);
  schedulerInterval = setInterval(runSchedulerChecks, 5 * 60 * 1000);

  console.log('[Scheduler] Inizializzato - controllo ogni 5 minuti');

  return () => {
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }
  };
};

// Forza generazione manuale
export const forceGenerateTasks = async () => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('generate_daily_tasks');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Errore generazione forzata:', error);
    throw error;
  }
};

// Forza chiusura manuale
export const forceCloseTasks = async () => {
  if (!supabase) return;

  try {
    const { error } = await supabase.rpc('close_daily_tasks');
    if (error) throw error;
  } catch (error) {
    console.error('Errore chiusura forzata:', error);
    throw error;
  }
};
