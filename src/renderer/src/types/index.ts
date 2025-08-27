import { Node, Edge } from 'reactflow';

// Dati specifici dell'applicazione contenuti in un nodo
export interface MindNodeData {
  title: string;
  description?: string;
  
  color?: string;
  subgraphId?: string; // ID del grafo che questo nodo apre
  markdownContent?: string; // New field for Markdown content
  emoji?: string; // Added for emoji selection
}

// Estende il tipo Node di React Flow con i nostri dati custom
export type MindNode = Node<MindNodeData>;

// Il tipo Edge rimane standard per ora
export type MindEdge = Edge;

// Rappresenta un grafo completo, che sia quello principale o un sottografo
export interface Graph {
  id: string;
  nodes: MindNode[];
  edges: MindEdge[];
  rootNodeId?: string; // ID del nodo radice/centrale del grafo
}

// Lo stato globale dell'applicazione conterrà una collezione di grafi.
// La chiave è l'ID del grafo.
export interface AppState {
  graphs: Record<string, Graph>;
  currentGraphId: string; // L'ID del grafo attualmente visualizzato
  history: string[]; // Per la navigazione "back"
}

