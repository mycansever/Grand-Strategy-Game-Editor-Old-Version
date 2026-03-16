import { useEffect } from 'react';
import { EditorProvider, useEditor } from './store';
import MapCanvas from './components/MapCanvas';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';

function KeyboardShortcuts() {
  const { setSelectedTool, undo, redo, showGrid, setShowGrid } = useEditor();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'v': setSelectedTool('select'); break;
        case 'b': setSelectedTool('paint'); break;
        case 'e': setSelectedTool('erase'); break;
        case 'g': setSelectedTool('fill'); break;
        case 'i': setSelectedTool('eyedropper'); break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          }
          break;
        case 'h': setShowGrid(!showGrid); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedTool, undo, redo, showGrid, setShowGrid]);

  return null;
}

function EditorLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-white overflow-hidden select-none">
      <KeyboardShortcuts />
      <Toolbar />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <MapCanvas />
        <RightPanel />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
