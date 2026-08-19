export type BuildingBlock = 'A' | 'B' | 'E';

export type MaintenanceChoice = 'sim' | 'nao' | null;

export interface InspectionItemState {
  id: string; // e.g., 'alvenaria-pintura'
  category: string;
  name: string;
  status: MaintenanceChoice;
  observation: string;
}

export interface ApartmentInspection {
  apartmentId: string; // e.g., 'A001'
  block: BuildingBlock;
  number: string; // e.g., '001', '101'
  floor: 'Térreo' | '1º Andar' | '2º Andar';
  isGenerated: boolean;
  isSaved?: boolean;
  isLocked?: boolean;
  updatedAt?: string;
  inspectorName?: string;
  keyCount?: '1 chave' | '2 chave' | '3 chave' | '4 chave' | '5 chave';
  occupancyStatus?: 'ocupado' | 'desocupado';
  items: Record<string, InspectionItemState>;
  status?: 'rascunho' | 'finalizada';
  finalizedAt?: string;
}

export interface FinalizedInspection {
  id: string; // unique record ID e.g. "A001_1723550000000"
  apartmentId: string;
  block: BuildingBlock;
  number: string;
  floor: 'Térreo' | '1º Andar' | '2º Andar';
  inspectorName?: string;
  occupancyStatus?: 'ocupado' | 'desocupado';
  keyCount?: '1 chave' | '2 chave' | '3 chave' | '4 chave' | '5 chave';
  finalizedAt: string; // ISO String timestamp
  inspectionDate: string; // YYYY-MM-DD
  inspectionTime: string; // HH:mm
  items: Record<string, InspectionItemState>;
  simCount: number;
  naoCount: number;
  pendingCount: number;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  iconName: string;
  items: string[];
}
