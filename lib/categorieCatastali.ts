// Categorie Catastali Italiane - Elenco Ufficiale
// Utilizzato per interpretare i codici categoria degli immobili

export interface CategoriaCatastale {
  codice: string;
  descrizione: string;
  gruppo: string;
  gruppoDescrizione: string;
  icona: string;
  colore: string;
}

export const GRUPPI_CATASTALI: Record<string, { nome: string; descrizione: string; icona: string; colore: string }> = {
  'A': {
    nome: 'Gruppo A',
    descrizione: 'Abitazioni e uffici (immobili a destinazione ordinaria)',
    icona: '🏠',
    colore: 'blue'
  },
  'B': {
    nome: 'Gruppo B',
    descrizione: 'Immobili per uso collettivo (non abitativi, ma non produttivi)',
    icona: '🏛️',
    colore: 'purple'
  },
  'C': {
    nome: 'Gruppo C',
    descrizione: 'Magazzini, negozi e pertinenze (destinazione commerciale o accessoria)',
    icona: '🏪',
    colore: 'green'
  },
  'D': {
    nome: 'Gruppo D',
    descrizione: 'Immobili produttivi (destinazione speciale, spesso industriale)',
    icona: '🏭',
    colore: 'orange'
  },
  'E': {
    nome: 'Gruppo E',
    descrizione: 'Immobili a destinazione particolare (non producono rendita ordinaria)',
    icona: '🏗️',
    colore: 'red'
  },
  'F': {
    nome: 'Gruppo F',
    descrizione: 'Unità senza rendita (categorie tecniche)',
    icona: '📋',
    colore: 'gray'
  },
};

