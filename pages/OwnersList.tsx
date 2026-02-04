
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Phone, MoreVertical, LayoutGrid, List, Flame, 
  CloudSun, Snowflake, Star, ChevronLeft, ChevronRight, 
  Building2, Calendar, Mail, User, Eye, Edit, Loader2, Database, AlertCircle,
  Copy, ExternalLink, RefreshCw, Check
} from 'lucide-react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { LeadTemperature, ModalType, Owner } from '../types';

interface OwnersListProps {
  onSelectOwner: (owner: Owner) => void;
  onOpenModal: (type: ModalType, owner?: Owner) => void;
}

// Script SQL per inizializzare il DB se mancante
const INIT_DB_SQL = `-- Esegui questo script nell'SQL Editor di Supabase

-- 1. ABILITA ESTENSIONE UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELLA AGENTI
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Agente Junior',
  "accessCode" TEXT UNIQUE NOT NULL,
  leads INTEGER DEFAULT 0,
  calls INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABELLA PROPRIETARI
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "taxCode" TEXT UNIQUE,
  email TEXT,
  "birthDate" DATE,
  temperature TEXT CHECK (temperature IN ('HOT', 'WARM', 'COLD')) DEFAULT 'COLD',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  "propertiesCount" INTEGER DEFAULT 0,
  "lastContact" TEXT DEFAULT 'Mai contattato',
  "suggestedAction" TEXT,
  tags TEXT[] DEFAULT '{}',
  -- Campi per importazione CSV
  address TEXT,
  civico TEXT,
  consistenza TEXT,
  categoria TEXT,
  quota TEXT,
  phone1 TEXT,
  phone2 TEXT,
  phone3 TEXT,
  "esitoChiamata" TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABELLA IMMOBILI
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  category TEXT DEFAULT 'Appartamento',
  consistenza TEXT,
  "estimatedValue" NUMERIC DEFAULT 0,
  share INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABELLA CHIAMATE
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  outcome TEXT NOT NULL,
  notes TEXT,
  duration TEXT DEFAULT '00:00',
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL
);

-- 6. TABELLA APPUNTAMENTI
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT CHECK (type IN ('VISIT', 'CALL', 'VIDEO', 'SIGNING')),
  title TEXT NOT NULL,
  location TEXT,
  "whatsappScript" TEXT,
  "voiceScript" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. RLS (Policy di Sicurezza per Demo)
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Owners" ON owners FOR ALL USING (true);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Agents" ON agents FOR ALL USING (true);
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Properties" ON properties FOR ALL USING (true);
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Calls" ON calls FOR ALL USING (true);
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Appointments" ON appointments FOR ALL USING (true);
`;

