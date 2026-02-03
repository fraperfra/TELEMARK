
import { Owner, Appointment } from './types';

export const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  cold: '#3B82F6',
  warm: '#F59E0B',
  hot: '#EF4444',
};

export const MOCK_OWNERS: Owner[] = [
  {
    id: '1',
    firstName: 'Marco',
    lastName: 'Rossi',
    taxCode: 'RSSMRC80A01H501U',
    birthDate: '1980-01-01',
    age: 44,
    phones: ['+39 340 1234567', '+39 02 9876543'],
    email: 'marco.rossi@example.com',
    temperature: 'HOT',
    score: 85,
    propertiesCount: 2,
    lastContact: '2 ore fa',
    suggestedAction: 'Fissare visita sopralluogo',
    tags: ['decisore', 'urgente', 'alto_valore'],
    properties: [
      { id: 'p1', address: 'Via Roma 12, Milano', category: 'Appartamento', estimatedValue: 350000, share: 100 },
      { id: 'p2', address: 'Viale Monza 45, Milano', category: 'Box', estimatedValue: 35000, share: 100 },
    ],
    calls: [
      { id: 'c1', date: '2023-10-25 14:30', outcome: 'INTERESTED', notes: 'Molto interessato a vendere entro l\'anno.', duration: '05:42' },
      { id: 'c2', date: '2023-10-20 10:15', outcome: 'CALL_BACK', notes: 'Chiedere disponibilità per giovedì.', duration: '02:10' },
    ],
    appointments: [
      { id: 'a1', date: '2023-11-02 15:00', type: 'VISIT', title: 'Sopralluogo Via Roma' },
    ],
  },
  {
    id: '2',
    firstName: 'Laura',
    lastName: 'Bianchi',
    taxCode: 'BNCLRA85B02L219Z',
    birthDate: '1985-02-02',
    age: 39,
    phones: ['+39 335 9876543'],
    email: 'laura.bianchi@example.com',
    temperature: 'WARM',
    score: 62,
    propertiesCount: 1,
    lastContact: '1 giorno fa',
    suggestedAction: 'Inviare stima aggiornata',
    tags: ['riflessivo'],
    properties: [
      { id: 'p3', address: 'Via Dante 5, Torino', category: 'Attico', estimatedValue: 580000, share: 50 },
    ],
    calls: [
       { id: 'c3', date: '2023-10-24 16:00', outcome: 'CALL_BACK', notes: 'Vuole parlare col marito.', duration: '08:15' },
    ],
    appointments: [],
  },
  {
    id: '3',
    firstName: 'Giuseppe',
    lastName: 'Verdi',
    taxCode: 'VRDGPP70C03F205K',
    birthDate: '1970-03-03',
    age: 54,
    phones: ['+39 328 1122334'],
    email: 'g.verdi@provider.it',
    temperature: 'COLD',
    score: 25,
    propertiesCount: 3,
    lastContact: '1 mese fa',
    suggestedAction: 'Richiamata di cortesia',
    tags: ['investitore'],
    properties: [],
    calls: [],
    appointments: [],
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '1', date: '2023-10-27 10:00', type: 'VISIT', title: 'Visita Rossi - Via Roma', location: 'Milano' },
  { id: '2', date: '2023-10-27 14:30', type: 'CALL', title: 'Call Follow-up Bianchi' },
  { id: '3', date: '2023-10-28 09:00', type: 'VIDEO', title: 'Video-consulenza Esposito' },
  { id: '4', date: '2023-10-30 11:30', type: 'SIGNING', title: 'Firma Incarico Neri' },
];
