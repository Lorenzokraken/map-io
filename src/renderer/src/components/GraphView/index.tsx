import React, { useContext, useCallback, useEffect, useRef, useState } from 'react'; // Added useRef, useState
import ReactFlow, {
  Background,
  Controls,
  Node,
  useReactFlow,
  ReactFlowProvider,
  SmoothStepEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../../context/AppContext';
import { MindNode, Graph } from '../../types';
import CustomNode from '../CustomNode';
import './style.css';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  smoothstep: SmoothStepEdge,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { strokeWidth: 2, stroke: 'var(--border-color)' },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: 'var(--border-color)',
  },
};

const GraphView: React.FC = () => {
  const { state, setState, navigateToGraph, onNodesChange, onEdgesChange, onConnect, onNodesDelete, setSelectedNodeId, setIsNodeModifierOpen } = useContext(AppContext);
  const currentGraph = state.graphs[state.currentGraphId];

  const reactFlowWrapper = useRef<HTMLDivElement>(null); // Ref for the container
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 }); // State for dimensions

  // Effect to get dimensions of the React Flow wrapper
  useEffect(() => {
    if (reactFlowWrapper.current) {
      setDimensions({
        width: reactFlowWrapper.current.offsetWidth,
        height: reactFlowWrapper.current.offsetHeight,
      });
    }
  }, []); // Run once on mount

  // Re-calculate dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      if (reactFlowWrapper.current) {
        setDimensions({
          width: reactFlowWrapper.current.offsetWidth,
          height: reactFlowWrapper.current.offsetHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: MindNode) => {
      if (node.data.subgraphId) {
        navigateToGraph(node.data.subgraphId);
      }
    },
    [navigateToGraph],
  );

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      // If no nodes are selected, close the NodeModifier
      if (nodes.length === 0) {
        setSelectedNodeId(null);
        setIsNodeModifierOpen(false);
      } else {
        // If a node is selected, set it as selectedNodeId but don't open NodeModifier yet
        setSelectedNodeId(nodes[0].id);
      }
    },
    [setSelectedNodeId, setIsNodeModifierOpen],
  );

  const { getNodes } = useReactFlow();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete') {
        const selectedNodes = getNodes().filter((node) => node.selected);
        if (selectedNodes.length > 0) {
          onNodesDelete(selectedNodes);
          event.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [getNodes, onNodesDelete]);

  if (!currentGraph) {
    return <div className="graph-view-container">Caricamento grafo...</div>;
  }

  return (
    <div className="graph-view-container" ref={reactFlowWrapper}> {/* Assign ref */}
      {dimensions.width > 0 && dimensions.height > 0 && ( // Conditionally render
        <ReactFlow
          nodes={currentGraph.nodes}
          edges={currentGraph.edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={handleNodeDoubleClick} // Use double click for opening NodeModifier
          onSelectionChange={onSelectionChange}
          onPaneClick={() => {
            setSelectedNodeId(null);
            setIsNodeModifierOpen(false);
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
        >
          <Background />
          <Controls />
        </ReactFlow>
      )}
    </div>
  );
};

const GraphViewWrapper: React.FC = () => (
  <ReactFlowProvider>
    <GraphView />
  </ReactFlowProvider>
);

export default GraphViewWrapper;
