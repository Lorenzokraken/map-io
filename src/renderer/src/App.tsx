import { useState, useContext } from 'react';
import Toolbar from './components/Toolbar';
import GraphView from './components/GraphView';
import { Sidebar } from './components/Sidebar';
import MarkdownEditor from './components/MarkdownEditor'; // Will create this soon
import { AppContext } from './context/AppContext'; // Import AppContext

function App(): JSX.Element {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null); // New state
  const { selectedNodeId } = useContext(AppContext); // Get selectedNodeId from AppContext

  const handleOpenMarkdownEditor = (nodeId: string) => {
    setEditingNodeId(nodeId);
  };

  const handleCloseMarkdownEditor = () => {
    setEditingNodeId(null);
  };

  return (
    <div className="app-container">
      <Toolbar />
      <main className={`main-content ${!selectedNodeId ? 'main-content-full-width' : ''}`}>
        <GraphView />
        {selectedNodeId && ( // Conditionally render Sidebar
          <Sidebar
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
