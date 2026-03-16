import React, { useState, useRef } from 'react';
import { useEditor } from '../store';
import { Province, GameState, TerrainType, Adjacency } from '../types';
import {
  exportProvincesCSV, exportStatesCSV, exportCountriesCSV,
  exportAdjacenciesCSV, exportResourcesCSV, exportMapDataCSV,
  exportTerrainCSV,
  importProvincesCSV, importStatesCSV, importCountriesCSV, importMapDataCSV,
  downloadFile, randomColor,
} from '../utils';

const TABS = [
  { id: 'provinces', label: 'Provinces', icon: '📍' },
  { id: 'states', label: 'States', icon: '🏛️' },
  { id: 'countries', label: 'Countries', icon: '🏴' },
  { id: 'terrain', label: 'Terrain', icon: '⛰️' },
  { id: 'resources', label: 'Resources', icon: '💎' },
  { id: 'adjacency', label: 'Adjacency', icon: '🔗' },
  { id: 'csv', label: 'Import/Export', icon: '📄' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab } = useEditor();

  return (
    <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
      {/* Tab buttons */}
      <div className="flex flex-wrap border-b border-slate-700 bg-slate-850">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 py-1.5 text-xs flex items-center gap-1 transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400 bg-slate-750'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
            title={tab.label}
          >
            <span>{tab.icon}</span>
            <span className="hidden xl:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'provinces' && <ProvinceTab />}
        {activeTab === 'states' && <StateTab />}
        {activeTab === 'countries' && <CountryTab />}
        {activeTab === 'terrain' && <TerrainTab />}
        {activeTab === 'resources' && <ResourceTab />}
        {activeTab === 'adjacency' && <AdjacencyTab />}
        {activeTab === 'csv' && <CSVTab />}
      </div>
    </div>
  );
}

