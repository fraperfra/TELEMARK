-- Tabella Notifiche per ImmoCRM
-- Esegui questo script nell'SQL Editor di Supabase

-- Crea tabella notifiche
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error, call, appointment, owner
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL opzionale per navigazione
  owner_id UUID REFERENCES owners(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Abilita RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: utenti vedono solo le proprie notifiche
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: sistema puo inserire notifiche per qualsiasi utente
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Abilita Realtime per la tabella
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Funzione per creare notifica quando viene assegnato un proprietario
CREATE OR REPLACE FUNCTION notify_owner_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agent_id IS NOT NULL AND (OLD.agent_id IS NULL OR OLD.agent_id != NEW.agent_id) THEN
    INSERT INTO notifications (user_id, type, title, message, owner_id)
    VALUES (
      NEW.agent_id,
      'owner',
      'Nuovo proprietario assegnato',
      'Ti è stato assegnato ' || COALESCE(NEW."firstName", '') || ' ' || COALESCE(NEW."lastName", ''),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per notifica assegnazione proprietario
DROP TRIGGER IF EXISTS trigger_owner_assigned ON owners;
CREATE TRIGGER trigger_owner_assigned
  AFTER INSERT OR UPDATE ON owners
  FOR EACH ROW EXECUTE FUNCTION notify_owner_assigned();

-- Funzione per creare notifica appuntamento
CREATE OR REPLACE FUNCTION notify_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
  owner_name TEXT;
  agent_uuid UUID;
BEGIN
  -- Ottieni nome proprietario e agent_id
  SELECT COALESCE("firstName", '') || ' ' || COALESCE("lastName", ''), agent_id
  INTO owner_name, agent_uuid
  FROM owners WHERE id = NEW.owner_id;

  IF agent_uuid IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, owner_id)
    VALUES (
      agent_uuid,
      'appointment',
      'Nuovo appuntamento',
      'Appuntamento con ' || owner_name || ' il ' || TO_CHAR(NEW.date, 'DD/MM/YYYY HH24:MI'),
      NEW.owner_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per notifica appuntamento
DROP TRIGGER IF EXISTS trigger_appointment_created ON appointments;
CREATE TRIGGER trigger_appointment_created
  AFTER INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION notify_appointment_created();

-- Funzione per notifica promemoria (da chiamare con pg_cron o scheduled function)
CREATE OR REPLACE FUNCTION create_call_reminders()
RETURNS void AS $$
BEGIN
  -- Crea promemoria per appuntamenti nelle prossime 24 ore
  INSERT INTO notifications (user_id, type, title, message, owner_id)
  SELECT
    o.agent_id,
    'call',
    'Promemoria appuntamento',
    'Hai un appuntamento con ' || COALESCE(o."firstName", '') || ' ' || COALESCE(o."lastName", '') || ' domani alle ' || TO_CHAR(a.date, 'HH24:MI'),
    o.id
  FROM appointments a
  JOIN owners o ON a.owner_id = o.id
  WHERE a.date BETWEEN now() + interval '23 hours' AND now() + interval '25 hours'
    AND o.agent_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.owner_id = o.id
        AND n.type = 'call'
        AND n.created_at > now() - interval '24 hours'
    );
END;
$$ LANGUAGE plpgsql;
