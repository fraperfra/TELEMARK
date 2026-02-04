-- Tabella Categorie Catastali Italiane
-- Esegui questo script nell'SQL Editor di Supabase per creare la tabella di riferimento

CREATE TABLE IF NOT EXISTS categorie_catastali (
  codice TEXT PRIMARY KEY,
  descrizione TEXT NOT NULL,
  gruppo TEXT NOT NULL,
  gruppo_descrizione TEXT NOT NULL,
  icona TEXT,
  colore TEXT
);

-- Pulisci tabella esistente
TRUNCATE TABLE categorie_catastali;

-- GRUPPO A – Abitazioni e uffici
INSERT INTO categorie_catastali VALUES ('A/1', 'Abitazioni di tipo signorile', 'A', 'Abitazioni e uffici', '🏰', 'blue');
INSERT INTO categorie_catastali VALUES ('A/2', 'Abitazioni di tipo civile', 'A', 'Abitazioni e uffici', '🏠', 'blue');
INSERT INTO categorie_catastali VALUES ('A/3', 'Abitazioni di tipo economico', 'A', 'Abitazioni e uffici', '🏡', 'blue');
INSERT INTO categorie_catastali VALUES ('A/4', 'Abitazioni di tipo popolare', 'A', 'Abitazioni e uffici', '🏘️', 'blue');
INSERT INTO categorie_catastali VALUES ('A/5', 'Abitazioni di tipo ultrapopolare', 'A', 'Abitazioni e uffici', '🏚️', 'blue');
INSERT INTO categorie_catastali VALUES ('A/6', 'Abitazioni di tipo rurale', 'A', 'Abitazioni e uffici', '🏕️', 'blue');
INSERT INTO categorie_catastali VALUES ('A/7', 'Abitazioni in villini', 'A', 'Abitazioni e uffici', '🏡', 'blue');
INSERT INTO categorie_catastali VALUES ('A/8', 'Abitazioni in ville', 'A', 'Abitazioni e uffici', '🏛️', 'blue');
INSERT INTO categorie_catastali VALUES ('A/9', 'Castelli, palazzi di pregio storico o artistico', 'A', 'Abitazioni e uffici', '🏰', 'blue');
INSERT INTO categorie_catastali VALUES ('A/10', 'Uffici e studi privati', 'A', 'Abitazioni e uffici', '🏢', 'blue');
INSERT INTO categorie_catastali VALUES ('A/11', 'Abitazioni ed alloggi tipici dei luoghi', 'A', 'Abitazioni e uffici', '🛖', 'blue');

-- GRUPPO B – Immobili per uso collettivo
INSERT INTO categorie_catastali VALUES ('B/1', 'Collegi, convitti, educandati, orfanotrofi', 'B', 'Uso collettivo', '🏫', 'purple');
INSERT INTO categorie_catastali VALUES ('B/2', 'Case di cura e ospedali (senza fini di lucro)', 'B', 'Uso collettivo', '🏥', 'purple');
INSERT INTO categorie_catastali VALUES ('B/3', 'Prigioni e riformatori', 'B', 'Uso collettivo', '🔒', 'purple');
INSERT INTO categorie_catastali VALUES ('B/4', 'Uffici pubblici', 'B', 'Uso collettivo', '🏛️', 'purple');
INSERT INTO categorie_catastali VALUES ('B/5', 'Scuole, laboratori scientifici', 'B', 'Uso collettivo', '🎓', 'purple');
INSERT INTO categorie_catastali VALUES ('B/6', 'Biblioteche, musei, gallerie, accademie', 'B', 'Uso collettivo', '📚', 'purple');
INSERT INTO categorie_catastali VALUES ('B/7', 'Cappelle e oratori (non destinati al culto pubblico)', 'B', 'Uso collettivo', '⛪', 'purple');
INSERT INTO categorie_catastali VALUES ('B/8', 'Magazzini sotterranei per derrate', 'B', 'Uso collettivo', '🏪', 'purple');

-- GRUPPO C – Magazzini, negozi e pertinenze
INSERT INTO categorie_catastali VALUES ('C/1', 'Negozi e botteghe', 'C', 'Commerciale', '🏪', 'green');
INSERT INTO categorie_catastali VALUES ('C/2', 'Magazzini e locali di deposito (cantine, soffitte)', 'C', 'Commerciale', '📦', 'green');
INSERT INTO categorie_catastali VALUES ('C/3', 'Laboratori per arti e mestieri', 'C', 'Commerciale', '🔧', 'green');
INSERT INTO categorie_catastali VALUES ('C/4', 'Fabbricati e locali per esercizi sportivi (senza fine di lucro)', 'C', 'Commerciale', '🏋️', 'green');
INSERT INTO categorie_catastali VALUES ('C/5', 'Stabilimenti balneari e di acque curative', 'C', 'Commerciale', '🏖️', 'green');
INSERT INTO categorie_catastali VALUES ('C/6', 'Autorimesse, garage, posti auto, stalle', 'C', 'Commerciale', '🚗', 'green');
INSERT INTO categorie_catastali VALUES ('C/7', 'Tettoie chiuse o aperte', 'C', 'Commerciale', '🏗️', 'green');

