
export type LeadTemperature = 'HOT' | 'WARM' | 'COLD';

export interface Property {
  id: string;
  address: string;
  category: string;
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
}

export interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  taxCode: string;
  birthDate: string;
  age: number;
  phones: string[];
  email: string;
  temperature: LeadTemperature;
  score: number;
  propertiesCount: number;
  lastContact: string;
  suggestedAction: string;
  tags: string[];
  properties: Property[];
  calls: CallLog[];
  appointments: Appointment[];
}

export type ViewState = 'DASHBOARD' | 'OWNERS_LIST' | 'OWNER_DETAIL' | 'CALENDAR' | 'UPLOAD' | 'SETTINGS';

export type ModalType = 'ADD_OWNER' | 'CALL_OWNER' | 'ADD_APPOINTMENT' | 'EDIT_OWNER' | 'BULK_CALL' | null;

export interface ModalState {
  type: ModalType;
  owner?: Owner;
}
