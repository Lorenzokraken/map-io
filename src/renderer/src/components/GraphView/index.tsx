import React, { useContext, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  useReactFlow,
  ReactFlowProvider,
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

const GraphView: React.FC = () => {
  const { state, setState, navigateToGraph, onNodesChange, onEdgesChange, onConnect, onNodesDelete, setSelectedNodeId } = useContext(AppContext);
  const currentGraph = state.graphs[state.currentGraphId];

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: MindNode) => {
      // Ensure currentGraph is defined before proceeding
      if (!currentGraph) {
        return;
      }

      // Prevent navigating if the double-clicked node is the current graph's root node
      if (node.id === currentGraph.rootNodeId) {
        return;
      }

      if (node.data.subgraphId) {
        navigateToGraph(node.data.subgraphId);
      } else {
        const newSubgraphId = uuidv4();

        setState((prevState) => {
          // Creazione del nuovo grafo (sottografo)
          const newRootNode: MindNode = {
            ...node,
            id: `sub-root-${node.id}`,
            position: node.position,
            data: { ...node.data, subgraphId: undefined },
          };
          const newGraph: Graph = {
            id: newSubgraphId,
            nodes: [newRootNode],
            edges: [],
            rootNodeId: newRootNode.id,
          };

          // Aggiornamento immutabile del grafo corrente
          const currentGraph = prevState.graphs[prevState.currentGraphId];
          const updatedNodes = currentGraph.nodes.map((n) =>
            n.id === node.id
              ? { ...n, data: { ...n.data, subgraphId: newSubgraphId } }
              : n,
          );
          const updatedCurrentGraph = { ...currentGraph, nodes: updatedNodes };

          // Aggiornamento dello stato globale
          const updatedGraphs = {
            ...prevState.graphs,
            [prevState.currentGraphId]: updatedCurrentGraph,
            [newSubgraphId]: newGraph,
          };

          return {
            ...prevState,
            graphs: updatedGraphs,
            currentGraphId: newSubgraphId,
            history: [...prevState.history, newSubgraphId],
          };
        });
      }
    },
    [setState, navigateToGraph, currentGraph], // Add currentGraph to dependencies
  );

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      setSelectedNodeId(nodes.length > 0 ? nodes[0].id : null);
    },
    [setSelectedNodeId],
  );

  const { getNodes } = useReactFlow();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete') {
        const selectedNodes = getNodes().filter((node) => node.selected);
        if (selectedNodes.length > 0) {
          onNodesDelete(selectedNodes);
          event.preventDefault(); // Prevent default browser behavior
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
    <div className="graph-view-container">
      <ReactFlow
        nodes={currentGraph.nodes}
        edges={currentGraph.edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick}
        onSelectionChange={onSelectionChange}
        onPaneClick={() => setSelectedNodeId(null)} // Add this line
        nodeTypes={nodeTypes}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

const GraphViewWrapper: React.FC = () => (
  <ReactFlowProvider>
    <GraphView />
  </ReactFlowProvider>
);

export default GraphViewWrapper;
