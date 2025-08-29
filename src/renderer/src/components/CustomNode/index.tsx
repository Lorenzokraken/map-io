import React, { memo, useContext } from 'react';
import { Handle, Position } from 'reactflow';
import { MindNodeData } from '../../types';
import { AppContext } from '../../context/AppContext'; // Import AppContext
import Icon from '../Icon'; // Assuming you have an Icon component for the pencil
import './style.css';

const CustomNode: React.FC<{ id: string; data: MindNodeData; selected: boolean }> = ({ id, data, selected }) => {
  const { setSelectedNodeId, setIsNodeModifierOpen } = useContext(AppContext); // Get setSelectedNodeId and setIsNodeModifierOpen from AppContext
  const hasSubgraph = !!data.subgraphId;

  const nodeStyle = {
    borderLeft: `5px solid ${data.color || 'var(--border-color)'}`,
  };

  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent node click from triggering
    setSelectedNodeId(id); // Set this node as selected for modification
    setIsNodeModifierOpen(true); // Open the NodeModifier sidebar
  };

  return (
    <div
      className={`custom-node ${hasSubgraph ? 'has-subgraph' : ''} ${selected ? 'selected' : ''}`}
      style={nodeStyle}
    >
      <Handle type="target" position={Position.Top} className="custom-handle" />
      <div className="node-content">
        <div className="node-title">
          {data.emoji && <span className="node-emoji">{data.emoji}</span>}
          {data.title}
        </div>
        {data.description && (
          <div className="node-description">{data.description}</div>
        )}
      </div>
      {hasSubgraph && <div className="subgraph-indicator">⨠</div>}
      <button className="edit-node-button" onClick={handleEditClick} title="Edit Node">
        <Icon name="pencil" /> {/* Assuming 'pencil' icon exists */}
      </button>
      <Handle
        type="source"
        position={Position.Bottom}
        className="custom-handle"
      />
    </div>
  );
};

export default memo(CustomNode);
