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
import { tools } from '../lib/tools';

// Define Chat Message Type
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

const rootGraphId = uuidv4();
const rootNodeId = 'tuonome'; // Changed to match map_main.json

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
  addNodeAndEdge: (title: string, parentNodeId?: string) => void;
  updateNodeData: (nodeId: string, data: Partial<MindNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  listNodes: () => string;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodesDelete: (nodes: MindNode[]) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isNodeModifierOpen: boolean; // Added for NodeModifier sidebar
  setIsNodeModifierOpen: React.Dispatch<React.SetStateAction<boolean>>; // Added for NodeModifier sidebar
  messages: ChatMessage[]; // Added chat messages state
  isChatLoading: boolean; // Added chat loading state
  sendMessage: (message: string) => Promise<void>; // Added sendMessage function
  models: any[]; // Added models state
  selectedModel: string; // Added selectedModel state
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>; // Added setSelectedModel function
}>({
  state: defaultInitialState,
  setState: () => {},
  navigateToGraph: () => {},
  navigateToHistory: () => {},
  addNodeAndEdge: () => {},
  updateNodeData: () => {},
  deleteNode: () => {},
  listNodes: () => '',
  onNodesChange: () => {},
  onEdgesChange: () => {},
  onConnect: () => {},
  onNodesDelete: () => {},
  selectedNodeId: null,
  setSelectedNodeId: () => {},
  isSidebarOpen: false,
  setIsSidebarOpen: () => {},
  isNodeModifierOpen: false, // Initial state for NodeModifier sidebar
  setIsNodeModifierOpen: () => {},
  messages: [], // Initial empty chat messages
  isChatLoading: false, // Initial chat loading state
  sendMessage: async () => {}, // Placeholder sendMessage function
  models: [], // Initial empty models
  selectedModel: 'google/gemini-2.5-flash-image-preview:free', // Initial selected model
  setSelectedModel: () => {}, // Placeholder setSelectedModel function
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultInitialState);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isNodeModifierOpen, setIsNodeModifierOpen] = useState<boolean>(false); // New state for NodeModifier
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Chat messages state
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false); // Chat loading state
  const [userName, setUserName] = useState<string | null>(null); // Added userName state
  const [userMapContext, setUserMapContext] = useState<string | null>(null); // Added userMapContext state
  const [models, setModels] = useState<any[]>([]); // Added models state
  const [selectedModel, setSelectedModel] = useState<string>('google/gemini-2.5-flash-image-preview:free'); // Added selectedModel state
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to clean React Flow specific node properties
  const cleanNodeProperties = useCallback((nodes: MindNode[]): MindNode[] => {
    return nodes.map(node => {
      const newNode = { ...node };
      // Remove React Flow specific properties that are often re-calculated
      delete (newNode as any).width;
      delete (newNode as any).height;
      delete (newNode as any).selected;
      delete (newNode as any).dragging;
      delete (newNode as any).positionAbsolute;
      return newNode;
    });
  }, []);

  const buildGraphContextString = useCallback((
    startNodeId: string,
    allNodes: MindNode[],
    allEdges: { id: string; source: string; target: string }[],
    allGraphs: { [key: string]: Graph },
    currentDepth: number = 0,
    maxDepth: number = 10,
    visitedNodes: Set<string> = new Set()
  ): string => {
    if (currentDepth > maxDepth || visitedNodes.has(startNodeId)) {
      return '';
    }

    const node = allNodes.find(n => n.id === startNodeId);
    if (!node) {
      return '';
    }

    visitedNodes.add(startNodeId);

    let contextParts: string[] = [];
    contextParts.push(`Node "${node.data.title}" (ID: ${node.id})`);

    if (node.data.subgraphId && allGraphs[node.data.subgraphId]) {
      const subgraph = allGraphs[node.data.subgraphId];
      const subgraphRootNode = subgraph.nodes.find(n => n.id === subgraph.rootNodeId);
      if (subgraphRootNode) {
        const subContext = buildGraphContextString(
          subgraph.rootNodeId,
          subgraph.nodes,
          subgraph.edges,
          allGraphs,
          currentDepth, // Keep the same depth for the subgraph root
          maxDepth,
          visitedNodes
        );
        if (subContext) {
          contextParts.push(`has a subgraph: [${subContext}]`);
        }
      }
    } else {
      const childEdges = allEdges.filter(edge => edge.source === node.id);
      if (childEdges.length > 0) {
        const childNodeIds = childEdges.map(edge => edge.target);
        const childNodes = allNodes.filter(n => childNodeIds.includes(n.id));

        if (childNodes.length > 0) {
          contextParts.push(`has children: ${childNodes.map(child => `"${child.data.title}" (ID: ${child.id})`).join(', ')}.`);
          childNodes.forEach(child => {
            const subContext = buildGraphContextString(child.id, allNodes, allEdges, allGraphs, currentDepth + 1, maxDepth, visitedNodes);
            if (subContext) {
              contextParts.push(subContext);
            }
          });
        }
      }
    }
    return contextParts.join('; ');
  }, []);

  // Effect for initial data loading
  useEffect(() => {
    if (window.api) {
      window.api.onInitialData((initialData: AppState) => {
        console.log('Renderer: Received initial-data:', initialData);
        if (initialData && Object.keys(initialData.graphs).length > 0) {
          // Clean nodes in all graphs
          const cleanedGraphs = Object.fromEntries(
            Object.entries(initialData.graphs).map(([graphId, graph]) => [
              graphId,
              { ...graph, nodes: cleanNodeProperties(graph.nodes) }
            ])
          );
          setState({ ...initialData, graphs: cleanedGraphs });
          console.log('Renderer: State set with initial data (cleaned).');

          // Extract user name and map context from initialData
          const mainGraph = initialData.graphs['main-map'];
          if (mainGraph && mainGraph.nodes && mainGraph.nodes.length > 0) {
            const userNode = mainGraph.nodes.find(node => node.id === 'tuonome');
            if (userNode && userNode.data && userNode.data.title) {
              setUserName(userNode.data.title);
            }
            const rootNode = mainGraph.nodes.find(node => node.id === 'tuonome');
            if (rootNode && rootNode.data && rootNode.data.title) {
              const fullGraphContext = buildGraphContextString(
                rootNode.id,
                mainGraph.nodes,
                mainGraph.edges,
                initialData.graphs,
                0,
                5 // Max depth of 5 for initial context
              );
              setUserMapContext(`My mind map structure: ${fullGraphContext}.`);
            }
          }
        } else {
          setState(defaultInitialState);
          console.log('Renderer: State set with default initial state.');
        }
      });

      return () => {
        window.api.removeInitialDataListener();
      };
    }
  }, [cleanNodeProperties, buildGraphContextString]); // Add cleanNodeProperties and buildGraphContextString to dependencies

  // Effect for fetching models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json();
        const freeModels = data.data.filter((model: any) => model.pricing.prompt === '0' && model.pricing.completion === '0');
        setModels(freeModels);
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    fetchModels();
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
      console.log('navigateToGraph called with graphId:', graphId);
      console.log('Current prevState.graphs:', prevState.graphs);
      if (!prevState.graphs[graphId]) {
        console.error('Graph not found for graphId:', graphId);
        return prevState;
      }
      if (prevState.history.at(-1) === graphId) {
        console.log('Already at this graphId:', graphId);
        return prevState;
      }

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

  const sendMessage = useCallback(async (message: string) => {
    setIsChatLoading(true);
    const userMessage: ChatMessage = { id: uuidv4(), role: 'user', content: message };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Ensure userName is available before sending the message
    if (!userName) {
      console.warn('User name not loaded yet. Cannot send contextual message to AI.');
      setIsChatLoading(false);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: "Sorry, I'm still loading your personal context. Please try again in a moment.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      return;
    }

    try {
      // IMPORTANT: In a production app, load this securely (e.g., from environment variables
      // or a backend service) instead of hardcoding or exposing directly in frontend.
      const OPENROUTER_API_KEY = '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'; // Replace with your actual key

      const messagesToSend = [...messages, { role: 'user', content: message }];

      let contextMessage = `My name is ${userName}.`;
      if (userMapContext) {
        contextMessage += ` ${userMapContext}`;
      }
      messagesToSend.unshift({ role: 'user', content: contextMessage });

      console.log('Messages sent to OpenRouter:', messagesToSend); // Log messagesToSend

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: messagesToSend,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('OpenRouter API successful response:', data);
      const assistantMessageContent = data.choices[0].message.content;
      const assistantMessage: ChatMessage = { id: uuidv4(), role: 'assistant', content: assistantMessageContent };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

    } catch (error) {
      console.error('Error sending message to OpenRouter:', error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I could not get a response from the AI.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  }, [messages, userName, userMapContext, selectedModel]); // Depend on messages, userName, userMapContext and selectedModel

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
        isNodeModifierOpen, // Provide NodeModifier sidebar state to context
        setIsNodeModifierOpen, // Provide NodeModifier sidebar setter to context
        messages, // Provide messages to context
        isChatLoading, // Provide loading state to context
        sendMessage, // Provide sendMessage function to context
        models,
        selectedModel,
        setSelectedModel,
      }}
    >

      {children}
    </AppContext.Provider>
  );
};