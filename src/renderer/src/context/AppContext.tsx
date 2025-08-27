import React, { createContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Graph, MindNode, MindNodeData } from '../types';
import {
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  addEdge,
} from 'reactflow';

const rootGraphId = uuidv4();
const rootNodeId = 'lorenzo';

// Posizioni fisse per i nodi iniziali, niente più layout automatico
const initialNodes: MindNode[] = [
  {
    id: rootNodeId,
    position: { x: 0, y: 0 },
    data: { title: 'Lorenzo', color: '#ffc658' },
    type: 'custom',
  },
  {
    id: 'musica',
    position: { x: -200, y: 150 },
    data: { title: '🎵 Musica', color: '#82c9ff' },
    type: 'custom',
  },
  {
    id: 'sviluppo',
    position: { x: 0, y: 150 },
    data: { title: '💻 Sviluppo', color: '#95ff82' },
    type: 'custom',
  },
  {
    id: 'personale',
    position: { x: 200, y: 150 },
    data: { title: '👤 Personale', color: '#ff8282' },
    type: 'custom',
  },
];

const initialGraph: Graph = {
  id: rootGraphId,
  nodes: initialNodes,
  edges: [
    { id: 'e-lorenzo-musica', source: rootNodeId, target: 'musica' },
    { id: 'e-lorenzo-sviluppo', source: rootNodeId, target: 'sviluppo' },
    { id: 'e-lorenzo-personale', source: rootNodeId, target: 'personale' },
  ],
  rootNodeId: rootNodeId,
};

const defaultInitialState: AppState = { // Renamed to avoid conflict with state variable
  graphs: {
    [rootGraphId]: initialGraph,
  },
  currentGraphId: rootGraphId,
  history: [rootGraphId],
  selectedNodeId: null,
};