export const CATEGORIE_CATASTALI: CategoriaCatastale[] = [
  // GRUPPO A – Abitazioni e uffici
  { codice: 'A/1', descrizione: 'Abitazioni di tipo signorile', gruppo: 'A', gruppoDescrizione: 'Abitazioni e uffici', icona: '🏰', colore: 'blue' },
  { codice: 'A/2', descrizione: 'Abitazioni di tipo civile', gruppo: 'A', gruppoDescrizione: 'Abitazioni e uffici', icona: '🏠', colore: 'blue' },
  { codice: 'A/3', descrizione: 'Abitazioni di tipo economico', gruppo: 'A', gruppoDescrizione: 'Abitazioni e uffici', icona: '🏡', colore: 'blue' },
  { codice: 'A/4', descrizione: 'Abitazioni di tipo popolare', gruppo: 'A', gruppoDescrizione: 'Abitazioni e uffici', icona: '🏘️', colore: 'blue' },
  { codice: 'A/5', descrizione: 'Abitazioni di tipo ultrapopolare', gruppo: 'A', gruppoDescrizione: 'Abitazioni e uffici', icona: '🏚️', colore: 'blue' },
  { codice: 'A/6', descrizione: 'Abitazioni di tipo rurale', gruppo: 'A', gruppoDescrizione: 'Abitazioni e uffici', icona: '🏕️', colore: 'blue' },
  { codice: 'A/7', descrizione: 'Abitazioni in villini', gruppo: 'A', gruppoDescrizione: 'Abitazioni e uffici', icona: '🏡', colore: 'blue' },
  { codice: 'A/8', descrizione: 'Abitazioni in ville', gruppo: 'A', gruppoDescrizione: 'Abitazioni e uffici', icona: '🏛️', colore: 'blue' },
  { codice: 'A/9', descrizione: 'Castelli, palazzi di pregio storico o artistico', gruppo: 'A', gruppoDescrizione: 'Abitazioni e uffici', icona: '🏰', colore: 'blue' },
  { codice: 'A/10', descrizione: 'Uffici e studi privati', gruppo: 'A', gruppoDescrizione: 'Abitazioni e uffici', icona: '🏢', colore: 'blue' },
  { codice: 'A/11', descrizione: 'Abitazioni ed alloggi tipici dei luoghi', gruppo: 'A', gruppoDescrizione: 'Abitazioni e uffici', icona: '🛖', colore: 'blue' },

  // GRUPPO B – Immobili per uso collettivo
  { codice: 'B/1', descrizione: 'Collegi, convitti, educandati, orfanotrofi', gruppo: 'B', gruppoDescrizione: 'Uso collettivo', icona: '🏫', colore: 'purple' },
  { codice: 'B/2', descrizione: 'Case di cura e ospedali (senza fini di lucro)', gruppo: 'B', gruppoDescrizione: 'Uso collettivo', icona: '🏥', colore: 'purple' },
  { codice: 'B/3', descrizione: 'Prigioni e riformatori', gruppo: 'B', gruppoDescrizione: 'Uso collettivo', icona: '🔒', colore: 'purple' },
  { codice: 'B/4', descrizione: 'Uffici pubblici', gruppo: 'B', gruppoDescrizione: 'Uso collettivo', icona: '🏛️', colore: 'purple' },
  { codice: 'B/5', descrizione: 'Scuole, laboratori scientifici', gruppo: 'B', gruppoDescrizione: 'Uso collettivo', icona: '🎓', colore: 'purple' },
  { codice: 'B/6', descrizione: 'Biblioteche, musei, gallerie, accademie', gruppo: 'B', gruppoDescrizione: 'Uso collettivo', icona: '📚', colore: 'purple' },
  { codice: 'B/7', descrizione: 'Cappelle e oratori (non destinati al culto pubblico)', gruppo: 'B', gruppoDescrizione: 'Uso collettivo', icona: '⛪', colore: 'purple' },
  { codice: 'B/8', descrizione: 'Magazzini sotterranei per derrate', gruppo: 'B', gruppoDescrizione: 'Uso collettivo', icona: '🏪', colore: 'purple' },

  // GRUPPO C – Magazzini, negozi e pertinenze
  { codice: 'C/1', descrizione: 'Negozi e botteghe', gruppo: 'C', gruppoDescrizione: 'Commerciale', icona: '🏪', colore: 'green' },
  { codice: 'C/2', descrizione: 'Magazzini e locali di deposito (cantine, soffitte)', gruppo: 'C', gruppoDescrizione: 'Commerciale', icona: '📦', colore: 'green' },
  { codice: 'C/3', descrizione: 'Laboratori per arti e mestieri', gruppo: 'C', gruppoDescrizione: 'Commerciale', icona: '🔧', colore: 'green' },
  { codice: 'C/4', descrizione: 'Fabbricati e locali per esercizi sportivi (senza fine di lucro)', gruppo: 'C', gruppoDescrizione: 'Commerciale', icona: '🏋️', colore: 'green' },
  { codice: 'C/5', descrizione: 'Stabilimenti balneari e di acque curative', gruppo: 'C', gruppoDescrizione: 'Commerciale', icona: '🏖️', colore: 'green' },
  { codice: 'C/6', descrizione: 'Autorimesse, garage, posti auto, stalle', gruppo: 'C', gruppoDescrizione: 'Commerciale', icona: '🚗', colore: 'green' },
  { codice: 'C/7', descrizione: 'Tettoie chiuse o aperte', gruppo: 'C', gruppoDescrizione: 'Commerciale', icona: '🏗️', colore: 'green' },

  // GRUPPO D – Immobili produttivi
  { codice: 'D/1', descrizione: 'Opifici', gruppo: 'D', gruppoDescrizione: 'Produttivo', icona: '🏭', colore: 'orange' },
  { codice: 'D/2', descrizione: 'Alberghi e pensioni', gruppo: 'D', gruppoDescrizione: 'Produttivo', icona: '🏨', colore: 'orange' },
  { codice: 'D/3', descrizione: 'Teatri, cinema, sale per spettacoli', gruppo: 'D', gruppoDescrizione: 'Produttivo', icona: '🎭', colore: 'orange' },
  { codice: 'D/4', descrizione: 'Case di cura e ospedali (con fine di lucro)', gruppo: 'D', gruppoDescrizione: 'Produttivo', icona: '🏥', colore: 'orange' },
  { codice: 'D/5', descrizione: 'Istituti di credito, cambio e assicurazione', gruppo: 'D', gruppoDescrizione: 'Produttivo', icona: '🏦', colore: 'orange' },
  { codice: 'D/6', descrizione: 'Fabbricati sportivi con fine di lucro', gruppo: 'D', gruppoDescrizione: 'Produttivo', icona: '🏟️', colore: 'orange' },
  { codice: 'D/7', descrizione: 'Fabbricati per attività industriali', gruppo: 'D', gruppoDescrizione: 'Produttivo', icona: '🏭', colore: 'orange' },
  { codice: 'D/8', descrizione: 'Fabbricati per attività commerciali', gruppo: 'D', gruppoDescrizione: 'Produttivo', icona: '🏬', colore: 'orange' },
  { codice: 'D/9', descrizione: 'Edifici galleggianti o sospesi', gruppo: 'D', gruppoDescrizione: 'Produttivo', icona: '🚢', colore: 'orange' },
  { codice: 'D/10', descrizione: 'Fabbricati per funzioni agricole', gruppo: 'D', gruppoDescrizione: 'Produttivo', icona: '🚜', colore: 'orange' },

  // GRUPPO E – Immobili a destinazione particolare
  { codice: 'E/1', descrizione: 'Stazioni per trasporti terrestri', gruppo: 'E', gruppoDescrizione: 'Particolare', icona: '🚉', colore: 'red' },
  { codice: 'E/2', descrizione: 'Ponti comunali e provinciali', gruppo: 'E', gruppoDescrizione: 'Particolare', icona: '🌉', colore: 'red' },
  { codice: 'E/3', descrizione: 'Costruzioni per esigenze pubbliche', gruppo: 'E', gruppoDescrizione: 'Particolare', icona: '🏗️', colore: 'red' },
  { codice: 'E/4', descrizione: 'Recinti chiusi per uso pubblico', gruppo: 'E', gruppoDescrizione: 'Particolare', icona: '🚧', colore: 'red' },
  { codice: 'E/5', descrizione: 'Fabbricati costituenti fortificazioni', gruppo: 'E', gruppoDescrizione: 'Particolare', icona: '🏰', colore: 'red' },
  { codice: 'E/6', descrizione: 'Fari, semafori, torri per uso pubblico', gruppo: 'E', gruppoDescrizione: 'Particolare', icona: '🗼', colore: 'red' },
  { codice: 'E/7', descrizione: 'Fabbricati destinati all\'esercizio di culti', gruppo: 'E', gruppoDescrizione: 'Particolare', icona: '⛪', colore: 'red' },
  { codice: 'E/8', descrizione: 'Fabbricati cimiteriali', gruppo: 'E', gruppoDescrizione: 'Particolare', icona: '🪦', colore: 'red' },
  { codice: 'E/9', descrizione: 'Edifici a destinazione particolare non classificabili altrove', gruppo: 'E', gruppoDescrizione: 'Particolare', icona: '🏢', colore: 'red' },

  // GRUPPO F – Unità senza rendita
  { codice: 'F/1', descrizione: 'Area urbana', gruppo: 'F', gruppoDescrizione: 'Senza rendita', icona: '🗺️', colore: 'gray' },
  { codice: 'F/2', descrizione: 'Unità collabenti', gruppo: 'F', gruppoDescrizione: 'Senza rendita', icona: '🏚️', colore: 'gray' },
  { codice: 'F/3', descrizione: 'Unità in corso di costruzione', gruppo: 'F', gruppoDescrizione: 'Senza rendita', icona: '🏗️', colore: 'gray' },
  { codice: 'F/4', descrizione: 'Unità in corso di definizione', gruppo: 'F', gruppoDescrizione: 'Senza rendita', icona: '📝', colore: 'gray' },
  { codice: 'F/5', descrizione: 'Lastrico solare', gruppo: 'F', gruppoDescrizione: 'Senza rendita', icona: '☀️', colore: 'gray' },
  { codice: 'F/6', descrizione: 'Fabbricato in attesa di dichiarazione', gruppo: 'F', gruppoDescrizione: 'Senza rendita', icona: '⏳', colore: 'gray' },
];

