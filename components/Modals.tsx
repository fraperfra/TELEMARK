
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Phone, Calendar, User, Save, Trash2,
  CheckCircle2, XCircle, Clock, AlertCircle,
  ChevronDown, PhoneOff, Building2, UserX,
  HelpCircle, Home, Ban, Ghost, Mic, MicOff,
  Play, Pause, StopCircle, FileText
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

// Interfaccia per le righe di trascrizione
interface TranscriptLine {
  speaker: 'agent' | 'lead';
  text: string;
  timestamp: number;
}

interface OutcomeOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const CallModal: React.FC<{ isOpen: boolean; onClose: () => void; owner?: Owner; onSaved?: (ownerId: string) => void; onCallEnd?: (outcome: string) => void }> = ({ isOpen, onClose, owner, onSaved, onCallEnd }) => {
  // Stati base
  const [callState, setCallState] = useState<'idle' | 'calling' | 'recording' | 'ended'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [outcome, setOutcome] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Stati registrazione e trascrizione
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<'agent' | 'lead'>('agent');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [liveText, setLiveText] = useState('');

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Ottieni il primo numero di telefono disponibile
  const phoneNumber = owner?.phone1 || owner?.phones?.[0] || '';

  // Reset quando si apre/chiude
  useEffect(() => {
    if (isOpen) {
      setCallState('idle');
      setSeconds(0);
      setOutcome('');
      setNotes('');
      setTranscript([]);
      setAudioBlob(null);
      setLiveText('');
      setCurrentSpeaker('agent');
      audioChunksRef.current = [];
    } else {
      stopRecording();
      stopTimer();
    }
  }, [isOpen]);

