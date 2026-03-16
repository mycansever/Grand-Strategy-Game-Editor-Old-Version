import { useEditor } from '../store';
import { Tool, ViewMode } from '../types';

const TOOLS: { id: Tool; label: string; icon: string; shortcut: string }[] = [
  { id: 'select', label: 'Select', icon: '⬚', shortcut: 'V' },
  { id: 'paint', label: 'Paint', icon: '🖌️', shortcut: 'B' },
  { id: 'erase', label: 'Erase', icon: '⌫', shortcut: 'E' },
  { id: 'fill', label: 'Fill', icon: '🪣', shortcut: 'G' },
  { id: 'eyedropper', label: 'Pick', icon: '💉', shortcut: 'I' },
];

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'province', label: 'Province' },
  { id: 'political', label: 'Political' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'state', label: 'States' },
];

export default function Toolbar() {
  const {
    selectedTool, setSelectedTool,
    viewMode, setViewMode,
    brushSize, setBrushSize,
    showGrid, setShowGrid,
    paintProvinceId, provinces,
    undo, redo, canUndo, canRedo,
    zoom, setZoom, setOffset,
    mapWidth, mapHeight, setMapSize,
  } = useEditor();

  const paintProvince = provinces.find(p => p.id === paintProvinceId);

  return (
    <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-2 gap-1 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-3 pr-3 border-r border-slate-600">
        <span className="text-lg">🗺️</span>
        <span className="text-sm font-bold text-slate-200 hidden lg:block">GS Map Editor</span>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-slate-600">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="w-8 h-8 rounded flex items-center justify-center text-sm disabled:opacity-30 hover:bg-slate-700 text-slate-300"
          title="Undo (Ctrl+Z)"
        >↩</button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="w-8 h-8 rounded flex items-center justify-center text-sm disabled:opacity-30 hover:bg-slate-700 text-slate-300"
          title="Redo (Ctrl+Y)"
        >↪</button>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-slate-600">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => setSelectedTool(tool.id)}
            className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
              selectedTool === tool.id
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-700 text-slate-300'
            }`}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Brush size */}
      {(selectedTool === 'paint' || selectedTool === 'erase') && (
        <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-slate-600">
          <span className="text-xs text-slate-400">Brush:</span>
          <input
            type="range"
            min={1}
            max={10}
            value={brushSize}
            onChange={e => setBrushSize(parseInt(e.target.value))}
            className="w-16 h-1 accent-blue-500"
          />
          <span className="text-xs text-slate-300 w-4">{brushSize}</span>
        </div>
      )}

      {/* Active paint province */}
      {paintProvince && (
        <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-slate-600">
          <span className="text-xs text-slate-400">Paint:</span>
          <span
            className="w-4 h-4 rounded-sm border border-slate-500"
            style={{ backgroundColor: paintProvince.color }}
          />
          <span className="text-xs text-slate-300 max-w-[80px] truncate">{paintProvince.name}</span>
        </div>
      )}

      {/* View Mode */}
      <div className="flex items-center gap-0.5 mr-2 pr-2 border-r border-slate-600">
        <span className="text-xs text-slate-400 mr-1">View:</span>
        {VIEW_MODES.map(vm => (
          <button
            key={vm.id}
            onClick={() => setViewMode(vm.id)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              viewMode === vm.id
                ? 'bg-emerald-600 text-white'
                : 'hover:bg-slate-700 text-slate-400'
            }`}
          >
            {vm.label}
          </button>
        ))}
      </div>

      {/* Grid Toggle */}
      <button
        onClick={() => setShowGrid(!showGrid)}
        className={`w-8 h-8 rounded flex items-center justify-center text-sm mr-1 ${
          showGrid ? 'bg-slate-600 text-white' : 'hover:bg-slate-700 text-slate-400'
        }`}
        title="Toggle Grid"
      >
        #
      </button>

      {/* Map Size */}
      <div className="flex items-center gap-1 mr-2 pr-2 border-r border-slate-600">
        <span className="text-xs text-slate-400">Map:</span>
        <input
          type="number"
          value={mapWidth}
          onChange={e => setMapSize(Math.max(10, parseInt(e.target.value) || 10), mapHeight)}
          className="w-12 h-6 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 text-center px-1"
        />
        <span className="text-xs text-slate-500">×</span>
        <input
          type="number"
          value={mapHeight}
          onChange={e => setMapSize(mapWidth, Math.max(10, parseInt(e.target.value) || 10))}
          className="w-12 h-6 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 text-center px-1"
        />
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => setZoom(Math.max(0.15, zoom / 1.3))}
          className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-slate-700 text-slate-300"
        >−</button>
        <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(Math.min(10, zoom * 1.3))}
          className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-slate-700 text-slate-300"
        >+</button>
        <button
          onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
          className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-slate-700 text-slate-300"
          title="Reset View"
        >⊞</button>
      </div>
    </div>
  );
}
