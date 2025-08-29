import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import './style.css';

export const NodeModifier: React.FC<{ onOpenMarkdownEditor: (nodeId: string) => void }> = ({ onOpenMarkdownEditor }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('Sidebar must be used within an AppProvider');
  }

  const { state, updateNodeData, navigateToHistory, selectedNodeId, isNodeModifierOpen } = context;
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
    <div className={`sidebar-wrapper ${isNodeModifierOpen ? 'open' : ''}`}>
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
            <div className="node-field">
              <label>Emoji:</label>
              <button onClick={() => {
                console.log('Toggling emoji picker. Current state:', showEmojiPicker);
                setShowEmojiPicker(!showEmojiPicker);
              }}>
                {selectedNode.data.emoji || 'Select Emoji'}
              </button>
              {console.log('Emoji picker visibility state:', showEmojiPicker)}
              {showEmojiPicker && (
                <div className="emoji-picker-container">
                  <EmojiPicker
                    onEmojiClick={(emojiData: EmojiClickData) => {
                      if (selectedNodeId) {
                        updateNodeData(selectedNodeId, { emoji: emojiData.emoji });
                      }
                      setShowEmojiPicker(false);
                    }}
                    theme={Theme.DARK}
                  />
                </div>
              )}
            </div>
            <div className="node-field">
              <label>Name:</label>
              <input
                type="text"
                value={selectedNode.data.title}
                onChange={handleTitleChange}
                placeholder="Node name"
              />
            </div>
            <div className="node-field">
              <label>Description:</label>
              <textarea
                value={selectedNode.data.description || ''}
                onChange={handleDescriptionChange}
                placeholder="Node description"
              />
            </div>
            <div className="node-field">
              <label>Color:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {['#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#28B463', '#AF7AC5', '#F39C12', '#EBEDEF'].map(colorOption => (
                  <div
                    key={colorOption}
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: colorOption,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: selectedNode?.data.color === colorOption ? '2px solid var(--accent-color)' : '1px solid #ccc',
                      boxShadow: selectedNode?.data.color === colorOption ? '0 0 0 2px rgba(0, 123, 255, 0.5)' : 'none',
                    }}
                    onClick={() => updateNodeData(selectedNodeId, { color: colorOption })}
                  />
                ))}
              </div>
            </div>
            <button
              className="edit-content-button"
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

export default NodeModifier;