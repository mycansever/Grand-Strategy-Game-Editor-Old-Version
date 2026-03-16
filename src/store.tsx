import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { Province, GameState, Country, TerrainType, ResourceType, Adjacency, Tool, ViewMode } from './types';
import { DEFAULT_TERRAINS, DEFAULT_RESOURCES, randomColor } from './utils';

interface EditorStore {
  // Map
  mapWidth: number;
  mapHeight: number;
  mapData: Record<string, number>;
  setMapData: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setMapSize: (w: number, h: number) => void;
  paintCells: (cells: [number, number][], provinceId: number) => void;
  eraseCells: (cells: [number, number][]) => void;
  floodFill: (x: number, y: number, provinceId: number) => void;

  // Data
  provinces: Province[];
  setProvinces: React.Dispatch<React.SetStateAction<Province[]>>;
  states: GameState[];
  setStates: React.Dispatch<React.SetStateAction<GameState[]>>;
  countries: Country[];
  setCountries: React.Dispatch<React.SetStateAction<Country[]>>;
  terrainTypes: TerrainType[];
  setTerrainTypes: React.Dispatch<React.SetStateAction<TerrainType[]>>;
  resourceTypes: ResourceType[];
  setResourceTypes: React.Dispatch<React.SetStateAction<ResourceType[]>>;
  adjacencies: Adjacency[];
  setAdjacencies: React.Dispatch<React.SetStateAction<Adjacency[]>>;

  // UI State
  selectedTool: Tool;
  setSelectedTool: (t: Tool) => void;
  selectedProvinceId: number | null;
  setSelectedProvinceId: (id: number | null) => void;
  paintProvinceId: number | null;
  setPaintProvinceId: (id: number | null) => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  zoom: number;
  setZoom: (z: number) => void;
  offset: { x: number; y: number };
  setOffset: (o: { x: number; y: number }) => void;
  showGrid: boolean;
  setShowGrid: (s: boolean) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;

  // CRUD
  addProvince: () => Province;
  updateProvince: (id: number, updates: Partial<Province>) => void;
  deleteProvince: (id: number) => void;
  addState: () => GameState;
  updateState: (id: number, updates: Partial<GameState>) => void;
  deleteState: (id: number) => void;
  addCountry: () => Country;
  updateCountry: (tag: string, updates: Partial<Country>) => void;
  deleteCountry: (tag: string) => void;
  addAdjacency: () => Adjacency;
  deleteAdjacency: (id: number) => void;
  updateAdjacency: (id: number, updates: Partial<Adjacency>) => void;

