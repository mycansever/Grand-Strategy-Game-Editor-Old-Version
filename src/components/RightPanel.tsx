import { useEditor } from '../store';

export default function RightPanel() {
  const {
    selectedProvinceId, provinces, states, countries,
    terrainTypes, getCellCount, setActiveTab,
    setSelectedProvinceId, setPaintProvinceId,
  } = useEditor();

  const province = selectedProvinceId !== null ? provinces.find(p => p.id === selectedProvinceId) : null;

  if (!province) {
    return (
      <div className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-3xl mb-2">📍</div>
            <p className="text-xs text-slate-500">Select a province on the map<br />or from the province list<br />to view its properties.</p>
            <div className="mt-4 text-left bg-slate-900 rounded p-3 border border-slate-700">
              <p className="text-[10px] text-slate-400 font-semibold mb-2">Quick Start:</p>
              <div className="space-y-1.5 text-[10px] text-slate-500">
                <p>1. 📍 Create a province in the left panel</p>
                <p>2. 🖌️ Select Paint tool (B)</p>
                <p>3. Click & drag on map to paint</p>
                <p>4. 🏛️ Create states and assign provinces</p>
                <p>5. 🏴 Create countries and assign to states</p>
                <p>6. 📄 Export everything as CSV</p>
              </div>
            </div>
            <div className="mt-3 text-left bg-slate-900 rounded p-3 border border-slate-700">
              <p className="text-[10px] text-slate-400 font-semibold mb-2">Controls:</p>
              <div className="space-y-1 text-[10px] text-slate-500">
                <p>🖱️ <b className="text-slate-400">Left Click</b> — Use Tool</p>
                <p>🖱️ <b className="text-slate-400">Right Click</b> — Pick Province</p>
                <p>🖱️ <b className="text-slate-400">Alt+Drag</b> — Pan Map</p>
                <p>🖱️ <b className="text-slate-400">Scroll</b> — Zoom In/Out</p>
                <p>⌨️ <b className="text-slate-400">V</b> — Select Tool</p>
                <p>⌨️ <b className="text-slate-400">B</b> — Paint Tool</p>
                <p>⌨️ <b className="text-slate-400">E</b> — Erase Tool</p>
                <p>⌨️ <b className="text-slate-400">G</b> — Fill Tool</p>
                <p>⌨️ <b className="text-slate-400">I</b> — Eyedropper</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const state = states.find(s => s.provinces.includes(province.id));
  const country = state?.owner ? countries.find(c => c.tag === state.owner) : null;
  const terrain = terrainTypes.find(t => t.id === province.terrain);
  const cellCount = getCellCount(province.id);
  const resourceEntries = Object.entries(province.resources).filter(([, v]) => v > 0);

  return (
    <div className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0">
      <div className="p-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Properties</h3>
          <button onClick={() => setSelectedProvinceId(null)} className="text-xs text-slate-500 hover:text-white">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Province Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg border-2 border-slate-600" style={{ backgroundColor: province.color }} />
          <div>
            <div className="text-sm font-semibold text-white">{province.name}</div>
            <div className="text-xs text-slate-400">Province ID: {province.id}</div>
            <div className="text-[10px] text-slate-500">{cellCount} cells painted</div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Type</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              province.type === 'land' ? 'bg-green-900 text-green-300' :
              province.type === 'sea' ? 'bg-blue-900 text-blue-300' :
              province.type === 'lake' ? 'bg-cyan-900 text-cyan-300' :
              'bg-gray-900 text-gray-300'
            }`}>{province.type}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Terrain</span>
            <div className="flex items-center gap-1.5">
              {terrain && <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: terrain.color }} />}
              <span className="text-xs text-slate-200">{terrain?.name || province.terrain}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Continent</span>
            <span className="text-xs text-slate-200">{province.continent}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Coastal</span>
            <span className={`text-xs ${province.coastal ? 'text-blue-400' : 'text-slate-500'}`}>
              {province.coastal ? '🌊 Yes' : 'No'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
          <h4 className="text-xs font-semibold text-slate-300 mb-2">Statistics</h4>
          <div className="space-y-1.5">
            <StatBar label="Manpower" value={province.manpower} max={100000} color="bg-blue-500" displayVal={province.manpower.toLocaleString()} />
            <StatBar label="Development" value={province.development} max={10} color="bg-emerald-500" />
            <StatBar label="Tax Base" value={province.taxBase} max={10} color="bg-yellow-500" />
            <StatBar label="Infrastructure" value={province.infrastructure} max={10} color="bg-orange-500" />
            <StatBar label="Victory Points" value={province.victoryPoints} max={50} color="bg-purple-500" />
          </div>
        </div>

        {/* Buildings */}
        {(province.supplyHub || province.airBase > 0 || province.navalBase > 0) && (
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Buildings</h4>
            <div className="space-y-1">
              {province.supplyHub && <div className="text-xs text-slate-300">📦 Supply Hub</div>}
              {province.airBase > 0 && <div className="text-xs text-slate-300">✈️ Air Base (Level {province.airBase})</div>}
              {province.navalBase > 0 && <div className="text-xs text-slate-300">⚓ Naval Base (Level {province.navalBase})</div>}
            </div>
          </div>
        )}

        {/* Resources */}
        {resourceEntries.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Resources</h4>
            <div className="space-y-1">
              {resourceEntries.map(([resId, amount]) => (
                <div key={resId} className="flex justify-between text-xs">
                  <span className="text-slate-400">{resId}</span>
                  <span className="text-slate-200 font-medium">{amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* State Info */}
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
          <h4 className="text-xs font-semibold text-slate-300 mb-2">Assignment</h4>
          {state ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">State</span>
                <span className="text-slate-200">{state.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Category</span>
                <span className="text-slate-200">{state.category.replace(/_/g, ' ')}</span>
              </div>
              {country && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Owner</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: country.color }} />
                    <span className="text-slate-200">{country.tag} - {country.name}</span>
                  </div>
                </div>
              )}
              {state.cores.length > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Cores</span>
                  <span className="text-emerald-400">{state.cores.join(', ')}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Not assigned to any state</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-1.5">
          <button
            onClick={() => { setPaintProvinceId(province.id); }}
            className="w-full h-8 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white font-medium"
          >
            🖌️ Set as Paint Color
          </button>
          <button
            onClick={() => { setActiveTab('provinces'); }}
            className="w-full h-8 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200 border border-slate-600"
          >
            ✎ Edit in Province Panel
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value, max, color, displayVal }: {
  label: string; value: number; max: number; color: string; displayVal?: string
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200">{displayVal ?? value}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
