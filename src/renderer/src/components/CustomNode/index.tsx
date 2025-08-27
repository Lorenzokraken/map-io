import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { MindNodeData } from '../../types';
import './style.css';

const CustomNode: React.FC<{ data: MindNodeData; selected: boolean }> = ({ data, selected }) => {
  const hasSubgraph = !!data.subgraphId;

  const nodeStyle = {
    borderLeft: `5px solid ${data.color || 'var(--border-color)'}`,
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
      <Handle
        type="source"
        position={Position.Bottom}
        className="custom-handle"
      />
    </div>
  );
};

export default memo(CustomNode);
