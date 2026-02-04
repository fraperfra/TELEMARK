
import React, { useState, useEffect } from 'react';
import { 
  X, Phone, Calendar, User, Save, Trash2, 
  CheckCircle2, XCircle, Clock, AlertCircle, 
  ChevronDown, PhoneOff, Building2, UserX, 
  HelpCircle, Home, Ban, Ghost
} from 'lucide-react';
import { Owner, ModalType } from '../types';
import { supabase } from '../lib/supabase';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <>
      {/* Mobile Modal - Bottom Sheet */}
      <div className="md:hidden fixed inset-0 z-[100] bg-black/50 fade-in" onClick={onClose}>
        <div
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-hidden slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-4 pb-8 max-h-[75vh] overflow-y-auto scroll-touch" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>
            {children}
          </div>
        </div>
      </div>

      {/* Desktop Modal - Center */}
      <div className="hidden md:flex fixed inset-0 z-[100] items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors active:scale-90">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export const OwnerFormModal: React.FC<{ isOpen: boolean; onClose: () => void; owner?: Owner; onSaved?: (ownerId: string) => void }> = ({ isOpen, onClose, owner, onSaved }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    taxCode: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      firstName: owner?.firstName || '',
      lastName: owner?.lastName || '',
      taxCode: owner?.taxCode || '',
    });
  }, [isOpen, owner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    try {
      if (owner?.id) {
        const { error } = await supabase
          .from('owners')
          .update({
            firstName: form.firstName,
            lastName: form.lastName,
            taxCode: form.taxCode || null,
          })
          .eq('id', owner.id);
        if (error) throw error;
        onSaved?.(owner.id);
      } else {
        const { data, error } = await supabase
          .from('owners')
          .insert({
            firstName: form.firstName,
            lastName: form.lastName,
            taxCode: form.taxCode || null,
            temperature: 'COLD',
            score: 0,
            propertiesCount: 0,
          })
          .select()
          .single();
        if (error) throw error;
        if (data?.id) onSaved?.(data.id);
      }
      onClose();
    } catch (error) {
      console.error('Owner save error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={owner ? "Modifica Proprietario" : "Nuovo Proprietario"}>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nome</label>
            <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" placeholder="Es: Marco" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cognome</label>
            <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" placeholder="Es: Rossi" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Codice Fiscale</label>
          <input type="text" value={form.taxCode} onChange={(e) => setForm({ ...form, taxCode: e.target.value })} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" placeholder="ABCD123..." />
        </div>
        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-all">Annulla</button>
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Salva Proprietario</button>
        </div>
      </form>
    </Modal>
  );
};

interface OutcomeOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const CallModal: React.FC<{ isOpen: boolean; onClose: () => void; owner?: Owner; onSaved?: (ownerId: string) => void }> = ({ isOpen, onClose, owner, onSaved }) => {
  const [seconds, setSeconds] = useState(0);
  const [outcome, setOutcome] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isOpen && !outcome) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, outcome]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const outcomes: OutcomeOption[] = [
    { id: "app", label: "Appuntamento Fissato", icon: <CheckCircle2 className="w-4 h-4" />, colorClass: "text-green-600", bgClass: "bg-green-50", borderClass: "border-green-100" },
    { id: "rich", label: "Richiamare", icon: <Clock className="w-4 h-4" />, colorClass: "text-amber-600", bgClass: "bg-amber-50", borderClass: "border-amber-100" },
    { id: "no_resp", label: "nessuna risposta", icon: <PhoneOff className="w-4 h-4" />, colorClass: "text-slate-500", bgClass: "bg-slate-50", borderClass: "border-slate-100" },
    { id: "no_vend", label: "Non Vende", icon: <XCircle className="w-4 h-4" />, colorClass: "text-rose-600", bgClass: "bg-rose-50", borderClass: "border-rose-100" },
    { id: "aff_age", label: "Affitta con Agenzia", icon: <Building2 className="w-4 h-4" />, colorClass: "text-sky-600", bgClass: "bg-sky-50", borderClass: "border-sky-100" },
    { id: "vend_age", label: "Vende con Agenzia", icon: <Building2 className="w-4 h-4" />, colorClass: "text-indigo-600", bgClass: "bg-indigo-50", borderClass: "border-indigo-100" },
    { id: "imp", label: "Tutto impegnato adesso", icon: <Ban className="w-4 h-4" />, colorClass: "text-orange-500", bgClass: "bg-orange-50", borderClass: "border-orange-100" },
    { id: "viv_lor", label: "Vivono Loro", icon: <Home className="w-4 h-4" />, colorClass: "text-teal-600", bgClass: "bg-teal-50", borderClass: "border-teal-100" },
    { id: "att_inf", label: "Attesa Informazioni", icon: <HelpCircle className="w-4 h-4" />, colorClass: "text-blue-500", bgClass: "bg-blue-50", borderClass: "border-blue-100" },
    { id: "gia_vend", label: "Ha già venduto", icon: <CheckCircle2 className="w-4 h-4" />, colorClass: "text-gray-400", bgClass: "bg-gray-100", borderClass: "border-gray-200" },
    { id: "non_es", label: "Numero non esistente", icon: <Ghost className="w-4 h-4" />, colorClass: "text-gray-600", bgClass: "bg-gray-50", borderClass: "border-gray-200" },
    { id: "ins", label: "Mi ha mandato a cagare", icon: <UserX className="w-4 h-4" />, colorClass: "text-red-900", bgClass: "bg-red-50", borderClass: "border-red-200" }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={owner ? `📞 Chiamata con ${owner.firstName} ${owner.lastName}` : "Chiamata Rapida"}>
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center text-green-600 animate-pulse ring-8 ring-green-500/10">
            <Phone className="w-8 h-8 fill-current" />
          </div>
          <div>
            <div className="text-5xl font-black text-gray-900 tracking-tighter font-inter tabular-nums">{formatTime(seconds)}</div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Talking Time</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-blue-500" /> Seleziona Esito Chiamata
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {outcomes.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setOutcome(opt.label)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all group relative overflow-hidden active:scale-95 ${
                  outcome === opt.label 
                    ? `${opt.bgClass} ${opt.borderClass.replace('100', '400')} shadow-lg shadow-blue-900/5` 
                    : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                <div className={`p-2 rounded-xl ${opt.bgClass} ${opt.colorClass} group-hover:scale-110 transition-transform`}>
                  {opt.icon}
                </div>
                <span className={`text-[10px] font-black leading-tight text-center uppercase tracking-tighter ${
                  outcome === opt.label ? opt.colorClass : 'text-gray-500'
                }`}>
                  {opt.label}
                </span>
                {outcome === opt.label && (
                   <div className="absolute top-1 right-1">
                      <div className={`w-2 h-2 rounded-full ${opt.colorClass.replace('text', 'bg')}`} />
                   </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-left">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <Save className="w-3 h-3" /> Note della Chiamata
          </label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] py-4 px-6 font-bold text-gray-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all outline-none min-h-[140px] text-sm resize-none" 
            placeholder="Cosa ti ha detto il proprietario? (Obiezioni, dettagli immobili, mood...)" 
          />
        </div>

        <div className="pt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-all active:scale-95 text-sm uppercase tracking-widest">
            Chiudi
          </button>
          <button 
            disabled={!outcome}
            onClick={async () => {
              if (!supabase || !owner?.id) return;
              setSaving(true);
              try {
                const { error } = await supabase.from('calls').insert({
                  owner_id: owner.id,
                  date: new Date().toISOString(),
                  outcome,
                  notes: notes || null,
                  duration: formatTime(seconds),
                });
                if (error) throw error;
                onSaved?.(owner.id);
                onClose();
              } catch (error) {
                console.error('Call save error:', error);
              } finally {
                setSaving(false);
              }
            }}
            className={`flex-[2] py-4 rounded-3xl font-black shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest ${
              outcome && !saving ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5' : 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200'
            }`}
          >
            Salva & Prossimo
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const AppointmentModal: React.FC<{ isOpen: boolean; onClose: () => void; owner?: Owner; onSaved?: (ownerId: string) => void }> = ({ isOpen, onClose, owner, onSaved }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<'VISIT' | 'CALL' | 'VIDEO' | 'SIGNING'>('CALL');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDate('');
    setTime('');
    setAppointmentType('CALL');
    setLocation('');
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`📅 Fissa Appuntamento: ${owner?.firstName || 'Lead'}`}>
      <form className="space-y-6 font-inter" onSubmit={async (e) => {
        e.preventDefault();
        if (!supabase || !owner?.id) return;
        const dateTime = new Date(`${date}T${time || '00:00'}`);
        setSaving(true);
        try {
          const { error } = await supabase.from('appointments').insert({
            owner_id: owner.id,
            date: dateTime.toISOString(),
            type: appointmentType,
            title: `Appuntamento ${owner.firstName} ${owner.lastName}`,
            location: location || null,
          });
          if (error) throw error;
          onSaved?.(owner.id);
          onClose();
        } catch (error) {
          console.error('Appointment save error:', error);
        } finally {
          setSaving(false);
        }
      }}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Ora</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tipo Appuntamento</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'VISIT', icon: '🏠' }, 
              { label: 'CALL', icon: '📞' }, 
              { label: 'VIDEO', icon: '📹' }, 
              { label: 'SIGNING', icon: '📝' }
            ].map(type => (
              <button key={type.label} type="button" onClick={() => setAppointmentType(type.label as any)} className={`py-3 px-2 border rounded-2xl text-[10px] font-black uppercase transition-all flex flex-col items-center gap-1 ${type.label === appointmentType ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'}`}>
                <span className="text-lg">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Luogo / Link Meeting</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Indirizzo o URL videochiamata" />
        </div>
        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-all text-sm uppercase tracking-widest">Annulla</button>
          <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-4 rounded-3xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm uppercase tracking-widest">Pianifica Evento</button>
        </div>
      </form>
    </Modal>
  );
};

export const PropertyModal: React.FC<{ isOpen: boolean; onClose: () => void; owner?: Owner; onSaved?: (ownerId: string) => void }> = ({ isOpen, onClose, owner, onSaved }) => {
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('Appartamento');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [share, setShare] = useState('100');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAddress('');
    setCategory('Appartamento');
    setEstimatedValue('');
    setShare('100');
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`🏠 Nuovo Immobile: ${owner?.firstName || 'Lead'}`}>
      <form className="space-y-6" onSubmit={async (e) => {
        e.preventDefault();
        if (!supabase || !owner?.id) return;
        setSaving(true);
        try {
          const value = Number(estimatedValue);
          const shareNum = Number(share);
          const { error } = await supabase.from('properties').insert({
            owner_id: owner.id,
            address,
            category,
            estimatedValue: Number.isFinite(value) ? value : 0,
            share: Number.isFinite(shareNum) ? shareNum : 100,
          });
          if (error) throw error;
          onSaved?.(owner.id);
          onClose();
        } catch (error) {
          console.error('Property save error:', error);
        } finally {
          setSaving(false);
        }
      }}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Indirizzo</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Via Roma 12, Milano" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Categoria</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Valore Stimato</label>
            <input type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Quota %</label>
          <input type="number" value={share} onChange={(e) => setShare(e.target.value)} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
        </div>
        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-all">Annulla</button>
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Salva Immobile</button>
        </div>
      </form>
    </Modal>
  );
};
