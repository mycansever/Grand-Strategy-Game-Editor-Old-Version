import { Province, GameState, Country, TerrainType, ResourceType, Adjacency } from './types';

// ============ DEFAULT DATA ============

export const DEFAULT_TERRAINS: TerrainType[] = [
  { id: 'plains', name: 'Plains', color: '#a8d08d', movementCost: 1.0, attrition: 0, defensiveBonus: 0, supplyLimit: 8 },
  { id: 'forest', name: 'Forest', color: '#2d6a2e', movementCost: 1.5, attrition: 0, defensiveBonus: 0.2, supplyLimit: 6 },
  { id: 'hills', name: 'Hills', color: '#c4a265', movementCost: 1.5, attrition: 0, defensiveBonus: 0.3, supplyLimit: 6 },
  { id: 'mountain', name: 'Mountain', color: '#8c8c8c', movementCost: 3.0, attrition: 0.1, defensiveBonus: 0.5, supplyLimit: 3 },
  { id: 'desert', name: 'Desert', color: '#e8d5a3', movementCost: 1.2, attrition: 0.1, defensiveBonus: 0, supplyLimit: 4 },
  { id: 'marsh', name: 'Marsh', color: '#7a9a5a', movementCost: 2.0, attrition: 0.1, defensiveBonus: 0.4, supplyLimit: 4 },
  { id: 'jungle', name: 'Jungle', color: '#1a5c1a', movementCost: 2.5, attrition: 0.2, defensiveBonus: 0.3, supplyLimit: 3 },
  { id: 'arctic', name: 'Arctic', color: '#e8f0f0', movementCost: 2.0, attrition: 0.2, defensiveBonus: 0.1, supplyLimit: 2 },
  { id: 'urban', name: 'Urban', color: '#a0a0a0', movementCost: 0.8, attrition: 0, defensiveBonus: 0.2, supplyLimit: 10 },
  { id: 'ocean', name: 'Ocean', color: '#1a5276', movementCost: 1.0, attrition: 0, defensiveBonus: 0, supplyLimit: 0 },
  { id: 'coastal', name: 'Coastal Water', color: '#2e86c1', movementCost: 1.0, attrition: 0, defensiveBonus: 0, supplyLimit: 0 },
];

export const DEFAULT_RESOURCES: ResourceType[] = [
  { id: 'steel', name: 'Steel', color: '#718093', icon: '⚙️' },
  { id: 'oil', name: 'Oil', color: '#2d3436', icon: '🛢️' },
  { id: 'aluminum', name: 'Aluminum', color: '#b2bec3', icon: '🔩' },
  { id: 'rubber', name: 'Rubber', color: '#6c5ce7', icon: '⚫' },
  { id: 'tungsten', name: 'Tungsten', color: '#fdcb6e', icon: '💎' },
  { id: 'chromium', name: 'Chromium', color: '#00cec9', icon: '🔷' },
  { id: 'coal', name: 'Coal', color: '#2d3436', icon: '♦️' },
  { id: 'iron', name: 'Iron', color: '#d63031', icon: '🔶' },
  { id: 'gold', name: 'Gold', color: '#f9ca24', icon: '🥇' },
];

// ============ COLOR HELPERS ============

export function randomColor(): string {
  const r = Math.floor(Math.random() * 200 + 30);
  const g = Math.floor(Math.random() * 200 + 30);
  const b = Math.floor(Math.random() * 200 + 30);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function lightenColor(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    Math.min(255, Math.round(r + (255 - r) * factor)),
    Math.min(255, Math.round(g + (255 - g) * factor)),
    Math.min(255, Math.round(b + (255 - b) * factor))
  );
}

export function darkenColor(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    Math.round(r * (1 - factor)),
    Math.round(g * (1 - factor)),
    Math.round(b * (1 - factor))
  );
}

// ============ CSV EXPORT ============

export function exportProvincesCSV(provinces: Province[]): string {
  const header = 'id;r;g;b;name;type;terrain;continent;coastal;manpower;development;tax_base;victory_points;infrastructure;supply_hub;air_base;naval_base';
  const rows = provinces.map(p => {
    const { r, g, b } = hexToRgb(p.color);
    return `${p.id};${r};${g};${b};${p.name};${p.type};${p.terrain};${p.continent};${p.coastal};${p.manpower};${p.development};${p.taxBase};${p.victoryPoints};${p.infrastructure};${p.supplyHub};${p.airBase};${p.navalBase}`;
  });
  return [header, ...rows].join('\n');
}

export function exportStatesCSV(states: GameState[]): string {
  const header = 'id;name;category;manpower;owner;cores;claims;provinces;victory_points';
  const rows = states.map(s => {
    return `${s.id};${s.name};${s.category};${s.manpower};${s.owner};${s.cores.join('|')};${s.claims.join('|')};${s.provinces.join('|')};${s.victoryPoints}`;
  });
  return [header, ...rows].join('\n');
}

