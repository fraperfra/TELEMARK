
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Filter, Phone, MoreVertical, LayoutGrid, List, Flame,
  CloudSun, Snowflake, Star, ChevronDown, ChevronUp,
  Building2, Calendar, Mail, User, Eye, Edit, Loader2, Database, AlertCircle,
  Copy, ExternalLink, RefreshCw, Check, X, Trash2, SlidersHorizontal
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

-- 2. TABELLA PROPRIETARI
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

-- RLS
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Owners" ON owners FOR ALL USING (true);
`;

// Esiti disponibili per filtro
const ESITI_OPTIONS = [
  'Appuntamento Fissato',
  'Richiamare',
  'Nessuna risposta',
  'Non Vende',
  'Affitta con Agenzia',
  'Vende con Agenzia',
  'Occupato adesso',
  'Vivono Loro',
  'Attesa Info',
  'Ha già venduto',
  'Numero errato',
  'Non interessato'
];

export const OwnersList: React.FC<OwnersListProps> = ({ onSelectOwner, onOpenModal }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Filtri
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemp, setFilterTemp] = useState<LeadTemperature | 'ALL'>('ALL');
  const [filterEsito, setFilterEsito] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'date'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Edit inline
  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Owner>>({});
  const [showActions, setShowActions] = useState<string | null>(null);

  const fetchOwners = async () => {
    if (!supabase) {
      setErrorState("Client Supabase non configurato.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorState(null);

      const { data, error } = await supabase
        .from('owners')
        .select(`*, properties (*), calls (*), appointments (*)`)
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
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Filtra e ordina
  const filteredOwners = useMemo(() => {
    let result = [...owners];

    // Ricerca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        `${o.firstName} ${o.lastName}`.toLowerCase().includes(q) ||
        o.taxCode?.toLowerCase().includes(q) ||
        o.phone1?.includes(q) ||
        o.phone2?.includes(q) ||
        o.phone3?.includes(q) ||
        o.address?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q)
      );
    }

    // Filtro temperatura
    if (filterTemp !== 'ALL') {
      result = result.filter(o => o.temperature === filterTemp);
    }

    // Filtro esito
    if (filterEsito !== 'ALL') {
      result = result.filter(o => o.esitoChiamata === filterEsito);
    }

    // Ordinamento
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
      } else if (sortBy === 'score') {
        cmp = (a.score || 0) - (b.score || 0);
      } else if (sortBy === 'date') {
        cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [owners, searchQuery, filterTemp, filterEsito, sortBy, sortDir]);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(INIT_DB_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Salva modifica
  const saveEdit = async (ownerId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('owners')
        .update(editForm)
        .eq('id', ownerId);

      if (error) throw error;
      setEditingOwner(null);
      setEditForm({});
      await fetchOwners();
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore nel salvataggio');
    }
  };

  // Elimina proprietario
  const deleteOwner = async (ownerId: string) => {
    if (!supabase) return;
    if (!confirm('Eliminare questo proprietario? Questa azione è irreversibile.')) return;

    try {
      const { error } = await supabase.from('owners').delete().eq('id', ownerId);
      if (error) throw error;
      await fetchOwners();
    } catch (error) {
      console.error('Errore eliminazione:', error);
    }
  };

  // Inizia modifica
  const startEdit = (owner: Owner) => {
    setEditingOwner(owner.id);
    setEditForm({
      firstName: owner.firstName,
      lastName: owner.lastName,
      phone1: owner.phone1 || '',
      phone2: owner.phone2 || '',
      phone3: owner.phone3 || '',
      email: owner.email || '',
      address: owner.address || '',
      temperature: owner.temperature,
      notes: owner.notes || ''
    });
    setShowActions(null);
  };

  const getTempBadge = (temp: LeadTemperature, compact: boolean = false) => {
    switch (temp) {
      case 'HOT': return <span className={`bg-red-500 text-white rounded-full font-black px-2 py-0.5 flex items-center gap-1 ${compact ? 'text-[8px]' : 'text-[10px]'}`}><Flame className="w-3 h-3" /> HOT</span>;
      case 'WARM': return <span className={`bg-orange-400 text-white rounded-full font-black px-2 py-0.5 flex items-center gap-1 ${compact ? 'text-[8px]' : 'text-[10px]'}`}><CloudSun className="w-3 h-3" /> WARM</span>;
      case 'COLD': return <span className={`bg-blue-400 text-white rounded-full font-black px-2 py-0.5 flex items-center gap-1 ${compact ? 'text-[8px]' : 'text-[10px]'}`}><Snowflake className="w-3 h-3" /> COLD</span>;
      default: return null;
    }
  };

  const activeFiltersCount = [
    filterTemp !== 'ALL',
    filterEsito !== 'ALL'
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold">Connessione al database...</p>
      </div>
    );
  }

  if (errorState && (errorState.includes('Could not find') || errorState.includes('does not exist'))) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-red-100 rounded-[2rem] shadow-xl p-8 max-w-3xl w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <Database className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Database Non Inizializzato</h2>
          <p className="text-gray-500">Esegui lo script SQL per creare le tabelle.</p>
          <div className="relative text-left">
            <div className="bg-slate-900 rounded-2xl p-6 overflow-x-auto max-h-[250px] custom-scrollbar">
              <code className="text-xs text-blue-300 font-mono whitespace-pre">{INIT_DB_SQL}</code>
            </div>
            <button onClick={handleCopySQL} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiato!' : 'Copia'}
            </button>
          </div>
          <div className="flex gap-4 justify-center">
            <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noreferrer" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2">
              Apri SQL Editor <ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={fetchOwners} className="bg-white border border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-black flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center p-8 bg-red-50 rounded-[2rem] text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-red-900">Errore Database</h2>
        <p className="text-red-700 mt-2">{errorState}</p>
        <button onClick={fetchOwners} className="mt-6 bg-red-600 text-white px-8 py-3 rounded-2xl font-black">Riprova</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">Contatti</h1>
          <p className="text-gray-500 text-sm">{filteredOwners.length} di {owners.length} proprietari</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenModal('ADD_OWNER')}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            + Nuovo
          </button>
          <div className="flex bg-white p-1 rounded-xl border border-gray-200">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per nome, telefono, indirizzo..."
              className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${showFilters || activeFiltersCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-500'}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            {/* Temperatura */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Temperatura</label>
              <div className="flex flex-wrap gap-2">
                {['ALL', 'HOT', 'WARM', 'COLD'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTemp(t as any)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      filterTemp === t
                        ? t === 'HOT' ? 'bg-red-500 text-white' :
                          t === 'WARM' ? 'bg-orange-400 text-white' :
                          t === 'COLD' ? 'bg-blue-400 text-white' :
                          'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {t === 'ALL' ? 'Tutti' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Esito chiamata */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Esito Chiamata</label>
              <select
                value={filterEsito}
                onChange={(e) => setFilterEsito(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Tutti gli esiti</option>
                <option value="">Non chiamato</option>
                {ESITI_OPTIONS.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            {/* Ordinamento */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Ordina per</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium"
              >
                <option value="score">Score</option>
                <option value="name">Nome</option>
                <option value="date">Data aggiunta</option>
              </select>
              <button
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"
              >
                {sortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {/* Reset filtri */}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => { setFilterTemp('ALL'); setFilterEsito('ALL'); }}
                className="text-sm text-blue-600 font-bold hover:underline"
              >
                Resetta filtri
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOwners.length > 0 ? filteredOwners.map((owner) => (
            <div
              key={owner.id}
              className={`bg-white rounded-2xl border transition-all ${
                editingOwner === owner.id ? 'border-blue-300 shadow-lg' : 'border-gray-100 hover:shadow-lg hover:border-gray-200'
              }`}
            >
              {editingOwner === owner.id ? (
                /* Edit Mode */
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-900">Modifica Contatto</span>
                    <button onClick={() => setEditingOwner(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editForm.firstName || ''}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      placeholder="Nome"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={editForm.lastName || ''}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      placeholder="Cognome"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>

                  <input
                    type="tel"
                    value={editForm.phone1 || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone1: e.target.value })}
                    placeholder="Telefono 1"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />

                  <input
                    type="tel"
                    value={editForm.phone2 || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone2: e.target.value })}
                    placeholder="Telefono 2"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />

                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Email"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />

                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Indirizzo"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />

                  <select
                    value={editForm.temperature || 'COLD'}
                    onChange={(e) => setEditForm({ ...editForm, temperature: e.target.value as LeadTemperature })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="HOT">HOT</option>
                    <option value="WARM">WARM</option>
                    <option value="COLD">COLD</option>
                  </select>

                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Note"
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
                  />

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setEditingOwner(null)}
                      className="flex-1 py-2 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-xl"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => saveEdit(owner.id)}
                      className="flex-1 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl"
                    >
                      Salva
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectOwner(owner)}>
                      <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg">
                        {owner.firstName.charAt(0)}{owner.lastName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{owner.firstName} {owner.lastName}</h3>
                        <p className="text-[10px] text-gray-400 font-medium uppercase">{owner.taxCode || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTempBadge(owner.temperature)}
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowActions(showActions === owner.id ? null : owner.id); }}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {showActions === owner.id && (
                          <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-20 min-w-[140px]">
                            <button
                              onClick={(e) => { e.stopPropagation(); startEdit(owner); }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" /> Modifica
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteOwner(owner.id); setShowActions(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Elimina
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {(owner.phone1 || owner.phones?.[0]) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{owner.phone1 || owner.phones?.[0]}</span>
                    </div>
                  )}

                  {owner.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{owner.address}{owner.civico ? `, ${owner.civico}` : ''}</span>
                    </div>
                  )}

                  {owner.esitoChiamata && (
                    <div className="mb-3">
                      <span className="px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[10px] font-bold text-amber-700">
                        {owner.esitoChiamata}
                      </span>
                    </div>
                  )}

                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-blue-600 transition-all" style={{ width: `${owner.score}%` }} />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenModal('CALL_OWNER', owner); }}
                      className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" /> Chiama
                    </button>
                    <button
                      onClick={() => onSelectOwner(owner)}
                      className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="col-span-full py-16 text-center">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-bold text-gray-500">Nessun contatto trovato</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mt-2 text-blue-600 font-bold text-sm hover:underline">
                  Cancella ricerca
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Nome</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Telefono</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Score</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Temp</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Esito</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectOwner(o)}>
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {o.firstName.charAt(0)}{o.lastName.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-800">{o.firstName} {o.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.phone1 || '-'}</td>
                  <td className="px-4 py-3 text-blue-600 font-bold">{o.score}</td>
                  <td className="px-4 py-3">{getTempBadge(o.temperature, true)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{o.esitoChiamata || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenModal('CALL_OWNER', o)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startEdit(o)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteOwner(o.id)}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Click outside to close menu */}
      {showActions && (
        <div className="fixed inset-0 z-10" onClick={() => setShowActions(null)} />
      )}
    </div>
  );
};