  // Timer
  const startTimer = () => {
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Avvia chiamata
  const startCall = async () => {
    if (!phoneNumber) {
      alert('Nessun numero di telefono disponibile');
      return;
    }

    // Apri il dialer del telefono
    window.location.href = `tel:${phoneNumber}`;

    // Chiedi permesso microfono
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);

      // Avvia registrazione
      startRecording(stream);

      // Avvia timer
      startTimer();
      setCallState('recording');

      // Inizializza speech recognition
      initSpeechRecognition();
    } catch (err) {
      console.error('Errore permesso microfono:', err);
      alert('Per registrare la chiamata, consenti l\'accesso al microfono');
      setCallState('calling');
      startTimer();
    }
  };

  // Registrazione audio
  const startRecording = (stream: MediaStream) => {
    audioChunksRef.current = [];

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
      setAudioBlob(blob);
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start(1000); // Chunk ogni secondo
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // Speech Recognition per trascrizione
  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition non supportato');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'it-IT';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setLiveText(interimTranscript);

      if (finalTranscript) {
        addTranscriptLine(finalTranscript);
        setLiveText('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Riavvia se non c'è parlato
        setTimeout(() => {
          if (isRecording && recognitionRef.current) {
            recognitionRef.current.start();
          }
        }, 100);
      }
    };

    recognition.onend = () => {
      // Riavvia automaticamente se ancora in registrazione
      if (isRecording && callState === 'recording') {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition già attivo');
          }
        }, 100);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // Aggiungi riga alla trascrizione
  const addTranscriptLine = (text: string) => {
    if (!text.trim()) return;

    setTranscript(prev => [
      ...prev,
      {
        speaker: currentSpeaker,
        text: text.trim(),
        timestamp: seconds
      }
    ]);

    // Auto-scroll
    setTimeout(() => {
      if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
      }
    }, 100);
  };

  // Cambia speaker
  const toggleSpeaker = () => {
    setCurrentSpeaker(prev => prev === 'agent' ? 'lead' : 'agent');
  };

  // Termina chiamata
  const endCall = () => {
    stopRecording();
    stopTimer();
    setCallState('ended');
  };

  // Salva chiamata
  const saveCall = async () => {
    if (!supabase || !owner?.id) return;
    setSaving(true);

    try {
      // Prepara trascrizione come testo formattato
      const transcriptText = transcript
        .map(line => `[${formatTime(line.timestamp)}] ${line.speaker === 'agent' ? 'AGENTE' : 'LEAD'}: ${line.text}`)
        .join('\n');

      // Combina note con trascrizione
      const fullNotes = `${notes}\n\n--- TRASCRIZIONE ---\n${transcriptText}`;

      // Inserisci nel database
      const { error } = await supabase.from('calls').insert({
        owner_id: owner.id,
        date: new Date().toISOString(),
        outcome: outcome || 'Chiamata completata',
        notes: fullNotes,
        duration: formatTime(seconds),
        transcript: transcriptText,
      });

      if (error) throw error;

      // Upload audio se disponibile
      if (audioBlob) {
        const fileName = `calls/${owner.id}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from('recordings')
          .upload(fileName, audioBlob);

        if (uploadError) {
          console.warn('Upload audio fallito:', uploadError);
        }
      }

      // Aggiorna lastContact del proprietario
      await supabase
        .from('owners')
        .update({
          lastContact: new Date().toLocaleDateString('it-IT'),
          esitoChiamata: outcome
        })
        .eq('id', owner.id);

      // Callback per archiviazione task (se chiamato da DailyTasksPage)
      if (onCallEnd && outcome) {
        onCallEnd(outcome);
      }

      onSaved?.(owner.id);
      onClose();
    } catch (error) {
      console.error('Errore salvataggio chiamata:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const outcomes: OutcomeOption[] = [
    { id: "app", label: "Appuntamento Fissato", icon: <CheckCircle2 className="w-4 h-4" />, colorClass: "text-green-600", bgClass: "bg-green-50", borderClass: "border-green-100" },
    { id: "rich", label: "Richiamare", icon: <Clock className="w-4 h-4" />, colorClass: "text-amber-600", bgClass: "bg-amber-50", borderClass: "border-amber-100" },
    { id: "no_resp", label: "Nessuna risposta", icon: <PhoneOff className="w-4 h-4" />, colorClass: "text-slate-500", bgClass: "bg-slate-50", borderClass: "border-slate-100" },
    { id: "no_vend", label: "Non Vende", icon: <XCircle className="w-4 h-4" />, colorClass: "text-rose-600", bgClass: "bg-rose-50", borderClass: "border-rose-100" },
    { id: "aff_age", label: "Affitta con Agenzia", icon: <Building2 className="w-4 h-4" />, colorClass: "text-sky-600", bgClass: "bg-sky-50", borderClass: "border-sky-100" },
    { id: "vend_age", label: "Vende con Agenzia", icon: <Building2 className="w-4 h-4" />, colorClass: "text-indigo-600", bgClass: "bg-indigo-50", borderClass: "border-indigo-100" },
    { id: "imp", label: "Occupato adesso", icon: <Ban className="w-4 h-4" />, colorClass: "text-orange-500", bgClass: "bg-orange-50", borderClass: "border-orange-100" },
    { id: "viv_lor", label: "Vivono Loro", icon: <Home className="w-4 h-4" />, colorClass: "text-teal-600", bgClass: "bg-teal-50", borderClass: "border-teal-100" },
    { id: "att_inf", label: "Attesa Info", icon: <HelpCircle className="w-4 h-4" />, colorClass: "text-blue-500", bgClass: "bg-blue-50", borderClass: "border-blue-100" },
    { id: "gia_vend", label: "Ha già venduto", icon: <CheckCircle2 className="w-4 h-4" />, colorClass: "text-gray-400", bgClass: "bg-gray-100", borderClass: "border-gray-200" },
    { id: "non_es", label: "Numero errato", icon: <Ghost className="w-4 h-4" />, colorClass: "text-gray-600", bgClass: "bg-gray-50", borderClass: "border-gray-200" },
    { id: "ins", label: "Non interessato", icon: <UserX className="w-4 h-4" />, colorClass: "text-red-900", bgClass: "bg-red-50", borderClass: "border-red-200" }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={owner ? `Chiamata: ${owner.firstName} ${owner.lastName}` : "Chiamata"}>
      <div className="space-y-6">
        {/* Header con stato chiamata */}
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Icona stato */}
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ring-8 transition-all ${
            callState === 'idle' ? 'bg-blue-50 text-blue-600 ring-blue-500/10' :
            callState === 'recording' ? 'bg-green-50 text-green-600 ring-green-500/10 animate-pulse' :
            callState === 'ended' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' :
            'bg-amber-50 text-amber-600 ring-amber-500/10 animate-pulse'
          }`}>
            {isRecording ? <Mic className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
          </div>

          {/* Timer */}
          <div>
            <div className="text-5xl font-black text-gray-900 tracking-tighter tabular-nums">{formatTime(seconds)}</div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              {callState === 'idle' && 'Pronto per chiamare'}
              {callState === 'calling' && 'Chiamata in corso...'}
              {callState === 'recording' && 'Registrazione attiva'}
              {callState === 'ended' && 'Chiamata terminata'}
            </p>
          </div>

          {/* Numero telefono */}
          {phoneNumber && (
            <div className="bg-gray-50 px-4 py-2 rounded-xl">
              <p className="text-sm font-bold text-gray-700">{phoneNumber}</p>
            </div>
          )}
        </div>

        {/* Pulsanti azione chiamata */}
        {callState === 'idle' && (
          <button
            onClick={startCall}
            disabled={!phoneNumber}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Phone className="w-5 h-5" />
            Avvia Chiamata e Registrazione
          </button>
        )}

        {(callState === 'calling' || callState === 'recording') && (
          <div className="flex gap-3">
            {/* Toggle speaker */}
            <button
              onClick={toggleSpeaker}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                currentSpeaker === 'agent'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-purple-100 text-purple-700 border-2 border-purple-300'
              }`}
            >
              {currentSpeaker === 'agent' ? '🎙️ Agente' : '👤 Lead'}
            </button>

            {/* Termina */}
            <button
              onClick={endCall}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              Termina
            </button>
          </div>
        )}

        {/* Trascrizione live */}
        {(callState === 'recording' || callState === 'ended') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3" /> Trascrizione Live
              </label>
              {isRecording && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  REC
                </span>
              )}
            </div>

            <div
              ref={transcriptRef}
              className="bg-gray-50 rounded-2xl p-4 max-h-48 overflow-y-auto scroll-touch space-y-2"
            >
              {transcript.length === 0 && !liveText && (
                <p className="text-gray-400 text-sm text-center py-4">
                  La trascrizione apparirà qui...
                </p>
              )}

              {transcript.map((line, i) => (
                <div key={i} className={`p-2 rounded-xl ${
                  line.speaker === 'agent' ? 'bg-blue-100 ml-4' : 'bg-purple-100 mr-4'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase ${
                      line.speaker === 'agent' ? 'text-blue-600' : 'text-purple-600'
                    }`}>
                      {line.speaker === 'agent' ? '🎙️ Agente' : '👤 Lead'}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatTime(line.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{line.text}</p>
                </div>
              ))}

              {/* Testo live (interim) */}
              {liveText && (
                <div className={`p-2 rounded-xl opacity-60 ${
                  currentSpeaker === 'agent' ? 'bg-blue-100 ml-4' : 'bg-purple-100 mr-4'
                }`}>
                  <p className="text-sm text-gray-500 italic">{liveText}...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selezione esito - mostrato dopo la chiamata */}
        {callState === 'ended' && (
          <>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-blue-500" /> Esito Chiamata
              </label>

              <div className="grid grid-cols-3 gap-2">
                {outcomes.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setOutcome(opt.label)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all active:scale-95 ${
                      outcome === opt.label
                        ? `${opt.bgClass} ${opt.borderClass.replace('100', '400')} shadow-md`
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`${opt.colorClass}`}>{opt.icon}</div>
                    <span className={`text-[9px] font-bold text-center leading-tight ${
                      outcome === opt.label ? opt.colorClass : 'text-gray-500'
                    }`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Save className="w-3 h-3" /> Note Aggiuntive
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[80px] text-sm resize-none"
                placeholder="Note sulla chiamata..."
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-all text-sm">
                Annulla
              </button>
              <button
                onClick={saveCall}
                disabled={saving}
                className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : 'Salva Chiamata'}
              </button>
            </div>
          </>
        )}
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Fissa Appuntamento: ${owner?.firstName || 'Lead'}`}>
      <form className="space-y-6" onSubmit={async (e) => {
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
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tipo</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'VISIT', icon: '🏠' },
              { label: 'CALL', icon: '📞' },
              { label: 'VIDEO', icon: '📹' },
              { label: 'SIGNING', icon: '📝' }
            ].map(type => (
              <button key={type.label} type="button" onClick={() => setAppointmentType(type.label as any)} className={`py-3 px-2 border rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center gap-1 ${type.label === appointmentType ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                <span className="text-lg">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Luogo</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Indirizzo o URL" />
        </div>
        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-all">Annulla</button>
          <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Pianifica</button>
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Nuovo Immobile: ${owner?.firstName || 'Lead'}`}>
      <form className="space-y-6" onSubmit={async (e) => {
        e.preventDefault();
        if (!supabase || !owner?.id) return;
        setSaving(true);
        try {
          const { error } = await supabase.from('properties').insert({
            owner_id: owner.id,
            address,
            category,
            estimatedValue: Number(estimatedValue) || 0,
            share: Number(share) || 100,
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
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Valore</label>
            <input type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Quota %</label>
          <input type="number" value={share} onChange={(e) => setShare(e.target.value)} className="w-full bg-gray-50 border-gray-100 rounded-2xl py-3.5 px-4 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
        </div>
        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-all">Annulla</button>
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Salva</button>
        </div>
      </form>
    </Modal>
  );
};
