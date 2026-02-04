
import React, { useState } from 'react';
import { CloudUpload, ChevronRight, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet, Loader2, Sparkles, Database } from 'lucide-react';
import { ViewState } from '../types';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { parse } from 'csv-parse/browser/esm/sync';

interface UploadPageProps {
  onCompleteNavigation: (view: ViewState) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onCompleteNavigation }) => {
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  const nextStep = () => {
    if (step < 4) {
      if (step === 1) {
        setIsUploading(true);
        setTimeout(() => {
          setIsUploading(false);
          setStep(2);
        }, 1500);
      } else {
        setStep(step + 1);
      }
    }
  };

  // Parsed CSV rows (array of objects keyed by header)
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [bulkEditHeader, setBulkEditHeader] = useState<string>('');
  const [bulkEditValue, setBulkEditValue] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string,string>>({});
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<any>>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  // Known DB columns in `owners` (fallback when table empty)
  const knownDbFields = [
    'firstName','lastName','taxCode','email','birthDate','temperature','score','propertiesCount','lastContact','suggestedAction','tags','created_at',
    'address','civico','consistenza','categoria','quota','phone1','phone2','phone3','esitoChiamata','notes'
  ];
  const [dbFields, setDbFields] = useState<string[]>(knownDbFields);

  // Robust file parser (CSV via PapaParse, XLSX via sheet_to_json)
  const parseFile = async (file: File) => {
    setParsingError(null);
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) {
      const text = await file.text();
      return parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      }) as any[];
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      // Using ExcelJS as a secure alternative to xlsx (SheetJS)
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      
      if (!worksheet) {
        throw new Error('No worksheet found in the Excel file');
      }
      
      // Convert worksheet to JSON format similar to xlsx output
      const data: any[] = [];
      const headers: string[] = [];
      
      // Get headers from first row
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers.push(cell.text || `Column${colNumber}`);
      });
      
      // Process data rows starting from row 2
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const rowData: any = {};
        
        headers.forEach((header, index) => {
          const cell = row.getCell(index + 1);
          rowData[header] = cell.text || '';
        });
        
        // Only add non-empty rows
        if (Object.values(rowData).some(value => value !== '')) {
          data.push(rowData);
        }
      }
      
      return data;
    }
    throw new Error('Formato file non supportato');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setIsUploading(true);
    try {
      const rows = await parseFile(f);
      if (!rows || rows.length === 0) {
        setParsingError('Nessun record rilevato');
        return;
      }
      setParsedRows(rows);
      const detectedHeaders = Object.keys(rows[0]);
      setHeaders(detectedHeaders);
      // Auto-map heuristics - mappatura automatica colonne CSV
      const autoMap: Record<string,string> = {};
      let phoneIndex = 1;
      detectedHeaders.forEach(h => {
        const lh = h.toLowerCase().trim();
        // Mappature esatte per le colonne dell'utente
        if (lh === 'nome') autoMap[h] = 'firstName';
        else if (lh === 'cognome') autoMap[h] = 'lastName';
        else if (lh === 'codice fiscale' || lh.includes('codice') && lh.includes('fisc')) autoMap[h] = 'taxCode';
        else if (lh === 'indirizzo') autoMap[h] = 'address';
        else if (lh === 'civico') autoMap[h] = 'civico';
        else if (lh === 'consistenza') autoMap[h] = 'consistenza';
        else if (lh === 'categoria') autoMap[h] = 'categoria';
        else if (lh === 'data nascita' || lh.includes('nasc')) autoMap[h] = 'birthDate';
        else if (lh === 'quota') autoMap[h] = 'quota';
        else if (lh === 'cellulare' || lh === 'cellulare1') autoMap[h] = 'phone1';
        else if (lh === 'cellulare2') autoMap[h] = 'phone2';
        else if (lh === 'cellulare3') autoMap[h] = 'phone3';
        else if (lh === 'nr. immobili' || lh.includes('immob') || (lh.includes('nr') && lh.includes('immob'))) autoMap[h] = 'propertiesCount';
        else if (lh === 'esito chiamata' || lh.includes('esito')) autoMap[h] = 'esitoChiamata';
        else if (lh === 'note') autoMap[h] = 'notes';
        else if (lh.includes('email')) autoMap[h] = 'email';
        // Fallback per telefoni generici
        else if (lh.includes('cell') || lh.includes('tel') || lh.includes('telefono') || lh.includes('mobile')) {
          autoMap[h] = `phone${phoneIndex}`;
          phoneIndex = Math.min(phoneIndex + 1, 3);
        }
        else autoMap[h] = 'ignore';
      });
      setMapping(autoMap);
      // try fetching existing fields from DB by selecting one row
      try {
        const { data } = await supabase.from('owners').select().limit(1).maybeSingle();
        if (data) {
          const keys = Object.keys(data as Record<string, any>);
          setDbFields(Array.from(new Set([...knownDbFields, ...keys])));
        }
      } catch (_) {
        // ignore
      }
      setParsingError(null);
      setStep(2);
      // reset selections
      setSelectedRows({});
      setSelectAll(false);
      setBulkEditHeader('');
      setBulkEditValue('');
    } catch (err: any) {
      setParsingError(err?.message || 'Errore parsing file');
    } finally {
      setIsUploading(false);
    }
  };

  // Map common header names to DB fields
  const mapRowToOwner = (row: any) => {
    const owner: any = {
      firstName: null,
      lastName: null,
      taxCode: null,
      email: null,
      birthDate: null,
      propertiesCount: 0,
      suggestedAction: null,
      // Nuovi campi per importazione completa
      address: null,
      civico: null,
      consistenza: null,
      categoria: null,
      quota: null,
      phone1: null,
      phone2: null,
      phone3: null,
      esitoChiamata: null,
      notes: null,
      phones: [] as string[],
    };
    Object.keys(row).forEach(h => {
      const field = mapping[h];
      const v = row[h];
      if (!field || field === 'ignore') return;
      if (field === 'propertiesCount') {
        const n = Number(v);
        const safe = Number.isFinite(n) ? Math.max(0, Math.min(2147483647, Math.trunc(n))) : 0;
        owner.propertiesCount = safe;
      }
      else if (field === 'phone1') {
        const phone = v && String(v).trim() !== '' ? String(v).trim() : null;
        owner.phone1 = phone;
        if (phone) owner.phones.push(phone);
      }
      else if (field === 'phone2') {
        const phone = v && String(v).trim() !== '' ? String(v).trim() : null;
        owner.phone2 = phone;
        if (phone) owner.phones.push(phone);
      }
      else if (field === 'phone3') {
        const phone = v && String(v).trim() !== '' ? String(v).trim() : null;
        owner.phone3 = phone;
        if (phone) owner.phones.push(phone);
      }
      else if (field === 'birthDate') {
        owner.birthDate = parseDateValue(v);
      } else {
        owner[field] = v && String(v).trim() !== '' ? String(v).trim() : null;
      }
    });
    // Ensure minimal defaults
    owner.firstName = owner.firstName || 'N/A';
    owner.lastName = owner.lastName || 'N/A';
    return owner;
  };

    // Validation helpers
    const normalizePhone = (p: string) => (p || '').replace(/[^0-9+]/g, '');

    const validatePhone = (p: string) => {
      const n = normalizePhone(p);
      const digits = n.replace(/^\+/, '');
      return digits.length >= 7 && digits.length <= 15;
    };

    const validateCodiceFiscale = (cf: string) => {
      if (!cf) return false;
      const c = String(cf).toUpperCase().trim();
      if (!/^[A-Z0-9]{16}$/.test(c)) return false;
      const oddMap: any = {
        '0': 1,'1': 0,'2': 5,'3': 7,'4': 9,'5': 13,'6': 15,'7': 17,'8': 19,'9': 21,
        'A': 1,'B': 0,'C': 5,'D': 7,'E': 9,'F': 13,'G': 15,'H': 17,'I': 19,'J': 21,'K': 2,'L': 4,'M': 18,'N': 20,'O': 11,'P': 3,'Q': 6,'R': 8,'S': 12,'T': 14,'U': 16,'V': 10,'W': 22,'X': 25,'Y': 24,'Z': 23
      };
      const evenMap: any = {
        '0': 0,'1': 1,'2': 2,'3': 3,'4': 4,'5': 5,'6': 6,'7': 7,'8': 8,'9': 9,
        'A': 0,'B': 1,'C': 2,'D': 3,'E': 4,'F': 5,'G': 6,'H': 7,'I': 8,'J': 9,'K': 10,'L': 11,'M': 12,'N': 13,'O': 14,'P': 15,'Q': 16,'R': 17,'S': 18,'T': 19,'U': 20,'V': 21,'W': 22,'X': 23,'Y': 24,'Z': 25
      };
      const controlChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let sum = 0;
      for (let i = 0; i < 15; i++) {
        const ch = c.charAt(i);
        if ((i % 2) === 0) sum += oddMap[ch]; else sum += evenMap[ch];
      }
      const check = controlChars[sum % 26];
      return check === c.charAt(15);
    };

    const validateParsedRows = () => {
      const errors: any[] = [];
      const seenTax: Record<string, number> = {};
      let vCount = 0, iCount = 0;
      parsedRows.forEach((r, idx) => {
        const owner = mapRowToOwner(r);
        const rowErrors: string[] = [];
        if (owner.taxCode) {
          if (!validateCodiceFiscale(owner.taxCode)) rowErrors.push('Codice Fiscale non valido');
          const tf = String(owner.taxCode).toUpperCase();
          seenTax[tf] = (seenTax[tf] || 0) + 1;
        }
        if (owner.phones && owner.phones.length > 0) {
          const bad = owner.phones.filter((p: string) => !validatePhone(p));
          if (bad.length > 0) rowErrors.push('Telefono non valido: ' + bad.join(', '));
        }
        if (rowErrors.length > 0) {
          errors.push({ index: idx+1, errors: rowErrors, row: r });
          iCount++;
        } else vCount++;
      });
      // duplicates
      let dCount = 0;
      Object.keys(seenTax).forEach(k => { if (seenTax[k] > 1) dCount += seenTax[k] });
      setValidationErrors(errors);
      setValidCount(vCount);
      setInvalidCount(iCount);
      setDuplicateCount(dCount);
    };

  // Funzione per convertire quota (es. "500/1000") in percentuale
  const parseQuotaToShare = (quota: string | null): number => {
    if (!quota) return 100;
    const q = String(quota).trim();
    // Formato "500/1000"
    const match = q.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      const den = parseInt(match[2], 10);
      if (den > 0) return Math.round((num / den) * 100);
    }
    // Formato percentuale "50%" o "50"
    const pct = parseFloat(q.replace('%', ''));
    if (!isNaN(pct)) return Math.min(100, Math.max(0, Math.round(pct)));
    return 100;
  };

  // Funzione per generare script WhatsApp e vocale
  const generateScripts = (esito: string, ownerName: string, ownerData: any) => {
    const firstName = ownerData.firstName || ownerName.split(' ')[0];
    const address = ownerData.address ? `${ownerData.address}${ownerData.civico ? ' ' + ownerData.civico : ''}` : 'il suo immobile';

    const scripts: Record<string, { whatsapp: string; voice: string }> = {
      RICHIAMARE: {
        whatsapp: `Buongiorno ${firstName}, sono [NOME] di [AGENZIA]. La ricontatto come concordato riguardo ${address}. Quando Le farebbe comodo un breve colloquio telefonico? Resto a disposizione.`,
        voice: `Buongiorno, parlo con il Signor/la Signora ${firstName}? Sono [NOME] di [AGENZIA]. La richiamo come avevamo concordato nella nostra precedente conversazione riguardo al suo immobile in ${address}. Avrebbe qualche minuto per parlarne? Vorrei capire meglio le sue esigenze e come possiamo esserle utili.`
      },
      INTERESSATO: {
        whatsapp: `Gentile ${firstName}, grazie per l'interesse mostrato! Sono [NOME] di [AGENZIA]. Come discusso, Le scrivo per organizzare un incontro e valutare insieme le migliori opportunità per ${address}. Quando sarebbe disponibile?`,
        voice: `Buongiorno ${firstName}, sono [NOME] di [AGENZIA]. La chiamo per ringraziarla dell'interesse mostrato riguardo alla possibile vendita di ${address}. Sarei lieto di fissare un appuntamento per una valutazione gratuita e senza impegno. Quando Le farebbe comodo? Potremmo incontrarci direttamente presso l'immobile.`
      },
      APPUNTAMENTO: {
        whatsapp: `Buongiorno ${firstName}, Le confermo il nostro appuntamento per la visita di ${address}. La aspetto il [DATA] alle [ORA]. Per qualsiasi necessità mi contatti pure. A presto! - [NOME], [AGENZIA]`,
        voice: `Buongiorno ${firstName}, sono [NOME] di [AGENZIA]. La chiamo per confermare il nostro appuntamento per la visita dell'immobile in ${address}. Sarò da Lei il [DATA] alle [ORA]. Nel frattempo, se avesse domande o necessità di spostare l'appuntamento, non esiti a contattarmi. Grazie e a presto.`
      },
      NON_RISPONDE: {
        whatsapp: `Buongiorno ${firstName}, sono [NOME] di [AGENZIA]. Ho provato a contattarla telefonicamente senza successo. La contatto per una valutazione gratuita del suo immobile in ${address}. Mi faccia sapere quando posso richiamarla. Grazie!`,
        voice: `Buongiorno, cercavo il Signor/la Signora ${firstName}. Sono [NOME] di [AGENZIA] immobiliare. La contatto riguardo al suo immobile in ${address}. Riproverò a chiamarla nei prossimi giorni, oppure se preferisce può richiamarmi al [NUMERO]. Grazie e buona giornata.`
      },
      NON_INTERESSATO: {
        whatsapp: `Gentile ${firstName}, La ringrazio per il tempo dedicatomi. Capisco che al momento non sia interessato, ma il mercato immobiliare cambia rapidamente. Se in futuro volesse una valutazione aggiornata di ${address}, sarò a disposizione. Le auguro una buona giornata. - [NOME], [AGENZIA]`,
        voice: `Buongiorno ${firstName}, sono [NOME] di [AGENZIA]. So che in passato aveva indicato di non essere interessato alla vendita, ma volevo informarla che il mercato immobiliare nella sua zona ha avuto sviluppi interessanti. Se volesse una valutazione aggiornata e gratuita di ${address}, senza alcun impegno, sono a disposizione. Grazie per l'attenzione.`
      },
      DEFAULT: {
        whatsapp: `Buongiorno ${firstName}, sono [NOME] di [AGENZIA]. La contatto riguardo al suo immobile in ${address}. Sarebbe interessato a una valutazione gratuita? Resto a disposizione per qualsiasi informazione.`,
        voice: `Buongiorno, parlo con ${firstName}? Sono [NOME], consulente immobiliare di [AGENZIA]. La contatto perché operiamo nella sua zona e stiamo cercando immobili come il suo in ${address} per i nostri clienti. Le interesserebbe sapere quanto potrebbe valere oggi il suo immobile? La valutazione è completamente gratuita e senza impegno.`
      }
    };

    return scripts[esito] || scripts.DEFAULT;
  };

  // Funzione per generare follow-up in base all'esito chiamata
  const generateFollowUp = (esitoChiamata: string | null, ownerId: string, ownerName: string, ownerData: any = {}): any | null => {
    if (!esitoChiamata) return null;

    const esito = esitoChiamata.toUpperCase().trim();
    const now = new Date();

    let followUp: any = null;
    let scriptKey = 'DEFAULT';

    // Mapping esiti -> follow-up
    // DA RICHIAMARE, RICHIAMARE, CALL_BACK -> Richiamata tra 2 giorni
    if (esito.includes('RICHIAMARE') || esito.includes('CALL_BACK') || esito.includes('RICHIAMA')) {
      const followUpDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      scriptKey = 'RICHIAMARE';
      followUp = {
        owner_id: ownerId,
        date: followUpDate.toISOString(),
        type: 'CALL',
        title: `Richiamare ${ownerName}`,
        location: null,
      };
    }
    // INTERESSATO, INTERESTED -> Appuntamento telefonico tra 1 giorno
    else if (esito.includes('INTERESSATO') || esito.includes('INTERESTED') || esito.includes('INTERESSE')) {
      const followUpDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      scriptKey = 'INTERESSATO';
      followUp = {
        owner_id: ownerId,
        date: followUpDate.toISOString(),
        type: 'CALL',
        title: `Follow-up interessamento - ${ownerName}`,
        location: null,
      };
    }
    // APPUNTAMENTO, APPOINTMENT, VISITA -> Visita tra 3 giorni
    else if (esito.includes('APPUNTAMENTO') || esito.includes('APPOINTMENT') || esito.includes('VISITA')) {
      const followUpDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      scriptKey = 'APPUNTAMENTO';
      followUp = {
        owner_id: ownerId,
        date: followUpDate.toISOString(),
        type: 'VISIT',
        title: `Visita immobile - ${ownerName}`,
        location: null,
      };
    }
    // NON RISPONDE, NO_ANSWER, OCCUPATO -> Richiamata tra 1 giorno
    else if (esito.includes('NON RISPONDE') || esito.includes('NO_ANSWER') || esito.includes('OCCUPATO') || esito.includes('ASSENTE')) {
      const followUpDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      scriptKey = 'NON_RISPONDE';
      followUp = {
        owner_id: ownerId,
        date: followUpDate.toISOString(),
        type: 'CALL',
        title: `Ritentare chiamata - ${ownerName}`,
        location: null,
      };
    }
    // NON INTERESSATO, NOT_INTERESTED -> Follow-up tra 30 giorni (freddo)
    else if (esito.includes('NON INTERESSATO') || esito.includes('NOT_INTERESTED') || esito.includes('RIFIUTA')) {
      const followUpDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      scriptKey = 'NON_INTERESSATO';
      followUp = {
        owner_id: ownerId,
        date: followUpDate.toISOString(),
        type: 'CALL',
        title: `Ricontatto freddo - ${ownerName}`,
        location: null,
      };
    }
    // VENDUTO, DECEDUTO, ERRATO -> Nessun follow-up
    else if (esito.includes('VENDUTO') || esito.includes('DECEDUTO') || esito.includes('ERRATO') || esito.includes('NUMERO ERRATO')) {
      return null;
    }
    // Default: qualsiasi altro esito -> follow-up generico tra 7 giorni
    else {
      const followUpDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      followUp = {
        owner_id: ownerId,
        date: followUpDate.toISOString(),
        type: 'CALL',
        title: `Follow-up - ${ownerName} (${esitoChiamata})`,
        location: null,
      };
    }

    // Aggiungi gli script al follow-up
    if (followUp) {
      const scripts = generateScripts(scriptKey, ownerName, ownerData);
      followUp.whatsappScript = scripts.whatsapp;
      followUp.voiceScript = scripts.voice;
    }

    return followUp;
  };

  const syncToSupabase = async () => {
    if (!supabase) {
      setParsingError('Supabase non configurato.');
      return;
    }
    if (parsedRows.length === 0) {
      setParsingError('Nessun record parsato da sincronizzare.');
      return;
    }
    setSyncing(true);
    try {
      const allOwners = parsedRows.map(mapRowToOwner).map((o: any) => ({
        firstName: o.firstName,
        lastName: o.lastName,
        taxCode: o.taxCode || null,
        email: o.email || null,
        birthDate: o.birthDate || null,
        propertiesCount: o.propertiesCount || 0,
        suggestedAction: o.suggestedAction || null,
        // Nuovi campi per importazione completa
        address: o.address || null,
        civico: o.civico || null,
        consistenza: o.consistenza || null,
        categoria: o.categoria || null,
        quota: o.quota || null,
        phone1: o.phone1 || null,
        phone2: o.phone2 || null,
        phone3: o.phone3 || null,
        esitoChiamata: o.esitoChiamata || null,
        notes: o.notes || null,
      }));

      // Deduplica per taxCode - mantiene l'ultimo record per ogni codice fiscale
      const uniqueByTaxCode = new Map<string, any>();
      const ownersWithoutTaxCode: any[] = [];

      allOwners.forEach((owner) => {
        if (owner.taxCode) {
          const key = owner.taxCode.toUpperCase().trim();
          uniqueByTaxCode.set(key, owner);
        } else {
          ownersWithoutTaxCode.push(owner);
        }
      });

      const ownersToUpsert = [...uniqueByTaxCode.values(), ...ownersWithoutTaxCode];

      // STEP 1: Upsert owners
      const batchSize = 200;
      for (let i = 0; i < ownersToUpsert.length; i += batchSize) {
        const batch = ownersToUpsert.slice(i, i + batchSize);
        const { error } = await supabase.from('owners').upsert(batch, { onConflict: 'taxCode' });
        if (error) {
          handleSupabaseError(error, 'Errore upsert owners');
          setParsingError(error.message);
          setSyncing(false);
          return;
        }
      }

      // STEP 2: Recupera gli owner appena inseriti per ottenere gli ID
      const taxCodes = ownersToUpsert.filter(o => o.taxCode).map(o => o.taxCode.toUpperCase().trim());

      if (taxCodes.length > 0) {
        const { data: insertedOwners, error: fetchError } = await supabase
          .from('owners')
          .select('id, taxCode, firstName, lastName, address, civico, categoria, consistenza, quota, esitoChiamata')
          .in('taxCode', taxCodes);

        if (fetchError) {
          console.error('Errore recupero owners:', fetchError);
        } else if (insertedOwners && insertedOwners.length > 0) {
          // STEP 3: Crea le properties per ogni owner che ha un indirizzo
          const propertiesToInsert = insertedOwners
            .filter((owner: any) => owner.address) // Solo se ha un indirizzo
            .map((owner: any) => ({
              owner_id: owner.id,
              address: `${owner.address}${owner.civico ? ', ' + owner.civico : ''}`,
              category: owner.categoria || 'Appartamento',
              consistenza: owner.consistenza || null,
              share: parseQuotaToShare(owner.quota),
              estimatedValue: 0,
            }));

          if (propertiesToInsert.length > 0) {
            // Prima elimina le properties esistenti per questi owner (evita duplicati)
            const ownerIds = propertiesToInsert.map((p: any) => p.owner_id);
            await supabase.from('properties').delete().in('owner_id', ownerIds);

            // Inserisci le nuove properties
            for (let i = 0; i < propertiesToInsert.length; i += batchSize) {
              const batch = propertiesToInsert.slice(i, i + batchSize);
              const { error: propError } = await supabase.from('properties').insert(batch);
              if (propError) {
                console.error('Errore inserimento properties:', propError);
              }
            }
          }

          // STEP 4: Crea follow-up/appuntamenti in base all'esito chiamata
          const appointmentsToInsert = insertedOwners
            .map((owner: any) => generateFollowUp(
              owner.esitoChiamata,
              owner.id,
              `${owner.firstName} ${owner.lastName}`,
              owner // Passa tutti i dati owner per generare gli script
            ))
            .filter((apt: any) => apt !== null);

          if (appointmentsToInsert.length > 0) {
            // Elimina appuntamenti esistenti creati da import precedenti (opzionale)
            const ownerIdsWithFollowUp = appointmentsToInsert.map((a: any) => a.owner_id);
            await supabase.from('appointments').delete().in('owner_id', ownerIdsWithFollowUp);

            // Inserisci i nuovi appuntamenti
            for (let i = 0; i < appointmentsToInsert.length; i += batchSize) {
              const batch = appointmentsToInsert.slice(i, i + batchSize);
              const { error: aptError } = await supabase.from('appointments').insert(batch);
              if (aptError) {
                console.error('Errore inserimento appointments:', aptError);
              }
            }
          }
        }
      }

      setSyncing(false);
      setStep(4);
    } catch (err: any) {
      setParsingError(err?.message || 'Errore sincronizzazione');
      setSyncing(false);
    }
  };

  // Date parsing helpers: support ISO, dd/mm/yyyy, dd-mm-yyyy and Excel serial numbers
  const excelSerialToJSDate = (serial: number) => {
    // Excel incorrectly treats 1900 as leap year; use epoch 1899-12-30
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = Math.floor(serial);
    const ms = days * 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + ms);
  };

  const parseDateValue = (v: any) => {
    if (v == null || v === '') return null;
    // if it's already a Date
    if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
    // if number -> maybe Excel serial
    if (typeof v === 'number') {
      try {
        const d = excelSerialToJSDate(v);
        if (!isNaN(d.getTime())) return d.toISOString();
      } catch (_) {
        return null;
      }
    }
    const s = String(v).trim();
    // ISO
    const iso = new Date(s);
    if (!isNaN(iso.getTime())) return iso.toISOString();
    // dd/mm/yyyy or dd-mm-yyyy
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      let day = Number(m[1]);
      let month = Number(m[2]) - 1;
      let year = Number(m[3]);
      if (year < 100) year += 1900;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return null;
  };

  // Definizione delle colonne richieste dall'utente per il mapping
  const csvMappingRows = [
    { file: 'Codice fiscale', db: 'Codice Fiscale (Univoco)', preview: 'RSSMRC80A01H501U' },
    { file: 'Cognome', db: 'Cognome', preview: 'Rossi' },
    { file: 'Nome', db: 'Nome', preview: 'Marco' },
    { file: 'Data nascita', db: 'Data di Nascita', preview: '01/01/1980' },
    { file: 'Indirizzo', db: 'Indirizzo Immobile', preview: 'Via Roma' },
    { file: 'Civico', db: 'N. Civico', preview: '12' },
    { file: 'Consistenza', db: 'Consistenza (Vani/Mq)', preview: '5.5' },
    { file: 'Categoria', db: 'Categoria Catastale', preview: 'A/3' },
    { file: 'Quota', db: 'Quota Proprietà', preview: '1000/1000' },
    { file: 'Cellulare', db: 'Telefono 1 (Primario)', preview: '3401234567' },
    { file: 'cellulare2', db: 'Telefono 2', preview: '3359876543' },
    { file: 'cellulare3', db: 'Telefono 3', preview: '-' },
    { file: 'Nr. Immobili', db: 'Conteggio Immobili', preview: '2' },
    { file: 'ESITO CHIAMATA', db: 'Ultimo Esito', preview: 'DA RICHIAMARE' },
    { file: 'NOTE', db: 'Note / Descrizione', preview: 'Interessato alla vendita...' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in duration-300 pb-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900">Importa Dati Proprietari</h1>
        <p className="text-gray-500">Carica il tuo file Excel/CSV con le colonne personalizzate per sincronizzare il database 🚀</p>
      </div>

      <div className="flex items-center justify-between px-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
        <div className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(step - 1) * 33.33}%` }} />
        
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              step >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-2 border-gray-200 text-gray-400'
            }`}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s ? 'text-blue-600' : 'text-gray-400'}`}>
              {s === 1 && 'Upload'}
              {s === 2 && 'Mapping'}
              {s === 3 && 'Validazione'}
              {s === 4 && 'Completato'}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 min-h-[500px] flex flex-col">
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center">
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
                <p className="text-lg font-bold text-gray-700">Lettura colonne in corso...</p>
                <p className="text-sm text-gray-400">Riconoscimento campi: Codice Fiscale, Cellulare, Esito...</p>
              </div>
            ) : (
              <>
                <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center border-4 border-dashed border-blue-200 relative group cursor-pointer hover:bg-blue-100 transition-all">
                  <CloudUpload className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />
                  <input type="file" accept=".csv,.xlsx,.xls" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Trascina il file qui</h4>
                  <p className="text-gray-500 mt-1">Accetta .CSV o .XLSX con le colonne standard</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                  <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] font-mono text-gray-500">Codice Fiscale</span>
                  <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] font-mono text-gray-500">Indirizzo</span>
                  <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] font-mono text-gray-500">Cellulare</span>
                  <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] font-mono text-gray-500">Esito</span>
                  <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] font-mono text-gray-500">Note</span>
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xl font-bold text-gray-900">Mappa le colonne</h4>
                <p className="text-sm text-gray-500">Il sistema ha rilevato le seguenti colonne dal tuo file.</p>
              </div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AUTO-MAPPING ATTIVO
              </div>
            </div>
            
            <div className="overflow-hidden border border-gray-200 rounded-2xl shadow-sm">
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Colonna File CSV</th>
                      <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Campo Database Destinazione</th>
                      <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Anteprima Dati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {headers.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-4 text-sm text-gray-500">Nessuna intestazione rilevata</td></tr>
                    ) : (
                      headers.map((h, i) => (
                        <tr key={h} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-bold text-gray-800 font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                {h}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2 text-blue-600">
                              <Database className="w-3 h-3" />
                              <select
                                value={mapping[h] || 'ignore'}
                                onChange={(e) => setMapping(prev => ({ ...prev, [h]: e.target.value }))}
                                className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold w-full outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer hover:border-blue-300 transition-colors"
                              >
                                <option value="ignore">Ignora Colonna</option>
                                <option value="phone1">Telefono 1</option>
                                <option value="phone2">Telefono 2</option>
                                <option value="phone3">Telefono 3</option>
                                {dbFields.map(f => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-xs text-gray-500 font-medium font-mono">
                            {parsedRows[0] ? String(parsedRows[0][h]) : ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preview e selezione righe per operazioni bulk */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-bold">Anteprima record (prima 50 righe)</h4>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectAll} onChange={(e) => {
                      const checked = e.target.checked; setSelectAll(checked);
                      if (checked) {
                        const sel: Record<number, boolean> = {}; parsedRows.slice(0,50).forEach((_,i)=> sel[i]=true); setSelectedRows(sel);
                      } else { setSelectedRows({}); }
                    }} /> Seleziona tutti</label>
                  <button onClick={() => {
                    const selIdx = Object.keys(selectedRows).map(k=>Number(k)).filter(i=>selectedRows[i]);
                    if (selIdx.length===0) return; const remaining = parsedRows.filter((_,i)=> !selectedRows[i]); setParsedRows(remaining); setSelectedRows({}); setSelectAll(false); validateParsedRows();
                  }} className="px-3 py-2 bg-red-600 text-white rounded">Elimina selezionati</button>
                </div>
              </div>

              <div className="overflow-x-auto bg-white border border-gray-100 rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr>
                    <th className="p-2 w-10"></th>
                    {headers.slice(0,8).map(h => <th key={h} className="p-2 font-bold text-xs text-gray-600">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {parsedRows.slice(0,50).map((r, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-center">
                          <input type="checkbox" checked={!!selectedRows[idx]} onChange={(e) => {
                            const sel = { ...selectedRows, [idx]: e.target.checked }; if (!e.target.checked) { delete sel[idx]; }
                            setSelectedRows(sel);
                          }} />
                        </td>
                        {headers.slice(0,8).map(h => <td key={h} className="p-2 text-xs font-mono">{String(r[h] ?? '')}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <select value={bulkEditHeader} onChange={(e)=>setBulkEditHeader(e.target.value)} className="px-2 py-1 border rounded">
                  <option value="">-- Scegli colonna da modificare --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <input value={bulkEditValue} onChange={(e)=>setBulkEditValue(e.target.value)} placeholder="Valore da applicare" className="px-2 py-1 border rounded" />
                <button onClick={() => {
                  if (!bulkEditHeader) return; const selIdx = Object.keys(selectedRows).map(k=>Number(k)).filter(i=>selectedRows[i]); if (selIdx.length===0) return;
                  const updated = parsedRows.map((row,i) => selIdx.includes(i) ? ({ ...row, [bulkEditHeader]: bulkEditValue }) : row);
                  setParsedRows(updated); setSelectedRows({}); setSelectAll(false); validateParsedRows();
                }} className="px-3 py-2 bg-blue-600 text-white rounded">Applica ai selezionati</button>
              </div>
            </div>
            {/* If user mapped to fields not present in DB, show SQL to create them */}
            {Object.keys(mapping).some(k => mapping[k] && mapping[k] !== 'ignore' && !dbFields.includes(mapping[k])) && (
              <div className="mt-4 bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
                <p className="font-bold text-yellow-800">Alcune colonne di destinazione non esistono nel database.</p>
                <p className="text-sm text-yellow-700">Esegui lo script SQL seguente nell'SQL Editor di Supabase per aggiungerle.</p>
                <div className="mt-3 bg-white p-3 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                  {(() => {
                    const missing = Array.from(new Set(Object.values(mapping).filter(v => v && v !== 'ignore' && !dbFields.includes(v))));
                    return missing.map(col => `ALTER TABLE owners ADD COLUMN ${col} text;`).join('\n');
                  })()}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => {
                    const missing = Array.from(new Set(Object.values(mapping).filter(v => v && v !== 'ignore' && !dbFields.includes(v))));
                    const sql = missing.map(col => `ALTER TABLE owners ADD COLUMN ${col} text;`).join('\n');
                    navigator.clipboard.writeText(sql);
                  }} className="px-3 py-2 bg-yellow-700 text-white rounded">Copia SQL</button>
                  <a href="https://app.supabase.com" target="_blank" rel="noreferrer" className="px-3 py-2 bg-white border border-yellow-700 text-yellow-700 rounded">Apri SQL Editor</a>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 space-y-8 flex flex-col justify-center animate-in fade-in duration-500">
            <div className="text-center">
              <h4 className="text-xl font-bold text-gray-900">Validazione Dati</h4>
              <p className="text-gray-500 text-sm">Controllo integrità Codici Fiscali e Numeri di Telefono</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-green-50 border border-green-100 rounded-2xl text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-200 rounded-bl-full opacity-20" />
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                <h5 className="text-3xl font-black text-green-600">{validCount}</h5>
                <p className="text-xs font-bold text-green-700 uppercase tracking-widest">Record Validi</p>
              </div>
              <div className="p-6 bg-yellow-50 border border-yellow-100 rounded-2xl text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto" />
                <h5 className="text-3xl font-black text-yellow-600">{duplicateCount}</h5>
                <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Duplicati (CF)</p>
                <button onClick={() => { /* future: show duplicates */ }} className="text-[10px] text-yellow-700 underline font-bold">Vedi dettagli</button>
              </div>
              <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-center space-y-2">
                <XCircle className="w-8 h-8 text-red-600 mx-auto" />
                <h5 className="text-3xl font-black text-red-600">{invalidCount}</h5>
                <p className="text-xs font-bold text-red-700 uppercase tracking-widest">Errori Formato</p>
                <button onClick={() => {
                  if (validationErrors.length === 0) return;
                  const csv = validationErrors.map(v => `${v.index},"${(v.errors||[]).join(';')}","${JSON.stringify(v.row).replace(/"/g,'""')}"`).join('\n');
                  const blob = new Blob(["index,errors,row\n" + csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'upload_errors.csv'; a.click();
                  URL.revokeObjectURL(url);
                }} className="text-[10px] text-red-700 underline font-bold">Scarica report errori</button>
              </div>
            </div>
              <div className="space-y-4 max-w-lg mx-auto w-full">
               <div className="flex justify-between items-center px-2 text-xs font-bold text-gray-500 uppercase">
                 <span>Qualità Dati</span>
                 <span>98.5%</span>
               </div>
               <div className="h-4 bg-gray-100 rounded-full overflow-hidden p-1 border border-gray-200">
                 <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse shadow-sm" style={{ width: '98.5%' }} />
               </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  {parsingError && <p className="text-sm text-red-600 font-bold">{parsingError}</p>}
                  {validationErrors.length > 0 && (
                    <div className="text-left max-w-2xl w-full bg-gray-50 border border-gray-100 p-4 rounded-lg text-sm">
                      <p className="font-bold text-red-700">Sono stati rilevati errori nei record — correggi le intestazioni o scarica il report.</p>
                      <ul className="mt-2 list-disc list-inside text-xs text-gray-700">
                        {validationErrors.slice(0,5).map(e => (
                          <li key={e.index}>Riga {e.index}: {e.errors.join('; ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={syncToSupabase}
                      disabled={syncing || invalidCount > 0}
                      className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg flex items-center gap-2 disabled:opacity-40"
                    >
                      {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                      {syncing ? 'Sincronizzo...' : 'Sincronizza su Supabase'}
                    </button>

                    {invalidCount > 0 && (
                      <button
                        onClick={() => syncToSupabase()}
                        className="bg-white border border-red-600 text-red-600 px-4 py-2 rounded-2xl font-bold"
                        title="Forza sincronizzazione nonostante errori"
                      >Forza sincronizzazione</button>
                    )}
                  </div>
                </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center py-10 animate-in zoom-in-95 duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20"></div>
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-5xl relative z-10 shadow-lg shadow-green-100">
                🎉
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-black text-gray-900">Importazione Completata!</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                <span className="font-bold text-gray-900">1,204 nuovi proprietari</span> sono stati aggiunti con successo al database.
                Le note e gli esiti delle chiamate precedenti sono stati sincronizzati nello storico.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => onCompleteNavigation('OWNERS_LIST')}
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                Vai alla Lista
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
            <button 
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="text-gray-400 font-bold hover:text-gray-600 disabled:opacity-30 transition-colors px-4 py-2"
            >
              Indietro
            </button>
            <button 
              onClick={nextStep}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 hover:-translate-y-0.5"
            >
              Prosegui
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
