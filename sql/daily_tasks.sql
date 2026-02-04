-- Sistema Task Giornalieri ImmoCRM
-- Esegui questo script nell'SQL Editor di Supabase

-- ============================================
-- TABELLE
-- ============================================

-- Cartella task giornaliera
CREATE TABLE IF NOT EXISTS daily_task_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_contacts INTEGER DEFAULT 0,
  total_followups INTEGER DEFAULT 0,
  completed_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  appointments_set INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, date)
);

-- Singoli task nella cartella
CREATE TABLE IF NOT EXISTS daily_task_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID REFERENCES daily_task_folders(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('new_contact', 'follow_up', 'callback')),
  priority INTEGER DEFAULT 0, -- 0-100, più alto = più urgente
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  call_outcome TEXT,
  call_duration TEXT,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- KPI giornaliere
CREATE TABLE IF NOT EXISTS daily_kpis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Metriche chiamate
  total_assigned INTEGER DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  calls_answered INTEGER DEFAULT 0,
  calls_no_answer INTEGER DEFAULT 0,

  -- Esiti positivi
  appointments_set INTEGER DEFAULT 0,
  interested_leads INTEGER DEFAULT 0,
  callbacks_scheduled INTEGER DEFAULT 0,

  -- Esiti negativi
  not_interested INTEGER DEFAULT 0,
  wrong_numbers INTEGER DEFAULT 0,

  -- Tempo
  total_call_time_seconds INTEGER DEFAULT 0,
  avg_call_duration_seconds INTEGER DEFAULT 0,

  -- Performance
  conversion_rate DECIMAL(5,2) DEFAULT 0, -- % appuntamenti su chiamate
  contact_rate DECIMAL(5,2) DEFAULT 0, -- % risposte su chiamate
  completion_rate DECIMAL(5,2) DEFAULT 0, -- % completati su assegnati

  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, date)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_daily_folders_agent_date ON daily_task_folders(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_items_folder ON daily_task_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_daily_items_status ON daily_task_items(status);
CREATE INDEX IF NOT EXISTS idx_daily_kpis_agent_date ON daily_kpis(agent_id, date);

-- RLS
ALTER TABLE daily_task_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own folders" ON daily_task_folders FOR ALL USING (true);
CREATE POLICY "Users can manage own items" ON daily_task_items FOR ALL USING (true);
CREATE POLICY "Users can view own kpis" ON daily_kpis FOR ALL USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE daily_task_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_task_items;

-- ============================================
-- FUNZIONI
-- ============================================

-- Funzione per generare la lista giornaliera
CREATE OR REPLACE FUNCTION generate_daily_tasks(p_agent_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_folder_id UUID;
  v_contact_count INTEGER := 0;
  v_followup_count INTEGER := 0;
BEGIN
  -- Crea cartella giornaliera
  INSERT INTO daily_task_folders (agent_id, date, status)
  VALUES (p_agent_id, CURRENT_DATE, 'active')
  ON CONFLICT (agent_id, date) DO UPDATE SET status = 'active'
  RETURNING id INTO v_folder_id;

  -- Pulisci task esistenti se rigeneriamo
  DELETE FROM daily_task_items WHERE folder_id = v_folder_id;

  -- 1. Aggiungi FOLLOW-UP (priorità alta)
  -- Appuntamenti di richiamata schedulati per oggi
  INSERT INTO daily_task_items (folder_id, owner_id, task_type, priority, scheduled_time)
  SELECT
    v_folder_id,
    a.owner_id,
    'follow_up',
    90 + EXTRACT(HOUR FROM a.date::time)::int, -- Priorità basata sull'ora
    a.date::time
  FROM appointments a
  JOIN owners o ON a.owner_id = o.id
  WHERE a.date::date = CURRENT_DATE
    AND a.type = 'CALL'
    AND (p_agent_id IS NULL OR o.agent_id = p_agent_id);

  GET DIAGNOSTICS v_followup_count = ROW_COUNT;

  -- 2. Aggiungi CALLBACK (proprietari con esito "Richiamare")
  INSERT INTO daily_task_items (folder_id, owner_id, task_type, priority)
  SELECT
    v_folder_id,
    o.id,
    'callback',
    80
  FROM owners o
  WHERE o."esitoChiamata" IN ('Richiamare', 'Occupato adesso', 'Attesa Info')
    AND (p_agent_id IS NULL OR o.agent_id = p_agent_id)
    AND NOT EXISTS (
      SELECT 1 FROM daily_task_items dti
      WHERE dti.folder_id = v_folder_id AND dti.owner_id = o.id
    )
  LIMIT 30;

  -- 3. Aggiungi NUOVI CONTATTI (per arrivare a 100)
  INSERT INTO daily_task_items (folder_id, owner_id, task_type, priority)
  SELECT
    v_folder_id,
    o.id,
    'new_contact',
    CASE
      WHEN o.temperature = 'HOT' THEN 70
      WHEN o.temperature = 'WARM' THEN 50
      ELSE 30
    END + COALESCE(o.score, 0) / 10
  FROM owners o
  WHERE (o."esitoChiamata" IS NULL OR o."esitoChiamata" = '')
    AND (p_agent_id IS NULL OR o.agent_id = p_agent_id)
    AND NOT EXISTS (
      SELECT 1 FROM daily_task_items dti
      WHERE dti.folder_id = v_folder_id AND dti.owner_id = o.id
    )
  ORDER BY
    CASE WHEN o.temperature = 'HOT' THEN 1 WHEN o.temperature = 'WARM' THEN 2 ELSE 3 END,
    o.score DESC NULLS LAST,
    o.created_at DESC
  LIMIT (100 - (SELECT COUNT(*) FROM daily_task_items WHERE folder_id = v_folder_id));

  -- Conta totali
  SELECT COUNT(*) INTO v_contact_count
  FROM daily_task_items
  WHERE folder_id = v_folder_id AND task_type = 'new_contact';

  SELECT COUNT(*) INTO v_followup_count
  FROM daily_task_items
  WHERE folder_id = v_folder_id AND task_type IN ('follow_up', 'callback');

  -- Aggiorna conteggi cartella
  UPDATE daily_task_folders
  SET total_contacts = v_contact_count, total_followups = v_followup_count
  WHERE id = v_folder_id;

  -- Crea notifica
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    p_agent_id,
    'info',
    '📋 Task giornalieri pronti!',
    'Hai ' || v_contact_count || ' nuovi contatti e ' || v_followup_count || ' follow-up da completare oggi.'
  );

  RETURN v_folder_id;
END;
$$ LANGUAGE plpgsql;

-- Funzione per chiudere la giornata e calcolare KPI
CREATE OR REPLACE FUNCTION close_daily_tasks(p_agent_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_folder RECORD;
  v_stats RECORD;
BEGIN
  -- Per ogni cartella attiva di oggi
  FOR v_folder IN
    SELECT * FROM daily_task_folders
    WHERE date = CURRENT_DATE
      AND status = 'active'
      AND (p_agent_id IS NULL OR agent_id = p_agent_id)
  LOOP
    -- Calcola statistiche
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE call_outcome = 'Appuntamento Fissato') as appointments,
      COUNT(*) FILTER (WHERE call_outcome IN ('Appuntamento Fissato', 'Richiamare', 'Attesa Info')) as interested,
      COUNT(*) FILTER (WHERE call_outcome = 'Richiamare') as callbacks,
      COUNT(*) FILTER (WHERE call_outcome = 'Non interessato') as not_interested,
      COUNT(*) FILTER (WHERE call_outcome IN ('Nessuna risposta', 'Numero errato')) as no_answer
    INTO v_stats
    FROM daily_task_items
    WHERE folder_id = v_folder.id;

    -- Aggiorna cartella
    UPDATE daily_task_folders SET
      status = 'completed',
      completed_calls = v_stats.completed,
      successful_calls = v_stats.interested,
      appointments_set = v_stats.appointments,
      closed_at = now()
    WHERE id = v_folder.id;

    -- Inserisci/Aggiorna KPI giornaliere
    INSERT INTO daily_kpis (
      agent_id, date,
      total_assigned, calls_made, calls_answered, calls_no_answer,
      appointments_set, interested_leads, callbacks_scheduled,
      not_interested, wrong_numbers,
      conversion_rate, contact_rate, completion_rate
    ) VALUES (
      v_folder.agent_id,
      CURRENT_DATE,
      v_stats.total,
      v_stats.completed,
      v_stats.completed - v_stats.no_answer,
      v_stats.no_answer,
      v_stats.appointments,
      v_stats.interested,
      v_stats.callbacks,
      v_stats.not_interested,
      0,
      CASE WHEN v_stats.completed > 0 THEN (v_stats.appointments::decimal / v_stats.completed * 100) ELSE 0 END,
      CASE WHEN v_stats.completed > 0 THEN ((v_stats.completed - v_stats.no_answer)::decimal / v_stats.completed * 100) ELSE 0 END,
      CASE WHEN v_stats.total > 0 THEN (v_stats.completed::decimal / v_stats.total * 100) ELSE 0 END
    )
    ON CONFLICT (agent_id, date) DO UPDATE SET
      calls_made = EXCLUDED.calls_made,
      calls_answered = EXCLUDED.calls_answered,
      calls_no_answer = EXCLUDED.calls_no_answer,
      appointments_set = EXCLUDED.appointments_set,
      interested_leads = EXCLUDED.interested_leads,
      callbacks_scheduled = EXCLUDED.callbacks_scheduled,
      not_interested = EXCLUDED.not_interested,
      conversion_rate = EXCLUDED.conversion_rate,
      contact_rate = EXCLUDED.contact_rate,
      completion_rate = EXCLUDED.completion_rate;

    -- Notifica chiusura
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      v_folder.agent_id,
      'success',
      '🏁 Giornata completata!',
      'Hai completato ' || v_stats.completed || '/' || v_stats.total || ' chiamate. ' ||
      v_stats.appointments || ' appuntamenti fissati. Conversion rate: ' ||
      ROUND(CASE WHEN v_stats.completed > 0 THEN (v_stats.appointments::decimal / v_stats.completed * 100) ELSE 0 END, 1) || '%'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULED JOBS (richiede pg_cron extension)
-- ============================================

-- Se hai pg_cron abilitato, esegui questi comandi:
--
-- Genera task alle 8:00 ogni giorno
-- SELECT cron.schedule('generate-daily-tasks', '0 8 * * *', 'SELECT generate_daily_tasks(NULL)');
--
-- Chiudi giornata alle 20:00
-- SELECT cron.schedule('close-daily-tasks', '0 20 * * *', 'SELECT close_daily_tasks(NULL)');

-- ============================================
-- FUNZIONE MANUALE PER TEST
-- ============================================

-- Per testare manualmente:
-- SELECT generate_daily_tasks(NULL); -- Genera per tutti gli agenti
-- SELECT close_daily_tasks(NULL); -- Chiude per tutti gli agenti
