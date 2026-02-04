
export type LeadTemperature = 'HOT' | 'WARM' | 'COLD';

export interface Property {
  id: string;
  address: string;
  category: string;
  consistenza?: string;
  estimatedValue: number;
  share: number;
}

export interface CallLog {
  id: string;
  date: string;
  outcome: 'INTERESTED' | 'CALL_BACK' | 'NOT_INTERESTED' | 'NO_ANSWER' | 'APPOINTMENT';
  notes: string;
  duration: string;
}

export interface Appointment {
  id: string;
  date: string;
  type: 'VISIT' | 'CALL' | 'VIDEO' | 'SIGNING';
  title: string;
  location?: string;
  whatsappScript?: string;
  voiceScript?: string;
}

export interface Owner {
  id: string;
  organization_id?: string;
  firstName: string;
  lastName: string;
  taxCode?: string;
  birthDate?: string;
  age?: number;
  phones?: string[];
  phone?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  email?: string;
  temperature: LeadTemperature;
  score: number;
  propertiesCount?: number;
  lastContact?: string;
  suggestedAction?: string;
  tags?: string[];
  properties?: Property[];
  calls?: CallLog[];
  appointments?: Appointment[];
  // Campi importazione CSV
  address?: string;
  civico?: string;
  consistenza?: string;
  categoria?: string;
  quota?: string;
  esitoChiamata?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type ViewState = 'DASHBOARD' | 'OWNERS_LIST' | 'OWNER_DETAIL' | 'CALENDAR' | 'UPLOAD' | 'SETTINGS' | 'DAILY_TASKS';
export type SettingsTab = 'profile' | 'agency' | 'team' | 'notifications' | 'security';

export type ModalType = 'ADD_OWNER' | 'CALL_OWNER' | 'ADD_APPOINTMENT' | 'EDIT_OWNER' | 'BULK_CALL' | 'ADD_PROPERTY' | null;

export interface ModalState {
  type: ModalType;
  owner?: Owner;
}
