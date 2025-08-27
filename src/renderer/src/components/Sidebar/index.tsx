import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import './style.css';

export const Sidebar: React.FC<{ onOpenMarkdownEditor: (nodeId: string) => void }> = ({ onOpenMarkdownEditor }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('Sidebar must be used within an AppProvider');
  }

  const { state, updateNodeData, navigateToHistory, selectedNodeId, isSidebarOpen, setIsSidebarOpen } = context;
  const currentGraph = state.graphs[state.currentGraphId];

  const selectedNode = selectedNodeId
    ? currentGraph?.nodes.find((node) => node.id === selectedNodeId)
    : null;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedNodeId) {
      updateNodeData(selectedNodeId, { title: e.target.value });
    }
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    if (selectedNodeId) {
      updateNodeData(selectedNodeId, { description: e.target.value });
    }
  };

  const handleGoBack = () => {
    if (state.history.length > 1) {
      navigateToHistory(state.history.length - 2);
    }
  };

  return (
    <div className={`sidebar-wrapper ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
      <aside className="sidebar-container">
        <div className="sidebar-header">
          <button onClick={handleGoBack} disabled={state.history.length <= 1}>
            Back
          </button>
          <h3>Node Details</h3>
        </div>
        {/* Debugging information */}
        <div className="debug-info">
          <p>Current Graph ID: {state.currentGraphId}</p>
          <p>Nodes in Current Graph: {currentGraph?.nodes.length || 0}</p>
        </div>
        {/* End Debugging information */}
        {selectedNode ? (
          <div className="node-details">
            <p className="modification-disabled-message">Modification of node properties is disabled. Use the "Add Text" button to edit node content.</p>
            <button
              onClick={() => selectedNodeId && onOpenMarkdownEditor(selectedNodeId)}
            >
              Aggiungi Testo
            </button>
          </div>
        ) : (
          <p className="no-node-selected">Select a node to see its details.</p>
        )}
      </aside>
    </div>
  );
};

export default Sidebar;