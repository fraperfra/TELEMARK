
import React, { useState } from 'react';
import { ArrowLeft, Phone, Mail, Calendar, MapPin, Tag, Plus, MessageSquare, History, Building2, TrendingUp, ChevronRight, Edit3, Info } from 'lucide-react';
import { Owner, ModalType } from '../types';
import { getCategoria, getCategoriaIcona, getCategoriaColore } from '../lib/categorieCatastali';

interface OwnerDetailProps {
  owner: Owner;
  onBack: () => void;
  onOpenModal: (type: ModalType, owner?: Owner) => void;
}

export const OwnerDetail: React.FC<OwnerDetailProps> = ({ owner, onBack, onOpenModal }) => {
  const [activeTab, setActiveTab] = useState<'immobili' | 'chiamate' | 'appuntamenti' | 'note'>('immobili');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Torna alla lista
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onOpenModal('EDIT_OWNER', owner)}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onOpenModal('ADD_APPOINTMENT', owner)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            Fissa Appuntamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Profilo */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400" />
            <div className="px-6 pb-8 -mt-12 text-center">
              <div className="inline-block relative">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 border shadow-xl">
                  <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center text-4xl overflow-hidden">
                    <img src={`https://picsum.photos/seed/${owner.id}/200`} alt="Avatar" />
                  </div>
                </div>
                <span className={`absolute bottom-1 right-1 w-5 h-5 border-4 border-white rounded-full ${owner.temperature === 'HOT' ? 'bg-red-500' : 'bg-green-500'}`} />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">{owner.firstName} {owner.lastName}</h2>
              <p className="text-gray-500 text-sm font-medium">ID: {owner.taxCode}</p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {(owner.tags || []).map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase rounded-full border border-gray-100">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-8 space-y-4 text-left">
                {/* Telefoni - supporta sia phones[] che phone1/2/3 */}
                {[owner.phone1, owner.phone2, owner.phone3, ...(owner.phones || [])].filter((p, i, arr) => p && arr.indexOf(p) === i).map((phone, i) => (
                  <button
                    key={i}
                    onClick={() => onOpenModal('CALL_OWNER', owner)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-all group active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">{phone}</span>
                    <span className="text-[10px] text-gray-400 font-bold">TEL {i + 1}</span>
                    <ChevronRight className="ml-auto w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
                <button className="w-full flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm truncate">{owner.email || '—'}</span>
                </button>
                {/* Indirizzo immobile */}
                {(owner.address || owner.civico) && (
                  <div className="w-full flex items-center gap-4 p-3 rounded-xl bg-gray-50 text-gray-700">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">{owner.address}{owner.civico ? `, ${owner.civico}` : ''}</span>
                  </div>
                )}
                {/* Data di nascita */}
                {owner.birthDate && (
                  <div className="w-full flex items-center gap-4 p-3 rounded-xl bg-gray-50 text-gray-700">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">{new Date(owner.birthDate).toLocaleDateString('it-IT')}</span>
                  </div>
                )}
              </div>

              {/* Info Immobile importato da CSV */}
              {(owner.categoria || owner.consistenza || owner.quota) && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-700 uppercase mb-3">Dati Catastali</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {owner.categoria && (
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Categoria</p>
                        <p className="text-sm font-bold text-gray-800">{owner.categoria}</p>
                      </div>
                    )}
                    {owner.consistenza && (
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Consistenza</p>
                        <p className="text-sm font-bold text-gray-800">{owner.consistenza}</p>
                      </div>
                    )}
                    {owner.quota && (
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Quota</p>
                        <p className="text-sm font-bold text-gray-800">{owner.quota}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Esito e Note */}
              {(owner.esitoChiamata || owner.notes) && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  {owner.esitoChiamata && (
                    <div className="mb-2">
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Ultimo Esito: </span>
                      <span className="text-sm font-bold text-gray-800">{owner.esitoChiamata}</span>
                    </div>
                  )}
                  {owner.notes && (
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Note: </span>
                      <span className="text-sm text-gray-700">{owner.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              🌡️ Lead Scoring Detail
            </h3>
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                  <circle 
                    cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 * (1 - owner.score / 100)}
                    className={owner.score >= 80 ? 'text-red-500' : 'text-blue-500'}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center transform rotate-90">
                  <span className="text-3xl font-bold">{owner.score}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Punti</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { label: 'Asset Immobiliare', val: 20, max: 20 },
                { label: 'Velocità Risposta', val: 30, max: 30 },
                { label: 'Interesse Vendita', val: 15, max: 30 },
                { label: 'Follow-up Successo', val: 20, max: 20 },
              ].map((s, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                    <span className="text-gray-500">{s.label}</span>
                    <span className="text-gray-900">{s.val}/{s.max}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(s.val / s.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Tabs & Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-2 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('immobili')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'immobili' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              🏠 Immobili
            </button>
            <button 
              onClick={() => setActiveTab('chiamate')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'chiamate' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              📞 Storico Chiamate
            </button>
            <button 
              onClick={() => setActiveTab('appuntamenti')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'appuntamenti' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              📅 Appuntamenti
            </button>
            <button 
              onClick={() => setActiveTab('note')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'note' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              📝 Note
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
            {activeTab === 'immobili' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold text-gray-900">Patrimonio Immobiliare</h4>
                  <button onClick={() => onOpenModal('ADD_PROPERTY', owner)} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100">
                    <Plus className="w-4 h-4" /> Aggiungi
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(owner.properties || []).map((p) => {
                    const categoriaInfo = getCategoria(p.category);
                    const categoriaIcona = getCategoriaIcona(p.category);
                    const categoriaColore = getCategoriaColore(p.category);

                    const colorClasses: Record<string, string> = {
                      blue: 'bg-blue-50 text-blue-700 border-blue-200',
                      purple: 'bg-purple-50 text-purple-700 border-purple-200',
                      green: 'bg-green-50 text-green-700 border-green-200',
                      orange: 'bg-orange-50 text-orange-700 border-orange-200',
                      red: 'bg-red-50 text-red-700 border-red-200',
                      gray: 'bg-gray-50 text-gray-700 border-gray-200',
                    };

                    return (
                      <div key={p.id} className="p-5 border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all group">
                        <div className="w-full h-32 bg-gray-100 rounded-xl mb-4 overflow-hidden relative">
                          <img src={`https://picsum.photos/seed/${p.id}/400/200`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Immobile" />
                          <span className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1">
                            <span>{categoriaIcona}</span>
                            {p.category}
                          </span>
                        </div>

                        <h5 className="font-bold text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          {p.address}
                        </h5>

                        {/* Tipo immobile da categoria catastale */}
                        {categoriaInfo && (
                          <div className={`mt-3 p-3 rounded-xl border ${colorClasses[categoriaColore] || colorClasses.gray}`}>
                            <div className="flex items-start gap-2">
                              <span className="text-lg">{categoriaIcona}</span>
                              <div>
                                <p className="text-xs font-bold">{categoriaInfo.codice}</p>
                                <p className="text-[11px] opacity-80">{categoriaInfo.descrizione}</p>
                                <p className="text-[9px] mt-1 opacity-60">Gruppo {categoriaInfo.gruppo}: {categoriaInfo.gruppoDescrizione}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Dati catastali */}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-[9px] text-gray-400 font-bold uppercase">Consistenza</p>
                            <p className="text-sm font-bold text-gray-700">{p.consistenza || '—'}</p>
                          </div>
                          <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-[9px] text-gray-400 font-bold uppercase">Quota</p>
                            <p className="text-sm font-bold text-gray-700">{p.share}%</p>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between items-end">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Valore Stimato</p>
                            <p className="text-lg font-bold text-blue-600">€ {(p.estimatedValue || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'chiamate' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-bold text-gray-900">Timeline Contatti</h4>
                  <button 
                    onClick={() => onOpenModal('CALL_OWNER', owner)}
                    className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition-all"
                  >
                    <Phone className="w-4 h-4 fill-current" /> Nuova Chiamata
                  </button>
                </div>
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-gray-100 before:to-transparent">
                  {(owner.calls || []).map((c, i) => (
                    <div key={c.id} className="relative flex items-start gap-8 group">
                      <div className="absolute left-0 mt-1.5 w-10 h-10 rounded-xl bg-white border-2 border-blue-500 flex items-center justify-center z-10 shadow-sm group-hover:scale-110 transition-transform">
                        <History className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="ml-14 flex-1 bg-gray-50 p-6 rounded-2xl group-hover:bg-blue-50/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-bold text-blue-600">{c.date}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                c.outcome === 'INTERESTED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {c.outcome}
                              </span>
                              <span className="text-xs text-gray-400">• Durata: {c.duration}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 font-medium leading-relaxed">"{c.notes}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'appuntamenti' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-bold text-gray-900">Follow-up & Appuntamenti</h4>
                  <button
                    onClick={() => onOpenModal('ADD_APPOINTMENT', owner)}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4" /> Nuovo Appuntamento
                  </button>
                </div>

                {(owner.appointments && owner.appointments.length > 0) ? (
                  <div className="space-y-6">
                    {owner.appointments.map((apt) => (
                      <div key={apt.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                        {/* Header appuntamento */}
                        <div className={`p-4 flex items-center justify-between ${
                          apt.type === 'VISIT' ? 'bg-green-50' : apt.type === 'CALL' ? 'bg-blue-50' : 'bg-purple-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                              apt.type === 'VISIT' ? 'bg-green-500' : apt.type === 'CALL' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}>
                              {apt.type === 'VISIT' ? '🏠' : apt.type === 'CALL' ? '📞' : '📹'}
                            </div>
                            <div>
                              <h5 className="font-bold text-gray-900">{apt.title}</h5>
                              <p className="text-xs text-gray-500">
                                {new Date(apt.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                {' alle '}
                                {new Date(apt.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            apt.type === 'VISIT' ? 'bg-green-100 text-green-700' : apt.type === 'CALL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {apt.type}
                          </span>
                        </div>

                        {/* Script section */}
                        {(apt.whatsappScript || apt.voiceScript) && (
                          <div className="p-4 space-y-4">
                            {/* WhatsApp Script */}
                            {apt.whatsappScript && (
                              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">💬</span>
                                    <h6 className="text-xs font-bold text-green-700 uppercase">Script WhatsApp</h6>
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(apt.whatsappScript || '');
                                    }}
                                    className="text-[10px] font-bold text-green-600 hover:text-green-800 flex items-center gap-1"
                                  >
                                    📋 Copia
                                  </button>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{apt.whatsappScript}</p>
                                <a
                                  href={`https://wa.me/${(owner.phone1 || owner.phones?.[0] || '').replace(/\D/g, '')}?text=${encodeURIComponent(apt.whatsappScript)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-3 inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-all"
                                >
                                  Apri WhatsApp
                                </a>
                              </div>
                            )}

                            {/* Voice Script */}
                            {apt.voiceScript && (
                              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">🎙️</span>
                                    <h6 className="text-xs font-bold text-blue-700 uppercase">Script Chiamata Vocale</h6>
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(apt.voiceScript || '');
                                    }}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    📋 Copia
                                  </button>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{apt.voiceScript}</p>
                                <button
                                  onClick={() => onOpenModal('CALL_OWNER', owner)}
                                  className="mt-3 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                                >
                                  <Phone className="w-3 h-3" /> Avvia Chiamata
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl">📅</div>
                    <div>
                      <h5 className="text-lg font-bold text-gray-900">Nessun follow-up programmato</h5>
                      <p className="text-gray-500 text-sm">Importa un file con esiti chiamata o crea manualmente un appuntamento.</p>
                    </div>
                    <button
                      onClick={() => onOpenModal('ADD_APPOINTMENT', owner)}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all"
                    >
                      Aggiungi appuntamento
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'note' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-bold text-gray-900">Note & Informazioni</h4>
                  <button
                    onClick={() => onOpenModal('EDIT_OWNER', owner)}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100"
                  >
                    <Edit3 className="w-4 h-4" /> Modifica
                  </button>
                </div>

                {/* Esito Chiamata */}
                {owner.esitoChiamata && (
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                    <h5 className="text-xs font-bold text-amber-700 uppercase mb-2">Ultimo Esito Chiamata</h5>
                    <p className="text-lg font-bold text-gray-800">{owner.esitoChiamata}</p>
                  </div>
                )}

                {/* Note */}
                {owner.notes ? (
                  <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl">
                    <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Note</h5>
                    <p className="text-gray-700 whitespace-pre-wrap">{owner.notes}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-2xl">📝</div>
                    <p className="text-gray-500 text-sm">Nessuna nota presente</p>
                  </div>
                )}

                {/* Azione Suggerita */}
                {owner.suggestedAction && (
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl">
                    <h5 className="text-xs font-bold text-blue-700 uppercase mb-2">Azione Suggerita</h5>
                    <p className="text-gray-700">{owner.suggestedAction}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