// ======================== PROVINCE TAB ========================
function ProvinceTab() {
  const {
    provinces, addProvince, updateProvince, deleteProvince,
    paintProvinceId, setPaintProvinceId,
    selectedProvinceId, setSelectedProvinceId,
    getCellCount, terrainTypes, states,
    resourceTypes,
  } = useEditor();
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  const filtered = provinces.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    String(p.id).includes(search)
  );

  const editProvince = editId !== null ? provinces.find(p => p.id === editId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-2 border-b border-slate-700">
        <div className="flex items-center gap-1 mb-2">
          <input
            type="text"
            placeholder="Search provinces..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 h-7 bg-slate-700 border border-slate-600 rounded text-xs text-slate-200 px-2"
          />
          <button
            onClick={() => {
              const p = addProvince();
              setEditId(p.id);
            }}
            className="h-7 px-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white font-medium"
          >
            + Add
          </button>
        </div>
        <div className="text-xs text-slate-500">
          {provinces.length} provinces • Click to paint • Double-click to edit
        </div>
      </div>

      {/* Province List */}
      {!editProvince ? (
        <div className="flex-1 overflow-y-auto">
          {filtered.map(p => {
            const cellCount = getCellCount(p.id);
            const state = states.find(s => s.provinces.includes(p.id));
            return (
              <div
                key={p.id}
                onClick={() => { setPaintProvinceId(p.id); setSelectedProvinceId(p.id); }}
                onDoubleClick={() => setEditId(p.id)}
                className={`px-2 py-1.5 border-b border-slate-700/50 cursor-pointer flex items-center gap-2 transition-colors ${
                  paintProvinceId === p.id ? 'bg-blue-900/40 border-l-2 border-l-blue-500' : 'hover:bg-slate-700/50'
                } ${selectedProvinceId === p.id ? 'ring-1 ring-yellow-500/50' : ''}`}
              >
                <span className="w-5 h-5 rounded-sm border border-slate-600 shrink-0" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-200 truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-500">
                    ID:{p.id} • {p.type} • {p.terrain} • {cellCount} cells
                    {state && ` • ${state.name}`}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditId(p.id); }}
                  className="w-5 h-5 rounded hover:bg-slate-600 text-slate-400 text-xs flex items-center justify-center"
                >✎</button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-xs">
              {provinces.length === 0 ? 'No provinces yet. Click "+ Add" to create one.' : 'No matching provinces.'}
            </div>
          )}
        </div>
      ) : (
        /* Province Editor */
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Edit Province #{editProvince.id}</h3>
            <button onClick={() => setEditId(null)} className="text-xs text-slate-400 hover:text-white">✕ Close</button>
          </div>

          <Field label="Name">
            <input value={editProvince.name} onChange={e => updateProvince(editProvince.id, { name: e.target.value })}
              className="input-field" />
          </Field>

          <Field label="Color">
            <div className="flex items-center gap-2">
              <input type="color" value={editProvince.color}
                onChange={e => updateProvince(editProvince.id, { color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <input value={editProvince.color} onChange={e => updateProvince(editProvince.id, { color: e.target.value })}
                className="input-field flex-1" />
              <button onClick={() => updateProvince(editProvince.id, { color: randomColor() })}
                className="text-xs text-blue-400 hover:text-blue-300">Random</button>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Type">
              <select value={editProvince.type}
                onChange={e => updateProvince(editProvince.id, { type: e.target.value as Province['type'] })}
                className="input-field">
                <option value="land">Land</option>
                <option value="sea">Sea</option>
                <option value="lake">Lake</option>
                <option value="wasteland">Wasteland</option>
              </select>
            </Field>
            <Field label="Terrain">
              <select value={editProvince.terrain}
                onChange={e => updateProvince(editProvince.id, { terrain: e.target.value })}
                className="input-field">
                {terrainTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Continent">
              <input type="number" min={0} value={editProvince.continent}
                onChange={e => updateProvince(editProvince.id, { continent: parseInt(e.target.value) || 0 })}
                className="input-field" />
            </Field>
            <Field label="Coastal">
              <label className="flex items-center gap-2 mt-1">
                <input type="checkbox" checked={editProvince.coastal}
                  onChange={e => updateProvince(editProvince.id, { coastal: e.target.checked })}
                  className="accent-blue-500" />
                <span className="text-xs text-slate-300">Is Coastal</span>
              </label>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Manpower">
              <input type="number" min={0} value={editProvince.manpower}
                onChange={e => updateProvince(editProvince.id, { manpower: parseInt(e.target.value) || 0 })}
                className="input-field" />
            </Field>
            <Field label="Development">
              <input type="number" min={0} max={10} value={editProvince.development}
                onChange={e => updateProvince(editProvince.id, { development: parseInt(e.target.value) || 0 })}
                className="input-field" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Tax Base">
              <input type="number" min={0} step={0.1} value={editProvince.taxBase}
                onChange={e => updateProvince(editProvince.id, { taxBase: parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </Field>
            <Field label="Victory Points">
              <input type="number" min={0} value={editProvince.victoryPoints}
                onChange={e => updateProvince(editProvince.id, { victoryPoints: parseInt(e.target.value) || 0 })}
                className="input-field" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Infrastructure">
              <input type="number" min={0} max={10} value={editProvince.infrastructure}
                onChange={e => updateProvince(editProvince.id, { infrastructure: parseInt(e.target.value) || 0 })}
                className="input-field" />
            </Field>
            <Field label="Supply Hub">
              <label className="flex items-center gap-2 mt-1">
                <input type="checkbox" checked={editProvince.supplyHub}
                  onChange={e => updateProvince(editProvince.id, { supplyHub: e.target.checked })}
                  className="accent-blue-500" />
                <span className="text-xs text-slate-300">Has Supply Hub</span>
              </label>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Air Base Level">
              <input type="number" min={0} max={10} value={editProvince.airBase}
                onChange={e => updateProvince(editProvince.id, { airBase: parseInt(e.target.value) || 0 })}
                className="input-field" />
            </Field>
            <Field label="Naval Base Level">
              <input type="number" min={0} max={10} value={editProvince.navalBase}
                onChange={e => updateProvince(editProvince.id, { navalBase: parseInt(e.target.value) || 0 })}
                className="input-field" />
            </Field>
          </div>

          {/* Resources */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Resources</label>
            <div className="space-y-1">
              {resourceTypes.map(rt => (
                <div key={rt.id} className="flex items-center gap-2">
                  <span className="text-xs w-20 text-slate-400">{rt.icon} {rt.name}</span>
                  <input
                    type="number"
                    min={0}
                    value={editProvince.resources[rt.id] || 0}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      const newRes = { ...editProvince.resources };
                      if (val > 0) newRes[rt.id] = val;
                      else delete newRes[rt.id];
                      updateProvince(editProvince.id, { resources: newRes });
                    }}
                    className="input-field flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700 flex gap-2">
            <button
              onClick={() => { setPaintProvinceId(editProvince.id); }}
              className="flex-1 h-7 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white">
              Set as Paint
            </button>
            <button
              onClick={() => { deleteProvince(editProvince.id); setEditId(null); }}
              className="h-7 px-3 bg-red-600/80 hover:bg-red-600 rounded text-xs text-white">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== STATE TAB ========================
function StateTab() {
  const {
    states, addState, updateState, deleteState,
    provinces, countries,
  } = useEditor();
  const [editId, setEditId] = useState<number | null>(null);
  const editState = editId !== null ? states.find(s => s.id === editId) : null;

  const unassignedProvinces = provinces.filter(p => !states.some(s => s.provinces.includes(p.id)));

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs text-slate-400">{states.length} states</span>
        <button onClick={() => { const s = addState(); setEditId(s.id); }}
          className="h-7 px-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white">+ Add State</button>
      </div>

      {!editState ? (
        <div className="flex-1 overflow-y-auto">
          {states.map(s => {
            const owner = countries.find(c => c.tag === s.owner);
            return (
              <div key={s.id} onClick={() => setEditId(s.id)}
                className="px-2 py-1.5 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/50">
                <div className="flex items-center gap-2">
                  {owner && <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: owner.color }} />}
                  <span className="text-xs text-slate-200">{s.name}</span>
                  <span className="text-[10px] text-slate-500 ml-auto">{s.provinces.length} prov</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  ID:{s.id} • {s.category} • {s.owner || 'No owner'}
                </div>
              </div>
            );
          })}
          {unassignedProvinces.length > 0 && (
            <div className="p-2 bg-yellow-900/20 border-t border-yellow-800/30">
              <div className="text-[10px] text-yellow-500 mb-1">⚠️ {unassignedProvinces.length} unassigned provinces</div>
              <div className="flex flex-wrap gap-1">
                {unassignedProvinces.slice(0, 10).map(p => (
                  <span key={p.id} className="text-[10px] text-slate-400 bg-slate-700 px-1 rounded">{p.name}</span>
                ))}
                {unassignedProvinces.length > 10 && <span className="text-[10px] text-slate-500">...</span>}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Edit State #{editState.id}</h3>
            <button onClick={() => setEditId(null)} className="text-xs text-slate-400 hover:text-white">✕ Close</button>
          </div>

          <Field label="Name">
            <input value={editState.name} onChange={e => updateState(editState.id, { name: e.target.value })}
              className="input-field" />
          </Field>

          <Field label="Category">
            <select value={editState.category} onChange={e => updateState(editState.id, { category: e.target.value as GameState['category'] })}
              className="input-field">
              {['megalopolis','metropolis','large_city','city','large_town','town','rural','pastoral','wasteland'].map(c =>
                <option key={c} value={c}>{c.replace(/_/g,' ')}</option>
              )}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Owner">
              <select value={editState.owner} onChange={e => updateState(editState.id, { owner: e.target.value })}
                className="input-field">
                <option value="">None</option>
                {countries.map(c => <option key={c.tag} value={c.tag}>{c.tag} - {c.name}</option>)}
              </select>
            </Field>
            <Field label="Manpower">
              <input type="number" min={0} value={editState.manpower}
                onChange={e => updateState(editState.id, { manpower: parseInt(e.target.value) || 0 })}
                className="input-field" />
            </Field>
          </div>

          <Field label="Victory Points">
            <input type="number" min={0} value={editState.victoryPoints}
              onChange={e => updateState(editState.id, { victoryPoints: parseInt(e.target.value) || 0 })}
              className="input-field" />
          </Field>

          <Field label="Cores">
            <div className="flex flex-wrap gap-1">
              {editState.cores.map(tag => (
                <span key={tag} className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                  {tag}
                  <button onClick={() => updateState(editState.id, { cores: editState.cores.filter(c => c !== tag) })}
                    className="hover:text-red-300">×</button>
                </span>
              ))}
              <select
                value=""
                onChange={e => {
                  if (e.target.value && !editState.cores.includes(e.target.value)) {
                    updateState(editState.id, { cores: [...editState.cores, e.target.value] });
                  }
                }}
                className="input-field text-[10px] w-20"
              >
                <option value="">+ Add</option>
                {countries.filter(c => !editState.cores.includes(c.tag)).map(c =>
                  <option key={c.tag} value={c.tag}>{c.tag}</option>
                )}
              </select>
            </div>
          </Field>

          <Field label="Claims">
            <div className="flex flex-wrap gap-1">
              {editState.claims.map(tag => (
                <span key={tag} className="text-[10px] bg-amber-800 text-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                  {tag}
                  <button onClick={() => updateState(editState.id, { claims: editState.claims.filter(c => c !== tag) })}
                    className="hover:text-red-300">×</button>
                </span>
              ))}
              <select
                value=""
                onChange={e => {
                  if (e.target.value && !editState.claims.includes(e.target.value)) {
                    updateState(editState.id, { claims: [...editState.claims, e.target.value] });
                  }
                }}
                className="input-field text-[10px] w-20"
              >
                <option value="">+ Add</option>
                {countries.filter(c => !editState.claims.includes(c.tag)).map(c =>
                  <option key={c.tag} value={c.tag}>{c.tag}</option>
                )}
              </select>
            </div>
          </Field>

          {/* Provinces in state */}
          <Field label={`Provinces (${editState.provinces.length})`}>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {editState.provinces.map(pid => {
                const prov = provinces.find(p => p.id === pid);
                return prov ? (
                  <div key={pid} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: prov.color }} />
                    <span className="text-slate-300 flex-1">{prov.name}</span>
                    <button
                      onClick={() => updateState(editState.id, { provinces: editState.provinces.filter(id => id !== pid) })}
                      className="text-red-400 hover:text-red-300 text-[10px]">Remove</button>
                  </div>
                ) : null;
              })}
            </div>
            {/* Add province */}
            <select
              value=""
              onChange={e => {
                const pid = parseInt(e.target.value);
                if (pid && !editState.provinces.includes(pid)) {
                  // Remove from other states
                  states.forEach(s => {
                    if (s.id !== editState.id && s.provinces.includes(pid)) {
                      updateState(s.id, { provinces: s.provinces.filter(id => id !== pid) });
                    }
                  });
                  updateState(editState.id, { provinces: [...editState.provinces, pid] });
                }
              }}
              className="input-field mt-1 text-[10px]"
            >
              <option value="">+ Add Province...</option>
              {provinces.filter(p => !editState.provinces.includes(p.id)).map(p =>
                <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
              )}
            </select>
          </Field>

          <div className="pt-2 border-t border-slate-700">
            <button onClick={() => { deleteState(editState.id); setEditId(null); }}
              className="h-7 px-3 bg-red-600/80 hover:bg-red-600 rounded text-xs text-white">Delete State</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== COUNTRY TAB ========================
function CountryTab() {
  const { countries, addCountry, updateCountry, deleteCountry, provinces, states } = useEditor();
  const [editTag, setEditTag] = useState<string | null>(null);
  const editCountry = editTag ? countries.find(c => c.tag === editTag) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs text-slate-400">{countries.length} countries</span>
        <button onClick={() => { const c = addCountry(); setEditTag(c.tag); }}
          className="h-7 px-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white">+ Add Country</button>
      </div>

      {!editCountry ? (
        <div className="flex-1 overflow-y-auto">
          {countries.map(c => {
            const ownedStates = states.filter(s => s.owner === c.tag);
            const ownedProvinces = ownedStates.reduce((sum, s) => sum + s.provinces.length, 0);
            return (
              <div key={c.tag} onClick={() => setEditTag(c.tag)}
                className="px-2 py-1.5 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-sm border border-slate-600" style={{ backgroundColor: c.color }} />
                  <span className="text-xs font-mono text-slate-300">{c.tag}</span>
                  <span className="text-xs text-slate-200">{c.name}</span>
                </div>
                <div className="text-[10px] text-slate-500 ml-7">
                  {c.government} • {ownedStates.length} states • {ownedProvinces} provinces
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Edit {editCountry.tag}</h3>
            <button onClick={() => setEditTag(null)} className="text-xs text-slate-400 hover:text-white">✕ Close</button>
          </div>

          <Field label="Tag (3 letters)">
            <input value={editCountry.tag} maxLength={3}
              onChange={e => {
                const newTag = e.target.value.toUpperCase();
                if (newTag !== editCountry.tag) {
                  // Update references
                  updateCountry(editCountry.tag, { tag: newTag });
                  setEditTag(newTag);
                }
              }}
              className="input-field font-mono uppercase" />
          </Field>

          <Field label="Name">
            <input value={editCountry.name} onChange={e => updateCountry(editCountry.tag, { name: e.target.value })}
              className="input-field" />
          </Field>

          <Field label="Adjective">
            <input value={editCountry.adjective} onChange={e => updateCountry(editCountry.tag, { adjective: e.target.value })}
              className="input-field" placeholder="e.g., French, German" />
          </Field>

          <Field label="Color">
            <div className="flex items-center gap-2">
              <input type="color" value={editCountry.color}
                onChange={e => updateCountry(editCountry.tag, { color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <input value={editCountry.color} onChange={e => updateCountry(editCountry.tag, { color: e.target.value })}
                className="input-field flex-1" />
            </div>
          </Field>

          <Field label="Capital Province">
            <select value={editCountry.capital}
              onChange={e => updateCountry(editCountry.tag, { capital: parseInt(e.target.value) || 0 })}
              className="input-field">
              <option value={0}>None</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
            </select>
          </Field>

          <Field label="Government">
            <select value={editCountry.government}
              onChange={e => updateCountry(editCountry.tag, { government: e.target.value })}
              className="input-field">
              {['democracy','monarchy','republic','theocracy','tribal','military_dictatorship','communist_state','fascist_state','oligarchy','despotism'].map(g =>
                <option key={g} value={g}>{g.replace(/_/g,' ')}</option>
              )}
            </select>
          </Field>

          <Field label="Ideology">
            <select value={editCountry.ideology}
              onChange={e => updateCountry(editCountry.tag, { ideology: e.target.value })}
              className="input-field">
              {['neutral','democratic','communist','fascist','monarchist','anarchist','theocratic','liberal','conservative','socialist'].map(i =>
                <option key={i} value={i}>{i}</option>
              )}
            </select>
          </Field>

          <Field label="Culture">
            <input value={editCountry.culture} onChange={e => updateCountry(editCountry.tag, { culture: e.target.value })}
              className="input-field" />
          </Field>

          <Field label="Religion">
            <input value={editCountry.religion} onChange={e => updateCountry(editCountry.tag, { religion: e.target.value })}
              className="input-field" />
          </Field>

          <div className="pt-2 border-t border-slate-700">
            <button onClick={() => { deleteCountry(editCountry.tag); setEditTag(null); }}
              className="h-7 px-3 bg-red-600/80 hover:bg-red-600 rounded text-xs text-white">Delete Country</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== TERRAIN TAB ========================
function TerrainTab() {
  const { terrainTypes, setTerrainTypes } = useEditor();
  const [editId, setEditId] = useState<string | null>(null);
  const editTerrain = editId ? terrainTypes.find(t => t.id === editId) : null;

  const updateTerrain = (id: string, updates: Partial<TerrainType>) => {
    setTerrainTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addTerrain = () => {
    const id = `terrain_${Date.now()}`;
    const t: TerrainType = {
      id, name: 'New Terrain', color: randomColor(),
      movementCost: 1, attrition: 0, defensiveBonus: 0, supplyLimit: 5,
    };
    setTerrainTypes(prev => [...prev, t]);
    setEditId(id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs text-slate-400">{terrainTypes.length} terrain types</span>
        <button onClick={addTerrain} className="h-7 px-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white">+ Add</button>
      </div>

      {!editTerrain ? (
        <div className="flex-1 overflow-y-auto">
          {terrainTypes.map(t => (
            <div key={t.id} onClick={() => setEditId(t.id)}
              className="px-2 py-1.5 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/50 flex items-center gap-2">
              <span className="w-5 h-5 rounded-sm" style={{ backgroundColor: t.color }} />
              <div className="flex-1">
                <div className="text-xs text-slate-200">{t.name}</div>
                <div className="text-[10px] text-slate-500">
                  Move: {t.movementCost} • Def: +{(t.defensiveBonus * 100).toFixed(0)}% • Supply: {t.supplyLimit}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Edit Terrain</h3>
            <button onClick={() => setEditId(null)} className="text-xs text-slate-400 hover:text-white">✕ Close</button>
          </div>
          <Field label="ID">
            <input value={editTerrain.id} onChange={e => {
              const newId = e.target.value;
              setTerrainTypes(prev => prev.map(t => t.id === editTerrain.id ? { ...t, id: newId } : t));
              setEditId(newId);
            }} className="input-field font-mono" />
          </Field>
          <Field label="Name">
            <input value={editTerrain.name} onChange={e => updateTerrain(editTerrain.id, { name: e.target.value })} className="input-field" />
          </Field>
          <Field label="Color">
            <div className="flex items-center gap-2">
              <input type="color" value={editTerrain.color} onChange={e => updateTerrain(editTerrain.id, { color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <input value={editTerrain.color} onChange={e => updateTerrain(editTerrain.id, { color: e.target.value })} className="input-field flex-1" />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Movement Cost">
              <input type="number" min={0} step={0.1} value={editTerrain.movementCost}
                onChange={e => updateTerrain(editTerrain.id, { movementCost: parseFloat(e.target.value) || 0 })} className="input-field" />
            </Field>
            <Field label="Attrition">
              <input type="number" min={0} step={0.01} value={editTerrain.attrition}
                onChange={e => updateTerrain(editTerrain.id, { attrition: parseFloat(e.target.value) || 0 })} className="input-field" />
            </Field>
            <Field label="Defensive Bonus">
              <input type="number" min={0} step={0.05} value={editTerrain.defensiveBonus}
                onChange={e => updateTerrain(editTerrain.id, { defensiveBonus: parseFloat(e.target.value) || 0 })} className="input-field" />
            </Field>
            <Field label="Supply Limit">
              <input type="number" min={0} value={editTerrain.supplyLimit}
                onChange={e => updateTerrain(editTerrain.id, { supplyLimit: parseInt(e.target.value) || 0 })} className="input-field" />
            </Field>
          </div>
          <div className="pt-2 border-t border-slate-700">
            <button onClick={() => { setTerrainTypes(prev => prev.filter(t => t.id !== editTerrain.id)); setEditId(null); }}
              className="h-7 px-3 bg-red-600/80 hover:bg-red-600 rounded text-xs text-white">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== RESOURCE TAB ========================
function ResourceTab() {
  const { resourceTypes, setResourceTypes } = useEditor();

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs text-slate-400">{resourceTypes.length} resource types</span>
        <button onClick={() => setResourceTypes(prev => [...prev, { id: `res_${Date.now()}`, name: 'New Resource', color: randomColor(), icon: '🔹' }])}
          className="h-7 px-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white">+ Add</button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {resourceTypes.map(r => (
          <div key={r.id} className="bg-slate-750 rounded p-2 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{r.icon}</span>
              <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: r.color }} />
              <span className="text-xs text-slate-200 font-medium">{r.name}</span>
              <button onClick={() => setResourceTypes(prev => prev.filter(rt => rt.id !== r.id))}
                className="ml-auto text-red-400 hover:text-red-300 text-xs">×</button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <input value={r.id} onChange={e => setResourceTypes(prev => prev.map(rt => rt.id === r.id ? { ...rt, id: e.target.value } : rt))}
                className="input-field text-[10px]" placeholder="ID" />
              <input value={r.name} onChange={e => setResourceTypes(prev => prev.map(rt => rt.id === r.id ? { ...rt, name: e.target.value } : rt))}
                className="input-field text-[10px]" placeholder="Name" />
              <input value={r.icon} onChange={e => setResourceTypes(prev => prev.map(rt => rt.id === r.id ? { ...rt, icon: e.target.value } : rt))}
                className="input-field text-[10px]" placeholder="Icon" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================== ADJACENCY TAB ========================
function AdjacencyTab() {
  const { adjacencies, addAdjacency, deleteAdjacency, updateAdjacency, provinces } = useEditor();

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs text-slate-400">{adjacencies.length} adjacencies</span>
        <button onClick={addAdjacency}
          className="h-7 px-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white">+ Add</button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {adjacencies.map(a => (
          <div key={a.id} className="bg-slate-750 rounded p-2 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-300 font-medium">Adjacency #{a.id}</span>
              <button onClick={() => deleteAdjacency(a.id)} className="text-red-400 hover:text-red-300 text-xs">×</button>
            </div>
            <div className="grid grid-cols-2 gap-1 mb-1">
              <div>
                <label className="text-[10px] text-slate-500">From Province</label>
                <select value={a.from} onChange={e => updateAdjacency(a.id, { from: parseInt(e.target.value) || 0 })} className="input-field text-[10px]">
                  <option value={0}>None</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500">To Province</label>
                <select value={a.to} onChange={e => updateAdjacency(a.id, { to: parseInt(e.target.value) || 0 })} className="input-field text-[10px]">
                  <option value={0}>None</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className="text-[10px] text-slate-500">Type</label>
                <select value={a.type} onChange={e => updateAdjacency(a.id, { type: e.target.value as Adjacency['type'] })} className="input-field text-[10px]">
                  {['land','sea','river_crossing','strait','canal','impassable'].map(t =>
                    <option key={t} value={t}>{t.replace(/_/g,' ')}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Comment</label>
                <input value={a.comment} onChange={e => updateAdjacency(a.id, { comment: e.target.value })} className="input-field text-[10px]" />
              </div>
            </div>
          </div>
        ))}
        {adjacencies.length === 0 && (
          <div className="text-center text-slate-500 text-xs py-4">No adjacencies defined. Click "+ Add" to create one.</div>
        )}
      </div>
    </div>
  );
}

// ======================== CSV TAB ========================
function CSVTab() {
  const {
    provinces, states, countries, adjacencies,
    terrainTypes, resourceTypes, mapData,
    setProvinces, setStates, setCountries, setMapData,
  } = useEditor();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState('provinces');
  const [importPreview, setImportPreview] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string>('');

  const handleExport = (type: string) => {
    switch (type) {
      case 'provinces': downloadFile('definition.csv', exportProvincesCSV(provinces)); break;
      case 'states': downloadFile('states.csv', exportStatesCSV(states)); break;
      case 'countries': downloadFile('countries.csv', exportCountriesCSV(countries)); break;
      case 'adjacency': downloadFile('adjacencies.csv', exportAdjacenciesCSV(adjacencies)); break;
      case 'resources': downloadFile('resources.csv', exportResourcesCSV(provinces, resourceTypes)); break;
      case 'map': downloadFile('map_data.csv', exportMapDataCSV(mapData)); break;
      case 'terrain': downloadFile('terrain.csv', exportTerrainCSV(terrainTypes)); break;
      case 'all':
        downloadFile('definition.csv', exportProvincesCSV(provinces));
        downloadFile('states.csv', exportStatesCSV(states));
        downloadFile('countries.csv', exportCountriesCSV(countries));
        downloadFile('adjacencies.csv', exportAdjacenciesCSV(adjacencies));
        downloadFile('resources.csv', exportResourcesCSV(provinces, resourceTypes));
        downloadFile('map_data.csv', exportMapDataCSV(mapData));
        downloadFile('terrain.csv', exportTerrainCSV(terrainTypes));
        break;
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportPreview(text.slice(0, 500));
      try {
        switch (importType) {
          case 'provinces': {
            const imported = importProvincesCSV(text);
            setProvinces(imported);
            setImportStatus(`✅ Imported ${imported.length} provinces`);
            break;
          }
          case 'states': {
            const imported = importStatesCSV(text);
            setStates(imported);
            setImportStatus(`✅ Imported ${imported.length} states`);
            break;
          }
          case 'countries': {
            const imported = importCountriesCSV(text);
            setCountries(imported);
            setImportStatus(`✅ Imported ${imported.length} countries`);
            break;
          }
          case 'map': {
            const imported = importMapDataCSV(text);
            setMapData(imported);
            setImportStatus(`✅ Imported ${Object.keys(imported).length} map cells`);
            break;
          }
        }
      } catch (err) {
        setImportStatus(`❌ Error: ${err}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">📤 Export Data</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { id: 'provinces', label: '📍 Provinces', count: provinces.length },
          { id: 'states', label: '🏛️ States', count: states.length },
          { id: 'countries', label: '🏴 Countries', count: countries.length },
          { id: 'adjacency', label: '🔗 Adjacencies', count: adjacencies.length },
          { id: 'resources', label: '💎 Resources', count: resourceTypes.length },
          { id: 'map', label: '🗺️ Map Data', count: Object.keys(mapData).length },
          { id: 'terrain', label: '⛰️ Terrain', count: terrainTypes.length },
        ].map(item => (
          <button key={item.id} onClick={() => handleExport(item.id)}
            className="h-9 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200 flex items-center justify-center gap-1 border border-slate-600">
            {item.label} <span className="text-slate-400">({item.count})</span>
          </button>
        ))}
        <button onClick={() => handleExport('all')}
          className="col-span-2 h-9 bg-emerald-700 hover:bg-emerald-600 rounded text-xs text-white font-medium border border-emerald-600">
          📦 Export All Files
        </button>
      </div>

      <hr className="border-slate-700" />

      <h3 className="text-sm font-semibold text-slate-200">📥 Import Data</h3>
      <Field label="Import Type">
        <select value={importType} onChange={e => setImportType(e.target.value)} className="input-field">
          <option value="provinces">Provinces (definition.csv)</option>
          <option value="states">States (states.csv)</option>
          <option value="countries">Countries (countries.csv)</option>
          <option value="map">Map Data (map_data.csv)</option>
        </select>
      </Field>
      <div>
        <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleImportFile} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full h-9 bg-blue-700 hover:bg-blue-600 rounded text-xs text-white font-medium border border-blue-600">
          📂 Choose CSV File
        </button>
      </div>
      {importStatus && (
        <div className={`text-xs p-2 rounded ${importStatus.startsWith('✅') ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
          {importStatus}
        </div>
      )}
      {importPreview && (
        <div className="bg-slate-900 rounded p-2 border border-slate-700">
          <div className="text-[10px] text-slate-500 mb-1">Preview:</div>
          <pre className="text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap">{importPreview}</pre>
        </div>
      )}

      <hr className="border-slate-700" />

      <h3 className="text-sm font-semibold text-slate-200">📊 Statistics</h3>
      <div className="bg-slate-900 rounded p-3 border border-slate-700 space-y-1.5">
        <StatRow label="Provinces" value={provinces.length} />
        <StatRow label="States" value={states.length} />
        <StatRow label="Countries" value={countries.length} />
        <StatRow label="Terrain Types" value={terrainTypes.length} />
        <StatRow label="Resource Types" value={resourceTypes.length} />
        <StatRow label="Adjacencies" value={adjacencies.length} />
        <StatRow label="Painted Cells" value={Object.keys(mapData).length} />
        <StatRow label="Land Provinces" value={provinces.filter(p => p.type === 'land').length} />
        <StatRow label="Sea Provinces" value={provinces.filter(p => p.type === 'sea').length} />
        <StatRow label="Total Manpower" value={provinces.reduce((s, p) => s + p.manpower, 0).toLocaleString()} />
        <StatRow label="Total VP" value={provinces.reduce((s, p) => s + p.victoryPoints, 0)} />
      </div>
    </div>
  );
}

// ======================== HELPER COMPONENTS ========================
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-0.5 block">{label}</label>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  );
}
