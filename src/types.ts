export type Tool = 'select' | 'paint' | 'erase' | 'fill' | 'eyedropper';
export type ViewMode = 'province' | 'political' | 'terrain' | 'state';
export type ProvinceType = 'land' | 'sea' | 'lake' | 'wasteland';
export type StateCategory =
  | 'megalopolis'
  | 'metropolis'
  | 'large_city'
  | 'city'
  | 'large_town'
  | 'town'
  | 'rural'
  | 'pastoral'
  | 'wasteland';

export interface Province {
  id: number;
  name: string;
  color: string;
  type: ProvinceType;
  terrain: string;
  continent: number;
  coastal: boolean;
  manpower: number;
  development: number;
  taxBase: number;
  victoryPoints: number;
  stateId: number | null;
  infrastructure: number;
  supplyHub: boolean;
  airBase: number;
  navalBase: number;
  resources: Record<string, number>;
}

export interface GameState {
  id: number;
  name: string;
  category: StateCategory;
  manpower: number;
  owner: string;
  cores: string[];
  claims: string[];
  provinces: number[];
  resources: Record<string, number>;
  victoryPoints: number;
  buildings: Record<string, number>;
}

export interface Country {
  tag: string;
  name: string;
  adjective: string;
  color: string;
  capital: number;
  government: string;
  ideology: string;
  culture: string;
  religion: string;
}

export interface TerrainType {
  id: string;
  name: string;
  color: string;
  movementCost: number;
  attrition: number;
  defensiveBonus: number;
  supplyLimit: number;
}

export interface ResourceType {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Adjacency {
  id: number;
  from: number;
  to: number;
  type: 'land' | 'sea' | 'river_crossing' | 'strait' | 'canal' | 'impassable';
  through: number;
  comment: string;
}