export const OwnersList: React.FC<OwnersListProps> = ({ onSelectOwner, onOpenModal }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterTemp, setFilterTemp] = useState<LeadTemperature | 'ALL'>('ALL');
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchOwners = async () => {
    if (!supabase) {
      setErrorState("Client Supabase non configurato.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorState(null); // Reset errori precedenti
      
      const { data, error } = await supabase
        .from('owners')
        .select(`
          *,
          properties (*),
          calls (*),
          appointments (*)
        `)
        .order('score', { ascending: false });

      if (error) {
        handleSupabaseError(error, 'Errore caricamento');
        setErrorState(error.message);
      } else if (data) {
        setOwners(data as unknown as Owner[]);
      }
    } catch (e: any) {
      setErrorState(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('owners-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'owners' }, () => fetchOwners())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => fetchOwners())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => fetchOwners())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchOwners())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(INIT_DB_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTempBadge = (temp: LeadTemperature, compact: boolean = false) => {
    switch (temp) {
      case 'HOT': return <span className={`bg-red-500 text-white rounded-full font-black px-2 py-0.5 flex items-center gap-1 ${compact ? 'text-[8px]' : 'text-[10px]'}`}><Flame className="w-3 h-3" /> HOT</span>;
      case 'WARM': return <span className={`bg-orange-400 text-white rounded-full font-black px-2 py-0.5 flex items-center gap-1 ${compact ? 'text-[8px]' : 'text-[10px]'}`}><CloudSun className="w-3 h-3" /> WARM</span>;
      case 'COLD': return <span className={`bg-blue-400 text-white rounded-full font-black px-2 py-0.5 flex items-center gap-1 ${compact ? 'text-[8px]' : 'text-[10px]'}`}><Snowflake className="w-3 h-3" /> COLD</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold">Connessione al database...</p>
      </div>
    );
  }

  // Gestione specifica Errore Tabella Mancante
  if (errorState && (errorState.includes('Could not find the table') || errorState.includes('does not exist') || errorState.includes('relation "public.owners"'))) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="bg-white border border-red-100 rounded-[2rem] shadow-xl p-8 max-w-3xl w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
            <Database className="w-10 h-10 text-red-500" />
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Database Non Inizializzato</h2>
            <p className="text-gray-500 font-medium max-w-lg mx-auto">
              La connessione a Supabase è attiva, ma le tabelle non esistono ancora.
              Esegui lo script SQL qui sotto per creare la struttura del database.
            </p>
          </div>

          <div className="relative group text-left">
            <div className="bg-slate-900 rounded-2xl p-6 overflow-x-auto max-h-[300px] custom-scrollbar border border-slate-800 shadow-inner">
              <code className="text-xs text-blue-300 font-mono whitespace-pre">{INIT_DB_SQL}</code>
            </div>
            <button 
               onClick={handleCopySQL}
               className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl backdrop-blur transition-all flex items-center gap-2 text-xs font-bold border border-white/10"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiato!' : 'Copia SQL'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <a 
              href="https://supabase.com/dashboard/project/_/sql" 
              target="_blank" 
              rel="noreferrer"
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95"
            >
              Apri SQL Editor <ExternalLink className="w-4 h-4" />
            </a>
            <button 
              onClick={fetchOwners}
              className="bg-white border border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" /> Ho eseguito lo script
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gestione Errore Generico
  if (errorState) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 p-8 bg-red-50 rounded-[2.5rem] border border-red-100 text-center">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-black text-red-900">Errore Database</h2>
        <p className="text-red-700 font-medium max-w-md">{errorState}</p>
        <button onClick={fetchOwners} className="mt-4 bg-red-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-red-200">Riprova</button>
      </div>
    );
  }

  const filteredOwners = owners.filter(o => filterTemp === 'ALL' || o.temperature === filterTemp);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Proprietari</h1>
          <p className="text-gray-500 font-medium flex items-center gap-2">
            Dati sincronizzati dal Cloud <Database className="w-3 h-3" />
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200">
          <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-5 h-5" /></button>
          <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400 hover:text-gray-600'}`}><List className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Sezione Filtri */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap gap-3">
        {['ALL', 'HOT', 'WARM', 'COLD'].map((t) => (
          <button 
            key={t}
            onClick={() => setFilterTemp(t as any)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${filterTemp === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
          >
            {t === 'ALL' ? 'Tutti' : t}
          </button>
        ))}
      </div>

      {/* Visualizzazione Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredOwners.length > 0 ? filteredOwners.map((owner) => (
            <div
              key={owner.id}
              className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100 hover:shadow-2xl transition-all cursor-pointer group"
              onClick={() => onSelectOwner(owner)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl">
                    {owner.firstName.charAt(0)}{owner.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{owner.firstName} {owner.lastName}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase">{owner.taxCode}</p>
                  </div>
                </div>
                {getTempBadge(owner.temperature)}
              </div>

              {/* Info telefono principale */}
              {(owner.phone1 || (owner.phones && owner.phones[0])) && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{owner.phone1 || owner.phones?.[0]}</span>
                </div>
              )}

              {/* Info indirizzo */}
              {owner.address && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{owner.address}{owner.civico ? `, ${owner.civico}` : ''}</span>
                </div>
              )}

              {/* Esito ultima chiamata */}
              {owner.esitoChiamata && (
                <div className="mb-3 px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg text-xs font-bold text-amber-700 inline-block">
                  {owner.esitoChiamata}
                </div>
              )}

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-blue-600" style={{ width: `${owner.score}%` }} />
              </div>
              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-100">Chiama</button>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center opacity-50">
              <Database className="w-12 h-12 mx-auto mb-4" />
              <p className="font-bold">Nessun proprietario trovato.</p>
              <button onClick={() => onOpenModal('ADD_OWNER')} className="mt-4 text-blue-600 font-bold hover:underline">Aggiungi il primo proprietario</button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Nome</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Score</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Temp</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.map(o => (
                <tr key={o.id} onClick={() => onSelectOwner(o)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 font-bold text-gray-800">{o.firstName} {o.lastName}</td>
                  <td className="px-6 py-4 text-blue-600 font-black">{o.score}/100</td>
                  <td className="px-6 py-4">{getTempBadge(o.temperature, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