export function exportCountriesCSV(countries: Country[]): string {
  const header = 'tag;name;adjective;r;g;b;capital;government;ideology;culture;religion';
  const rows = countries.map(c => {
    const { r, g, b } = hexToRgb(c.color);
    return `${c.tag};${c.name};${c.adjective};${r};${g};${b};${c.capital};${c.government};${c.ideology};${c.culture};${c.religion}`;
  });
  return [header, ...rows].join('\n');
}

export function exportAdjacenciesCSV(adjs: Adjacency[]): string {
  const header = 'from;to;type;through;comment';
  const rows = adjs.map(a => `${a.from};${a.to};${a.type};${a.through};${a.comment}`);
  return [header, ...rows].join('\n');
}

export function exportResourcesCSV(provinces: Province[], resourceTypes: ResourceType[]): string {
  const header = `province_id;province_name;${resourceTypes.map(r => r.id).join(';')}`;
  const rows = provinces
    .filter(p => Object.keys(p.resources).length > 0)
    .map(p => {
      const vals = resourceTypes.map(r => p.resources[r.id] || 0);
      return `${p.id};${p.name};${vals.join(';')}`;
    });
  return [header, ...rows].join('\n');
}

export function exportMapDataCSV(mapData: Record<string, number>): string {
  const header = 'x;y;province_id';
  const rows = Object.entries(mapData).map(([key, pid]) => {
    const [x, y] = key.split(',');
    return `${x};${y};${pid}`;
  });
  return [header, ...rows].join('\n');
}

export function exportTerrainCSV(terrains: TerrainType[]): string {
  const header = 'id;name;color;movement_cost;attrition;defensive_bonus;supply_limit';
  const rows = terrains.map(t => {
    const { r, g, b } = hexToRgb(t.color);
    return `${t.id};${t.name};${r},${g},${b};${t.movementCost};${t.attrition};${t.defensiveBonus};${t.supplyLimit}`;
  });
  return [header, ...rows].join('\n');
}

// ============ CSV IMPORT ============

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(';').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(';').map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
}

export function importProvincesCSV(text: string): Province[] {
  const rows = parseCSV(text);
  return rows.map(r => ({
    id: parseInt(r.id) || 0,
    name: r.name || `Province_${r.id}`,
    color: rgbToHex(parseInt(r.r) || 0, parseInt(r.g) || 0, parseInt(r.b) || 0),
    type: (r.type as Province['type']) || 'land',
    terrain: r.terrain || 'plains',
    continent: parseInt(r.continent) || 1,
    coastal: r.coastal === 'true',
    manpower: parseInt(r.manpower) || 0,
    development: parseInt(r.development) || 0,
    taxBase: parseFloat(r.tax_base) || 0,
    victoryPoints: parseInt(r.victory_points) || 0,
    stateId: null,
    infrastructure: parseInt(r.infrastructure) || 0,
    supplyHub: r.supply_hub === 'true',
    airBase: parseInt(r.air_base) || 0,
    navalBase: parseInt(r.naval_base) || 0,
    resources: {},
  }));
}

export function importStatesCSV(text: string): GameState[] {
  const rows = parseCSV(text);
  return rows.map(r => ({
    id: parseInt(r.id) || 0,
    name: r.name || `State_${r.id}`,
    category: (r.category as GameState['category']) || 'rural',
    manpower: parseInt(r.manpower) || 0,
    owner: r.owner || '',
    cores: r.cores ? r.cores.split('|').filter(Boolean) : [],
    claims: r.claims ? r.claims.split('|').filter(Boolean) : [],
    provinces: r.provinces ? r.provinces.split('|').map(Number).filter(Boolean) : [],
    resources: {},
    victoryPoints: parseInt(r.victory_points) || 0,
    buildings: {},
  }));
}

export function importCountriesCSV(text: string): Country[] {
  const rows = parseCSV(text);
  return rows.map(r => ({
    tag: r.tag || 'UNK',
    name: r.name || 'Unknown',
    adjective: r.adjective || '',
    color: rgbToHex(parseInt(r.r) || 128, parseInt(r.g) || 128, parseInt(r.b) || 128),
    capital: parseInt(r.capital) || 0,
    government: r.government || 'democracy',
    ideology: r.ideology || 'neutral',
    culture: r.culture || '',
    religion: r.religion || '',
  }));
}

export function importMapDataCSV(text: string): Record<string, number> {
  const rows = parseCSV(text);
  const data: Record<string, number> = {};
  rows.forEach(r => {
    const x = parseInt(r.x);
    const y = parseInt(r.y);
    const pid = parseInt(r.province_id);
    if (!isNaN(x) && !isNaN(y) && !isNaN(pid)) {
      data[`${x},${y}`] = pid;
    }
  });
  return data;
}

// ============ DOWNLOAD HELPER ============

export function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAllAsZip(data: Record<string, string>) {
  // Simple: download each file separately since we don't have JSZip
  Object.entries(data).forEach(([name, content]) => {
    downloadFile(name, content);
  });
}