export const AppContext = createContext<{
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  navigateToGraph: (graphId: string) => void;
  navigateToHistory: (index: number) => void;
  addNodeAndEdge: () => void;
  updateNodeData: (nodeId: string, data: Partial<MindNodeData>) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodesDelete: (nodes: MindNode[]) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  state: defaultInitialState,
  setState: () => {},
  navigateToGraph: () => {},
  navigateToHistory: () => {},
  addNodeAndEdge: () => {},
  updateNodeData: () => {},
  onNodesChange: () => {},
  onEdgesChange: () => {},
  onConnect: () => {},
  onNodesDelete: () => {},
  selectedNodeId: null,
  setSelectedNodeId: () => {},
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>(defaultInitialState);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect for initial data loading
  useEffect(() => {
    if (window.api) {
      window.api.onInitialData((initialData: AppState) => {
        if (initialData && initialData.graphs) {
          setState(initialData);
        } else {
          setState(defaultInitialState);
        }
      });

      return () => {
        window.api.removeInitialDataListener();
      };
    }
  }, []);

  // Effect for autosaving
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (window.api) {
        window.api.autosaveData(JSON.stringify(state));
      }
    }, 1000); // Debounce for 1 second

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [state]); // Depend on the entire state object

  const navigateToGraph = useCallback((graphId: string) => {
    setState((prevState) => {
      if (!prevState.graphs[graphId]) return prevState;
      if (prevState.history.at(-1) === graphId) return prevState;

      return {
        ...prevState,
        currentGraphId: graphId,
        history: [...prevState.history, graphId],
      };
    });
  }, []);

  const navigateToHistory = useCallback((index: number) => {
    setState((prevState) => {
      const newHistory = prevState.history.slice(0, index + 1);
      const newCurrentGraphId = newHistory.at(-1);

      if (!newCurrentGraphId) return prevState;

      return {
        ...prevState,
        currentGraphId: newCurrentGraphId,
        history: newHistory,
      };
    });
  }, []);

  const addNodeAndEdge = useCallback(() => {
    setState((prevState) => {
      const currentGraph = prevState.graphs[prevState.currentGraphId];
      if (!currentGraph.rootNodeId) return prevState;

      const newNode: MindNode = {
        id: uuidv4(),
        position: { x: 0, y: 0 },
        data: { title: 'Nuovo Argomento', color: '#ffffff' },
        type: 'custom',
      };

      const newEdge = {
        id: `e-${currentGraph.rootNodeId}-${newNode.id}`,
        source: currentGraph.rootNodeId,
        target: newNode.id,
      };

      const updatedGraph: Graph = {
        ...currentGraph,
        nodes: [...currentGraph.nodes, newNode],
        edges: [...currentGraph.edges, newEdge],
      };

      return {
        ...prevState,
        graphs: {
          ...prevState.graphs,
          [prevState.currentGraphId]: updatedGraph,
        },
      };
    });
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<MindNodeData>) => {
      setState((prevState) => {
        const currentGraph = prevState.graphs[prevState.currentGraphId];
        if (!currentGraph) return prevState;

        const updatedNodes = currentGraph.nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        });

        const updatedGraph = { ...currentGraph, nodes: updatedNodes };
        const updatedGraphs = {
          ...prevState.graphs,
          [prevState.currentGraphId]: updatedGraph,
        };
        return { ...prevState, graphs: updatedGraphs };
      });
    },
    [],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setState((prevState) => {
        const currentGraph = prevState.graphs[prevState.currentGraphId];
        if (!currentGraph) return prevState;
        const updatedNodes = applyNodeChanges(changes, currentGraph.nodes);
        const updatedGraph = { ...currentGraph, nodes: updatedNodes };
        const updatedGraphs = {
          ...prevState.graphs,
          [prevState.currentGraphId]: updatedGraph,
        };
        return { ...prevState, graphs: updatedGraphs };
      });
    },
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setState((prevState) => {
        const currentGraph = prevState.graphs[prevState.currentGraphId];
        if (!currentGraph) return prevState;
        const updatedEdges = applyEdgeChanges(changes, currentGraph.edges);
        const updatedGraph = { ...currentGraph, edges: updatedEdges };
        const updatedGraphs = {
          ...prevState.graphs,
          [prevState.currentGraphId]: updatedGraph,
        };
        return { ...prevState, graphs: updatedGraphs };
      });
    },
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setState((prevState) => {
        const currentGraph = prevState.graphs[prevState.currentGraphId];
        if (!currentGraph || !currentGraph.rootNodeId) return prevState;

        if (connection.target === currentGraph.rootNodeId) {
          return prevState;
        }

        const targetHasEdge = currentGraph.edges.some(
          (edge) => edge.target === connection.target,
        );
        if (targetHasEdge) {
          return prevState;
        }

        const updatedEdges = addEdge(connection, currentGraph.edges);
        const updatedGraph = { ...currentGraph, edges: updatedEdges };
        const updatedGraphs = {
          ...prevState.graphs,
          [prevState.currentGraphId]: updatedGraph,
        };
        return { ...prevState, graphs: updatedGraphs };
      });
    },
    [],
  );

  const onNodesDelete = useCallback((deletedNodes: MindNode[]) => {
    setState((prevState) => {
      const currentGraph = prevState.graphs[prevState.currentGraphId];
      if (!currentGraph) return prevState;

      const updatedNodes = currentGraph.nodes.filter(
        (node) => !deletedNodes.some((n) => n.id === node.id),
      );
      const updatedEdges = currentGraph.edges.filter(
        (edge) =>
          !deletedNodes.some((node) => node.id === edge.source) &&
          !deletedNodes.some((node) => node.id === edge.target),
      );

      const updatedGraph = {
        ...currentGraph,
        nodes: updatedNodes,
        edges: updatedEdges,
      };

      return {
        ...prevState,
        graphs: {
          ...prevState.graphs,
          [prevState.currentGraphId]: updatedGraph,
        },
      };
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        setState,
        navigateToGraph,
        navigateToHistory,
        addNodeAndEdge,
        updateNodeData,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onNodesDelete,
                selectedNodeId,
        setSelectedNodeId,
        isSidebarOpen,
        setIsSidebarOpen,
      }}
    >

      {children}
    </AppContext.Provider>
  );
};