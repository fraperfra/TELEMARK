
import React from 'react';
import { Database, ShieldAlert, Key, Settings, ExternalLink, RefreshCw } from 'lucide-react';

export const SetupRequired: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <Database className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h1 className="text-3xl font-black mb-2 tracking-tight">Configurazione Database</h1>
          <p className="text-blue-100 font-medium">Connetti il tuo CRM a Supabase per iniziare</p>
        </div>
        
        <div className="p-12 space-y-8">
          <div className="flex items-start gap-4 p-6 bg-red-50 border border-red-100 rounded-3xl">
            <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-black text-red-900 uppercase text-xs tracking-widest mb-1">Errore di Connessione</h3>
              <p className="text-red-700 text-sm font-medium">
                Non sono state trovate le credenziali API di Supabase. L'applicazione richiede queste variabili per sincronizzare i lead e gli appuntamenti.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-gray-900 text-lg">Cosa devi fare:</h3>
            <div className="grid gap-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 font-black">1</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">Crea un progetto su Supabase</p>
                  <p className="text-xs text-gray-500">Ottieni la tua URL e la Anon Key</p>
                </div>
                <a href="https://supabase.com" target="_blank" className="text-blue-600 hover:scale-110 transition-transform"><ExternalLink className="w-4 h-4" /></a>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 font-black">2</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">Imposta le Variabili d'Ambiente</p>
                  <div className="flex gap-2 mt-1">
                    <code className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-black uppercase tracking-tighter">SUPABASE_URL</code>
                    <code className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-black uppercase tracking-tighter">SUPABASE_ANON_KEY</code>
                  </div>
                </div>
                <Settings className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
          >
            <RefreshCw className="w-5 h-5" />
            Ricarica Applicazione
          </button>
        </div>
      </div>
    </div>
  );
};