-- GRUPPO D – Immobili produttivi
INSERT INTO categorie_catastali VALUES ('D/1', 'Opifici', 'D', 'Produttivo', '🏭', 'orange');
INSERT INTO categorie_catastali VALUES ('D/2', 'Alberghi e pensioni', 'D', 'Produttivo', '🏨', 'orange');
INSERT INTO categorie_catastali VALUES ('D/3', 'Teatri, cinema, sale per spettacoli', 'D', 'Produttivo', '🎭', 'orange');
INSERT INTO categorie_catastali VALUES ('D/4', 'Case di cura e ospedali (con fine di lucro)', 'D', 'Produttivo', '🏥', 'orange');
INSERT INTO categorie_catastali VALUES ('D/5', 'Istituti di credito, cambio e assicurazione', 'D', 'Produttivo', '🏦', 'orange');
INSERT INTO categorie_catastali VALUES ('D/6', 'Fabbricati sportivi con fine di lucro', 'D', 'Produttivo', '🏟️', 'orange');
INSERT INTO categorie_catastali VALUES ('D/7', 'Fabbricati per attività industriali', 'D', 'Produttivo', '🏭', 'orange');
INSERT INTO categorie_catastali VALUES ('D/8', 'Fabbricati per attività commerciali', 'D', 'Produttivo', '🏬', 'orange');
INSERT INTO categorie_catastali VALUES ('D/9', 'Edifici galleggianti o sospesi', 'D', 'Produttivo', '🚢', 'orange');
INSERT INTO categorie_catastali VALUES ('D/10', 'Fabbricati per funzioni agricole', 'D', 'Produttivo', '🚜', 'orange');

-- GRUPPO E – Immobili a destinazione particolare
INSERT INTO categorie_catastali VALUES ('E/1', 'Stazioni per trasporti terrestri', 'E', 'Particolare', '🚉', 'red');
INSERT INTO categorie_catastali VALUES ('E/2', 'Ponti comunali e provinciali', 'E', 'Particolare', '🌉', 'red');
INSERT INTO categorie_catastali VALUES ('E/3', 'Costruzioni per esigenze pubbliche', 'E', 'Particolare', '🏗️', 'red');
INSERT INTO categorie_catastali VALUES ('E/4', 'Recinti chiusi per uso pubblico', 'E', 'Particolare', '🚧', 'red');
INSERT INTO categorie_catastali VALUES ('E/5', 'Fabbricati costituenti fortificazioni', 'E', 'Particolare', '🏰', 'red');
INSERT INTO categorie_catastali VALUES ('E/6', 'Fari, semafori, torri per uso pubblico', 'E', 'Particolare', '🗼', 'red');
INSERT INTO categorie_catastali VALUES ('E/7', 'Fabbricati destinati all''esercizio di culti', 'E', 'Particolare', '⛪', 'red');
INSERT INTO categorie_catastali VALUES ('E/8', 'Fabbricati cimiteriali', 'E', 'Particolare', '🪦', 'red');
INSERT INTO categorie_catastali VALUES ('E/9', 'Edifici a destinazione particolare non classificabili altrove', 'E', 'Particolare', '🏢', 'red');

-- GRUPPO F – Unità senza rendita
INSERT INTO categorie_catastali VALUES ('F/1', 'Area urbana', 'F', 'Senza rendita', '🗺️', 'gray');
INSERT INTO categorie_catastali VALUES ('F/2', 'Unità collabenti', 'F', 'Senza rendita', '🏚️', 'gray');
INSERT INTO categorie_catastali VALUES ('F/3', 'Unità in corso di costruzione', 'F', 'Senza rendita', '🏗️', 'gray');
INSERT INTO categorie_catastali VALUES ('F/4', 'Unità in corso di definizione', 'F', 'Senza rendita', '📝', 'gray');
INSERT INTO categorie_catastali VALUES ('F/5', 'Lastrico solare', 'F', 'Senza rendita', '☀️', 'gray');
INSERT INTO categorie_catastali VALUES ('F/6', 'Fabbricato in attesa di dichiarazione', 'F', 'Senza rendita', '⏳', 'gray');

-- Indice per ricerche veloci
CREATE INDEX IF NOT EXISTS idx_categorie_gruppo ON categorie_catastali(gruppo);

-- RLS Policy
ALTER TABLE categorie_catastali ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read categorie_catastali" ON categorie_catastali FOR SELECT USING (true);
