import { useState, useContext } from 'react';
import Toolbar from './components/Toolbar';
import GraphView from './components/GraphView';
import { NodeModifier } from './components/Sidebar'; // Node modification floating window
import MarkdownEditor from './components/MarkdownEditor'; // Will create this soon
import { AppContext } from './context/AppContext'; // Import AppContext
import ChatSidebar from './components/Chat/ChatSidebar';

function App(): JSX.Element {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null); // New state
  const { selectedNodeId, isSidebarOpen, setIsSidebarOpen, messages, isChatLoading, sendMessage, state, navigateToHistory, isNodeModifierOpen } = useContext(AppContext); // Get selectedNodeId, sidebar state, and chat states from AppContext

  const handleOpenMarkdownEditor = (nodeId: string) => {
    setEditingNodeId(nodeId);
  };

  const handleCloseMarkdownEditor = () => {
    setEditingNodeId(null);
  };

  return (
    <div className="app-container">
      <Toolbar />
      <div className="content-wrapper">
        <main className={`main-content ${isSidebarOpen ? 'main-content-with-sidebar' : ''}`}>
          <GraphView />
        </main>
        {isSidebarOpen && (
          <ChatSidebar messages={messages} onSendMessage={sendMessage} isThinking={isChatLoading} className="chat-sidebar" isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        )}
      </div>
      {isNodeModifierOpen && ( // Conditionally render NodeModifier as floating window
        <NodeModifier
          onOpenMarkdownEditor={handleOpenMarkdownEditor} // Pass handler
        />
      )}
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