// Mappa veloce per lookup per codice
export const CATEGORIE_MAP: Record<string, CategoriaCatastale> = CATEGORIE_CATASTALI.reduce((acc, cat) => {
  acc[cat.codice] = cat;
  // Aggiungi anche versioni senza slash per compatibilità (es. "A3" -> "A/3")
  acc[cat.codice.replace('/', '')] = cat;
  return acc;
}, {} as Record<string, CategoriaCatastale>);

/**
 * Ottiene la categoria catastale dato un codice
 * Supporta formati: "A/3", "A3", "a/3", "a3"
 */
export function getCategoria(codice: string | null | undefined): CategoriaCatastale | null {
  if (!codice) return null;

  // Normalizza il codice: uppercase e rimuovi spazi
  let normalized = codice.toUpperCase().trim();

  // Prova lookup diretto
  if (CATEGORIE_MAP[normalized]) {
    return CATEGORIE_MAP[normalized];
  }

  // Prova aggiungendo lo slash se mancante (es. "A3" -> "A/3")
  if (!normalized.includes('/') && normalized.length >= 2) {
    const withSlash = normalized[0] + '/' + normalized.substring(1);
    if (CATEGORIE_MAP[withSlash]) {
      return CATEGORIE_MAP[withSlash];
    }
  }

  return null;
}

/**
 * Ottiene la descrizione completa di una categoria
 */
export function getCategoriaDescrizione(codice: string | null | undefined): string {
  const cat = getCategoria(codice);
  return cat ? `${cat.codice} - ${cat.descrizione}` : codice || 'Non specificata';
}

/**
 * Ottiene l'icona emoji di una categoria
 */
export function getCategoriaIcona(codice: string | null | undefined): string {
  const cat = getCategoria(codice);
  return cat?.icona || '🏠';
}

/**
 * Ottiene il colore associato alla categoria
 */
export function getCategoriaColore(codice: string | null | undefined): string {
  const cat = getCategoria(codice);
  return cat?.colore || 'gray';
}

/**
 * Verifica se una categoria è residenziale (Gruppo A, escluso A/10)
 */
export function isResidenziale(codice: string | null | undefined): boolean {
  const cat = getCategoria(codice);
  return cat ? cat.gruppo === 'A' && cat.codice !== 'A/10' : false;
}

/**
 * Verifica se una categoria è commerciale/produttiva
 */
export function isCommerciale(codice: string | null | undefined): boolean {
  const cat = getCategoria(codice);
  return cat ? ['C', 'D'].includes(cat.gruppo) || cat.codice === 'A/10' : false;
}

/**
 * Ottiene il gruppo di una categoria
 */
export function getGruppo(codice: string | null | undefined): string | null {
  const cat = getCategoria(codice);
  return cat?.gruppo || null;
}