  // Helpers
  getProvinceById: (id: number) => Province | undefined;
  getStateById: (id: number) => GameState | undefined;
  getCountryByTag: (tag: string) => Country | undefined;
  getProvinceState: (provinceId: number) => GameState | undefined;
  getProvinceCountry: (provinceId: number) => Country | undefined;
  getCellCount: (provinceId: number) => number;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const EditorContext = createContext<EditorStore | null>(null);

export function useEditor(): EditorStore {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [mapWidth, setMapWidth] = useState(120);
  const [mapHeight, setMapHeight] = useState(80);
  const [mapData, setMapData] = useState<Record<string, number>>({});

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [states, setStates] = useState<GameState[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [terrainTypes, setTerrainTypes] = useState<TerrainType[]>(DEFAULT_TERRAINS);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>(DEFAULT_RESOURCES);
  const [adjacencies, setAdjacencies] = useState<Adjacency[]>([]);

  const [selectedTool, setSelectedTool] = useState<Tool>('paint');
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [paintProvinceId, setPaintProvinceId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('province');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [brushSize, setBrushSize] = useState(1);
  const [activeTab, setActiveTab] = useState('provinces');

  const nextIdRef = useRef(1);
  const nextStateIdRef = useRef(1);
  const nextAdjIdRef = useRef(1);

  // History
  const historyRef = useRef<Record<string, number>[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback((data: Record<string, number>) => {
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push({ ...data });
    if (newHistory.length > 50) newHistory.shift();
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setMapData({ ...historyRef.current[historyIndexRef.current] });
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      setMapData({ ...historyRef.current[historyIndexRef.current] });
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  }, []);

  const setMapSize = useCallback((w: number, h: number) => {
    setMapWidth(w);
    setMapHeight(h);
  }, []);

  const paintCells = useCallback((cells: [number, number][], provinceId: number) => {
    setMapData(prev => {
      const next = { ...prev };
      for (const [x, y] of cells) {
        if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
          next[`${x},${y}`] = provinceId;
        }
      }
      pushHistory(next);
      return next;
    });
  }, [mapWidth, mapHeight, pushHistory]);

  const eraseCells = useCallback((cells: [number, number][]) => {
    setMapData(prev => {
      const next = { ...prev };
      for (const [x, y] of cells) {
        delete next[`${x},${y}`];
      }
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const floodFill = useCallback((startX: number, startY: number, newProvinceId: number) => {
    setMapData(prev => {
      const targetId = prev[`${startX},${startY}`] ?? -1;
      if (targetId === newProvinceId) return prev;

      const next = { ...prev };
      const queue: [number, number][] = [[startX, startY]];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        const k = `${x},${y}`;
        if (visited.has(k)) continue;
        if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;

        const currentId = next[k] ?? -1;
        if (currentId !== targetId) continue;

        visited.add(k);
        next[k] = newProvinceId;
        queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      pushHistory(next);
      return next;
    });
  }, [mapWidth, mapHeight, pushHistory]);

  // Province CRUD
  const addProvince = useCallback((): Province => {
    const existingIds = provinces.map(p => p.id);
    while (existingIds.includes(nextIdRef.current)) nextIdRef.current++;
    const id = nextIdRef.current++;
    const p: Province = {
      id,
      name: `Province_${id}`,
      color: randomColor(),
      type: 'land',
      terrain: 'plains',
      continent: 1,
      coastal: false,
      manpower: 10000,
      development: 1,
      taxBase: 1,
      victoryPoints: 0,
      stateId: null,
      infrastructure: 1,
      supplyHub: false,
      airBase: 0,
      navalBase: 0,
      resources: {},
    };
    setProvinces(prev => [...prev, p]);
    setPaintProvinceId(id);
    return p;
  }, [provinces]);

  const updateProvince = useCallback((id: number, updates: Partial<Province>) => {
    setProvinces(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProvince = useCallback((id: number) => {
    setProvinces(prev => prev.filter(p => p.id !== id));
    setMapData(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (next[k] === id) delete next[k]; });
      return next;
    });
    setStates(prev => prev.map(s => ({ ...s, provinces: s.provinces.filter(pid => pid !== id) })));
    if (selectedProvinceId === id) setSelectedProvinceId(null);
    if (paintProvinceId === id) setPaintProvinceId(null);
  }, [selectedProvinceId, paintProvinceId]);

  // State CRUD
  const addState = useCallback((): GameState => {
    const existingIds = states.map(s => s.id);
    while (existingIds.includes(nextStateIdRef.current)) nextStateIdRef.current++;
    const id = nextStateIdRef.current++;
    const s: GameState = {
      id,
      name: `State_${id}`,
      category: 'rural',
      manpower: 0,
      owner: '',
      cores: [],
      claims: [],
      provinces: [],
      resources: {},
      victoryPoints: 0,
      buildings: {},
    };
    setStates(prev => [...prev, s]);
    return s;
  }, [states]);

  const updateState = useCallback((id: number, updates: Partial<GameState>) => {
    setStates(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteState = useCallback((id: number) => {
    setStates(prev => prev.filter(s => s.id !== id));
    setProvinces(prev => prev.map(p => p.stateId === id ? { ...p, stateId: null } : p));
  }, []);

  // Country CRUD
  const addCountry = useCallback((): Country => {
    const c: Country = {
      tag: `C${String(countries.length + 1).padStart(2, '0')}`,
      name: `Country_${countries.length + 1}`,
      adjective: '',
      color: randomColor(),
      capital: 0,
      government: 'democracy',
      ideology: 'neutral',
      culture: '',
      religion: '',
    };
    setCountries(prev => [...prev, c]);
    return c;
  }, [countries.length]);

  const updateCountry = useCallback((tag: string, updates: Partial<Country>) => {
    setCountries(prev => prev.map(c => c.tag === tag ? { ...c, ...updates } : c));
  }, []);

  const deleteCountry = useCallback((tag: string) => {
    setCountries(prev => prev.filter(c => c.tag !== tag));
    setStates(prev => prev.map(s => ({
      ...s,
      owner: s.owner === tag ? '' : s.owner,
      cores: s.cores.filter(c => c !== tag),
      claims: s.claims.filter(c => c !== tag),
    })));
  }, []);

  // Adjacency CRUD
  const addAdjacency = useCallback((): Adjacency => {
    const id = nextAdjIdRef.current++;
    const a: Adjacency = { id, from: 0, to: 0, type: 'land', through: -1, comment: '' };
    setAdjacencies(prev => [...prev, a]);
    return a;
  }, []);

  const deleteAdjacency = useCallback((id: number) => {
    setAdjacencies(prev => prev.filter(a => a.id !== id));
  }, []);

  const updateAdjacency = useCallback((id: number, updates: Partial<Adjacency>) => {
    setAdjacencies(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  // Helpers
  const getProvinceById = useCallback((id: number) => provinces.find(p => p.id === id), [provinces]);
  const getStateById = useCallback((id: number) => states.find(s => s.id === id), [states]);
  const getCountryByTag = useCallback((tag: string) => countries.find(c => c.tag === tag), [countries]);

  const getProvinceState = useCallback((provinceId: number) => {
    return states.find(s => s.provinces.includes(provinceId));
  }, [states]);

  const getProvinceCountry = useCallback((provinceId: number) => {
    const state = states.find(s => s.provinces.includes(provinceId));
    if (!state || !state.owner) return undefined;
    return countries.find(c => c.tag === state.owner);
  }, [states, countries]);

  const getCellCount = useCallback((provinceId: number) => {
    return Object.values(mapData).filter(id => id === provinceId).length;
  }, [mapData]);

  const value: EditorStore = {
    mapWidth, mapHeight, mapData, setMapData, setMapSize,
    paintCells, eraseCells, floodFill,
    provinces, setProvinces, states, setStates, countries, setCountries,
    terrainTypes, setTerrainTypes, resourceTypes, setResourceTypes,
    adjacencies, setAdjacencies,
    selectedTool, setSelectedTool, selectedProvinceId, setSelectedProvinceId,
    paintProvinceId, setPaintProvinceId, viewMode, setViewMode,
    zoom, setZoom, offset, setOffset, showGrid, setShowGrid,
    brushSize, setBrushSize, activeTab, setActiveTab,
    addProvince, updateProvince, deleteProvince,
    addState, updateState, deleteState,
    addCountry, updateCountry, deleteCountry,
    addAdjacency, deleteAdjacency, updateAdjacency,
    getProvinceById, getStateById, getCountryByTag,
    getProvinceState, getProvinceCountry, getCellCount,
    undo, redo, canUndo, canRedo,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
