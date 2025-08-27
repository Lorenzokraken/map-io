import { useState } from 'react';
import Toolbar from './components/Toolbar';
import GraphView from './components/GraphView';
import { Sidebar } from './components/Sidebar';
import MarkdownEditor from './components/MarkdownEditor'; // Will create this soon

function App(): JSX.Element {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null); // New state

  const handleOpenMarkdownEditor = (nodeId: string) => {
    setEditingNodeId(nodeId);
  };

  const handleCloseMarkdownEditor = () => {
    setEditingNodeId(null);
  };

  return (
    <div className="app-container">
      <Toolbar />
      <main className="main-content">
        <GraphView
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
        />
        {selectedNodeId && (
          <Sidebar
            selectedNodeId={selectedNodeId}
            onOpenMarkdownEditor={handleOpenMarkdownEditor} // Pass handler
          />
        )}
      </main>
      {editingNodeId && (
        <MarkdownEditor
          nodeId={editingNodeId}
          onClose={handleCloseMarkdownEditor}
        />
      )}
    </div>
  );
}

export default App;
