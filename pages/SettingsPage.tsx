
import React, { useState } from 'react';
import { 
  User, Building2, Users, Bell, Shield, 
  Plus, Copy, Edit2, Trash2, Check, 
  ChevronRight, Key, Mail, Phone, ExternalLink,
  Clock, AlertTriangle, X, Power
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  accessCode: string;
  leads: number;
  calls: number;
  status: 'active' | 'inactive';
}

const MOCK_AGENTS: Agent[] = [
  { id: '1', name: 'Luca Bianchi', role: 'Agente Junior', accessCode: 'AG-8821', leads: 45, calls: 120, status: 'active' },
  { id: '2', name: 'Sara Neri', role: 'Agente Senior', accessCode: 'AG-9932', leads: 89, calls: 340, status: 'active' },
  { id: '3', name: 'Davide Bruni', role: 'Agente Junior', accessCode: 'AG-1102', leads: 12, calls: 45, status: 'inactive' },
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'agency' | 'team' | 'notifications'>('profile');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'deactivate' | 'activate';
    agent: Agent | null;
  }>({ isOpen: false, type: 'delete', agent: null });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmAction = () => {
    // In a real app, you'd call an API here
    console.log(`${confirmModal.type} agent ${confirmModal.agent?.id}`);
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Impostazioni</h1>
        <p className="text-gray-500 font-medium">Gestisci il tuo profilo, l'agenzia e il tuo team di agenti ⚙️</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="lg:w-64 flex flex-row lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          {[
            { id: 'profile', label: 'Profilo Personale', icon: <User className="w-5 h-5" /> },
            { id: 'agency', label: 'Agenzia', icon: <Building2 className="w-5 h-5" /> },
            { id: 'team', label: 'Gestione Team', icon: <Users className="w-5 h-5" /> },
            { id: 'notifications', label: 'Notifiche', icon: <Bell className="w-5 h-5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'text-gray-500 hover:bg-white hover:shadow-sm'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <div className="hidden lg:block h-px bg-gray-200 my-4 mx-4" />
          <button className="hidden lg:flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all">
            <Shield className="w-5 h-5" />
            Sicurezza Account
          </button>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2rem] bg-gray-100 border-4 border-white shadow-xl overflow-hidden">
                    <img src="https://picsum.photos/seed/agente/200" alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 active:scale-90 transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 text-center md:text-left space-y-1">
                  <h3 className="text-2xl font-black text-gray-900">Agente Pro</h3>
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center md:justify-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Status: Senior Real Estate Consultant
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                    <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase">ID Agente</p>
                      <p className="text-sm font-bold text-gray-700">#004219</p>
                    </div>
                    <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase">Lead Gestiti</p>
                      <p className="text-sm font-bold text-gray-700">1,248</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nome Completo</label>
                  <input type="text" defaultValue="Agente Pro" className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Lavoro</label>
                  <input type="email" defaultValue="agente.pro@immocrm.it" className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
                  Salva Modifiche
                </button>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Team Management</h3>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" />
                  Nuovo Agente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {MOCK_AGENTS.map((agent) => (
                  <div key={agent.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group overflow-hidden relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-lg">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{agent.name}</h4>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{agent.role}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        agent.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {agent.status}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
                          <Key className="w-3 h-3" /> Codice Accesso
                        </span>
                        <button 
                          onClick={() => copyToClipboard(agent.accessCode)}
                          className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {copiedCode === agent.accessCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {agent.accessCode}
                        </button>
                      </div>
                      <div className="h-px bg-gray-200" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase">Lead</p>
                          <p className="font-bold text-gray-900">{agent.leads}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase">Chiamate</p>
                          <p className="font-bold text-gray-900">{agent.calls}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-white border border-gray-100 py-2.5 rounded-xl text-xs font-black text-gray-500 hover:bg-gray-50 transition-all">
                        Report
                      </button>
                      {agent.status === 'active' ? (
                        <button 
                          onClick={() => setConfirmModal({ isOpen: true, type: 'deactivate', agent })}
                          className="px-3 bg-white border border-gray-100 py-2.5 rounded-xl text-gray-400 hover:text-amber-500 hover:border-amber-100 transition-all"
                          title="Disattiva Agente"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => setConfirmModal({ isOpen: true, type: 'activate', agent })}
                          className="px-3 bg-white border border-gray-100 py-2.5 rounded-xl text-gray-400 hover:text-green-500 hover:border-green-100 transition-all"
                          title="Attiva Agente"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setConfirmModal({ isOpen: true, type: 'delete', agent })}
                        className="px-3 bg-white border border-gray-100 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-100 transition-all"
                        title="Elimina Agente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="relative z-10 max-w-lg space-y-4">
                  <h4 className="text-2xl font-black">Vuoi automatizzare l'onboarding?</h4>
                  <p className="text-white/80 font-medium">Genera una lista di codici monouso da stampare e consegnare ai tuoi nuovi agenti durante la formazione.</p>
                  <button className="bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">
                    Genera Batch Codici
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agency' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600">
                  <Building2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">ImmoAgency Milano</h3>
                  <p className="text-sm text-gray-500 font-medium">Sede Centrale - Via Dante 12, Milano</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nome Agenzia</label>
                  <input type="text" defaultValue="ImmoAgency Milano" className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Partita IVA</label>
                  <input type="text" defaultValue="01234567890" className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sito Web</label>
                  <div className="relative">
                    <input type="text" defaultValue="https://www.immoagency-milano.it" className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none pr-12" />
                    <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row gap-4">
                 <div className="flex-1 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h5 className="font-black text-gray-900 mb-2">Abbonamento Pro</h5>
                    <p className="text-sm text-gray-500 font-medium mb-4">Il tuo piano scade tra 240 giorni. Include agenti illimitati.</p>
                    <button className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">Gestisci Fatturazione</button>
                 </div>
                 <div className="flex-1 bg-blue-50 rounded-2xl p-6 border border-blue-100">
                    <h5 className="font-black text-blue-900 mb-2">Statistiche Agenzia</h5>
                    <div className="flex justify-between items-end">
                       <span className="text-3xl font-black text-blue-600">4.8k</span>
                       <span className="text-[10px] font-black text-blue-400 uppercase pb-1">Lead Totali</span>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Preferenze Notifiche</h3>
              
              <div className="space-y-4">
                {[
                  { title: "Nuovi Lead Assegnati", desc: "Ricevi una notifica quando il manager ti assegna nuovi proprietari.", icon: <Users className="w-5 h-5" />, checked: true },
                  { title: "Promemoria Follow-up", desc: "Avviso 15 minuti prima di una chiamata programmata.", icon: <Clock className="w-5 h-5" />, checked: true },
                  { title: "Notifiche Browser", desc: "Mostra notifiche push anche quando la tab è chiusa.", icon: <Bell className="w-5 h-5" />, checked: false },
                  { title: "Report Settimanale Email", desc: "Ricevi ogni lunedì mattina il riepilogo delle performance.", icon: <Mail className="w-5 h-5" />, checked: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between p-5 rounded-3xl border border-gray-50 hover:bg-gray-50 transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                        <p className="text-xs text-gray-500 font-medium max-w-xs">{item.desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer pt-2">
                      <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6 text-center">
              <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center ${
                confirmModal.type === 'delete' ? 'bg-red-50 text-red-600' : 
                confirmModal.type === 'deactivate' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
              }`}>
                {confirmModal.type === 'delete' ? <Trash2 className="w-10 h-10" /> : 
                 confirmModal.type === 'deactivate' ? <Power className="w-10 h-10" /> : <Power className="w-10 h-10" />}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  {confirmModal.type === 'delete' ? 'Elimina Agente?' : 
                   confirmModal.type === 'deactivate' ? 'Disattiva Agente?' : 'Attiva Agente?'}
                </h3>
                <p className="text-gray-500 font-medium px-4">
                  {confirmModal.type === 'delete' 
                    ? `Sei sicuro di voler eliminare definitivamente ${confirmModal.agent?.name}? Questa azione non è reversibile.`
                    : confirmModal.type === 'deactivate'
                    ? `Vuoi disattivare l'accesso di ${confirmModal.agent?.name}? L'agente non potrà più effettuare il login.`
                    : `Vuoi ripristinare l'accesso di ${confirmModal.agent?.name}?`}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="flex-1 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
                >
                  Annulla
                </button>
                <button 
                  onClick={handleConfirmAction}
                  className={`flex-1 py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs ${
                    confirmModal.type === 'delete' ? 'bg-red-600 shadow-red-100 hover:bg-red-700' : 
                    confirmModal.type === 'deactivate' ? 'bg-amber-500 shadow-amber-100 hover:bg-amber-600' : 'bg-green-600 shadow-green-100 hover:bg-green-700'
                  }`}
                >
                  Conferma
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
