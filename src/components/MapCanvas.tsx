import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEditor } from '../store';

const CELL_SIZE = 10;

export default function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    mapData, mapWidth, mapHeight,
    provinces, states, countries, terrainTypes,
    selectedTool, paintProvinceId, selectedProvinceId,
    viewMode, zoom, setZoom, offset, setOffset, showGrid, brushSize,
    paintCells, eraseCells, floodFill,
    setSelectedProvinceId, setPaintProvinceId, setSelectedTool,
    getProvinceById,
  } = useEditor();

  const [isPanning, setIsPanning] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const animFrameRef = useRef<number>(0);

  // Screen <-> World coordinate conversions
  const screenToWorld = useCallback((sx: number, sy: number) => ({
    wx: sx / zoom + offset.x,
    wy: sy / zoom + offset.y,
  }), [zoom, offset]);

  const screenToGrid = useCallback((sx: number, sy: number) => {
    const { wx, wy } = screenToWorld(sx, sy);
    return {
      gx: Math.floor(wx / CELL_SIZE),
      gy: Math.floor(wy / CELL_SIZE),
    };
  }, [screenToWorld]);

  const gridToScreen = useCallback((gx: number, gy: number) => ({
    sx: (gx * CELL_SIZE - offset.x) * zoom,
    sy: (gy * CELL_SIZE - offset.y) * zoom,
  }), [zoom, offset]);

  // Get color for a province based on view mode
  const getColor = useCallback((provinceId: number | undefined): string => {
    if (provinceId === undefined) return '#1a1a2e';
    const province = provinces.find(p => p.id === provinceId);
    if (!province) return '#1a1a2e';

    switch (viewMode) {
      case 'province':
        return province.color;
      case 'terrain': {
        const terrain = terrainTypes.find(t => t.id === province.terrain);
        return terrain?.color || '#666666';
      }
      case 'political': {
        const state = states.find(s => s.provinces.includes(provinceId));
        if (state?.owner) {
          const country = countries.find(c => c.tag === state.owner);
          if (country) return country.color;
        }
        return '#444444';
      }
      case 'state': {
        const state = states.find(s => s.provinces.includes(provinceId));
        if (state) {
          // Generate deterministic color from state ID
          const hue = (state.id * 137) % 360;
          return `hsl(${hue}, 60%, 50%)`;
        }
        return '#444444';
      }
      default:
        return province.color;
    }
  }, [provinces, states, countries, terrainTypes, viewMode]);

  // RENDER
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Visible range
    const cellScreen = CELL_SIZE * zoom;
    const startX = Math.max(0, Math.floor(offset.x / CELL_SIZE));
    const startY = Math.max(0, Math.floor(offset.y / CELL_SIZE));
    const endX = Math.min(mapWidth, Math.ceil((offset.x + canvas.width / zoom) / CELL_SIZE));
    const endY = Math.min(mapHeight, Math.ceil((offset.y + canvas.height / zoom) / CELL_SIZE));

    // Draw map boundary
    const bx = (0 - offset.x) * zoom;
    const by = (0 - offset.y) * zoom;
    const bw = mapWidth * CELL_SIZE * zoom;
    const bh = mapHeight * CELL_SIZE * zoom;
    ctx.fillStyle = '#16213e';
    ctx.fillRect(bx, by, bw, bh);

    // Draw cells
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const key = `${x},${y}`;
        const pid = mapData[key];
        if (pid !== undefined) {
          const color = getColor(pid);
          const { sx, sy } = gridToScreen(x, y);
          ctx.fillStyle = color;
          ctx.fillRect(sx, sy, cellScreen + 0.5, cellScreen + 0.5);
        }
      }
    }

    // Draw province borders
    if (zoom >= 0.3) {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = Math.max(1, zoom);
      for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
          const key = `${x},${y}`;
          const pid = mapData[key];
          if (pid === undefined) continue;
          const { sx, sy } = gridToScreen(x, y);

          // Right neighbor
          const rightPid = mapData[`${x + 1},${y}`];
          if (rightPid !== pid) {
            ctx.beginPath();
            ctx.moveTo(sx + cellScreen, sy);
            ctx.lineTo(sx + cellScreen, sy + cellScreen);
            ctx.stroke();
          }
          // Bottom neighbor
          const bottomPid = mapData[`${x},${y + 1}`];
          if (bottomPid !== pid) {
            ctx.beginPath();
            ctx.moveTo(sx, sy + cellScreen);
            ctx.lineTo(sx + cellScreen, sy + cellScreen);
            ctx.stroke();
          }
          // Left neighbor
          if (x === startX || mapData[`${x - 1},${y}`] !== pid) {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx, sy + cellScreen);
            ctx.stroke();
          }
          // Top neighbor
          if (y === startY || mapData[`${x},${y - 1}`] !== pid) {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + cellScreen, sy);
            ctx.stroke();
          }
        }
      }
    }

    // Grid lines
    if (showGrid && zoom >= 0.8) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.5;
      for (let x = startX; x <= endX; x++) {
        const { sx } = gridToScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(sx, by);
        ctx.lineTo(sx, by + bh);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y++) {
        const { sy } = gridToScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(bx, sy);
        ctx.lineTo(bx + bw, sy);
        ctx.stroke();
      }
    }

    // Selected province highlight
    if (selectedProvinceId !== null) {
      const selProvince = provinces.find(p => p.id === selectedProvinceId);
      if (selProvince) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = Math.max(2, zoom * 2);
        for (let x = startX; x < endX; x++) {
          for (let y = startY; y < endY; y++) {
            if (mapData[`${x},${y}`] === selectedProvinceId) {
              const { sx, sy } = gridToScreen(x, y);
              // Only draw outer edges
              if (mapData[`${x + 1},${y}`] !== selectedProvinceId) {
                ctx.beginPath(); ctx.moveTo(sx + cellScreen, sy); ctx.lineTo(sx + cellScreen, sy + cellScreen); ctx.stroke();
              }
              if (mapData[`${x - 1},${y}`] !== selectedProvinceId) {
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy + cellScreen); ctx.stroke();
              }
              if (mapData[`${x},${y + 1}`] !== selectedProvinceId) {
                ctx.beginPath(); ctx.moveTo(sx, sy + cellScreen); ctx.lineTo(sx + cellScreen, sy + cellScreen); ctx.stroke();
              }
              if (mapData[`${x},${y - 1}`] !== selectedProvinceId) {
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + cellScreen, sy); ctx.stroke();
              }
            }
          }
        }
      }
    }

    // Brush preview
    if (hoverCell && (selectedTool === 'paint' || selectedTool === 'erase')) {
      ctx.strokeStyle = selectedTool === 'paint' ? 'rgba(34,211,238,0.7)' : 'rgba(248,113,113,0.7)';
      ctx.lineWidth = 2;
      const half = Math.floor(brushSize / 2);
      for (let dx = -half; dx < brushSize - half; dx++) {
        for (let dy = -half; dy < brushSize - half; dy++) {
          const gx = hoverCell.x + dx;
          const gy = hoverCell.y + dy;
          if (gx >= 0 && gx < mapWidth && gy >= 0 && gy < mapHeight) {
            const { sx, sy } = gridToScreen(gx, gy);
            ctx.strokeRect(sx, sy, cellScreen, cellScreen);
          }
        }
      }
    }

    // Province name labels (if zoomed in enough)
    if (zoom >= 1.5) {
      ctx.font = `${Math.max(9, 10 * zoom)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labeledProvinces = new Set<number>();
      for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
          const pid = mapData[`${x},${y}`];
          if (pid !== undefined && !labeledProvinces.has(pid)) {
            // Find center of province (approximate with first found cell)
            const cells: [number, number][] = [];
            for (let cx = startX; cx < endX; cx++) {
              for (let cy = startY; cy < endY; cy++) {
                if (mapData[`${cx},${cy}`] === pid) cells.push([cx, cy]);
              }
            }
            if (cells.length > 0) {
              const avgX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
              const avgY = cells.reduce((s, c) => s + c[1], 0) / cells.length;
              const { sx, sy } = gridToScreen(avgX, avgY);
              const province = provinces.find(p => p.id === pid);
              if (province) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                const textWidth = ctx.measureText(province.name).width;
                ctx.fillRect(sx - textWidth/2 - 2, sy - 7 * zoom, textWidth + 4, 14 * zoom);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(province.name, sx + cellScreen * zoom / 2, sy + cellScreen * zoom / 2);
              }
              labeledProvinces.add(pid);
            }
          }
        }
      }
    }

    // Map boundary border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

  }, [mapData, mapWidth, mapHeight, provinces, states, countries, terrainTypes,
    viewMode, zoom, offset, showGrid, selectedProvinceId, getColor, gridToScreen,
    hoverCell, selectedTool, brushSize]);

  // Request animation frame render
  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ w: width, h: height });
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Get brush cells
  const getBrushCells = useCallback((cx: number, cy: number): [number, number][] => {
    const cells: [number, number][] = [];
    const half = Math.floor(brushSize / 2);
    for (let dx = -half; dx < brushSize - half; dx++) {
      for (let dy = -half; dy < brushSize - half; dy++) {
        cells.push([cx + dx, cy + dy]);
      }
    }
    return cells;
  }, [brushSize]);

  // Apply tool at grid position
  const applyTool = useCallback((gx: number, gy: number) => {
    if (gx < 0 || gx >= mapWidth || gy < 0 || gy >= mapHeight) return;
    switch (selectedTool) {
      case 'paint':
        if (paintProvinceId !== null) {
          paintCells(getBrushCells(gx, gy), paintProvinceId);
        }
        break;
      case 'erase':
        eraseCells(getBrushCells(gx, gy));
        break;
      case 'fill':
        if (paintProvinceId !== null) {
          floodFill(gx, gy, paintProvinceId);
        }
        break;
      case 'select': {
        const pid = mapData[`${gx},${gy}`];
        setSelectedProvinceId(pid ?? null);
        break;
      }
      case 'eyedropper': {
        const pid = mapData[`${gx},${gy}`];
        if (pid !== undefined) {
          setPaintProvinceId(pid);
          setSelectedTool('paint');
        }
        break;
      }
    }
  }, [selectedTool, paintProvinceId, paintCells, eraseCells, floodFill, mapData, mapWidth, mapHeight,
    setSelectedProvinceId, setPaintProvinceId, setSelectedTool, getBrushCells]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }

    if (e.button === 0) {
      const { gx, gy } = screenToGrid(sx, sy);
      setIsPainting(true);
      applyTool(gx, gy);
    }
  }, [screenToGrid, applyTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { gx, gy } = screenToGrid(sx, sy);
    setHoverCell({ x: gx, y: gy });

    if (isPanning) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      setOffset({
        x: offset.x - dx / zoom,
        y: offset.y - dy / zoom,
      });
    }

    if (isPainting && !isPanning) {
      applyTool(gx, gy);
    }
  }, [isPanning, isPainting, zoom, screenToGrid, applyTool, setOffset]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsPainting(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const { wx, wy } = screenToWorld(sx, sy);
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newZoom = Math.max(0.15, Math.min(10, zoom * factor));

    setZoom(newZoom);
    setOffset({
      x: wx - sx / newZoom,
      y: wy - sy / newZoom,
    });
  }, [zoom, setZoom, setOffset, screenToWorld]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { gx, gy } = screenToGrid(sx, sy);
    const pid = mapData[`${gx},${gy}`];
    if (pid !== undefined) {
      setSelectedProvinceId(pid);
      setPaintProvinceId(pid);
    }
  }, [screenToGrid, mapData, setSelectedProvinceId, setPaintProvinceId]);

  const cursorClass = () => {
    switch (selectedTool) {
      case 'select': return 'cursor-pointer';
      case 'paint': return 'cursor-crosshair';
      case 'erase': return 'cursor-crosshair';
      case 'fill': return 'cursor-cell';
      case 'eyedropper': return 'cursor-copy';
      default: return 'cursor-default';
    }
  };

  const hoverProvince = hoverCell ? getProvinceById(mapData[`${hoverCell.x},${hoverCell.y}`]) : null;

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        className={cursorClass()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />
      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 border-t border-slate-700 px-3 py-1 flex items-center gap-4 text-xs text-slate-400">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>Grid: {mapWidth}×{mapHeight}</span>
        {hoverCell && (
          <span>Cell: ({hoverCell.x}, {hoverCell.y})</span>
        )}
        {hoverProvince && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: hoverProvince.color }} />
            Province: {hoverProvince.name} (ID: {hoverProvince.id})
          </span>
        )}
        <span className="ml-auto">Provinces: {provinces.length}</span>
        <span>Painted Cells: {Object.keys(mapData).length}</span>
      </div>
      {/* Mini controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button onClick={() => { setZoom(Math.min(10, zoom * 1.3)); }} className="w-8 h-8 bg-slate-800/80 hover:bg-slate-700 rounded flex items-center justify-center text-white text-sm border border-slate-600">+</button>
        <button onClick={() => { setZoom(Math.max(0.15, zoom / 1.3)); }} className="w-8 h-8 bg-slate-800/80 hover:bg-slate-700 rounded flex items-center justify-center text-white text-sm border border-slate-600">−</button>
        <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="w-8 h-8 bg-slate-800/80 hover:bg-slate-700 rounded flex items-center justify-center text-white text-[10px] border border-slate-600">⊞</button>
      </div>
    </div>
  );
}
