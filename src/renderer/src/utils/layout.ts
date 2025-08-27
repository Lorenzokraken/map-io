import { MindNode } from '../types';

const RADIUS = 250;
const START_ANGLE = -Math.PI / 2; // Inizia dall'alto

// Funzione pura: non modifica i nodi originali, ma ne restituisce di nuovi.
export const getStarLayoutNodes = (
  nodes: MindNode[],
  rootNodeId?: string,
): MindNode[] => {
  if (nodes.length === 0) {
    return [];
  }

  const rootNodeInInput = rootNodeId
    ? nodes.find((n) => n.id === rootNodeId)
    : nodes[0];

  if (!rootNodeInInput) {
    return nodes.map((n) => ({ ...n })); // Restituisce una copia per sicurezza
  }

  // Crea una copia del nodo radice da modificare
  const rootNode = {
    ...rootNodeInInput,
    position: { x: 0, y: 0 },
  };

  const children = nodes.filter((n) => n.id !== rootNode.id);
  const angleStep = (2 * Math.PI) / Math.max(1, children.length);

  const layoutedChildren = children.map((node, index) => {
    const angle = START_ANGLE + index * angleStep;
    // Crea una copia del nodo figlio da modificare
    return {
      ...node,
      position: {
        x: rootNode.position.x + RADIUS * Math.cos(angle),
        y: rootNode.position.y + RADIUS * Math.sin(angle),
      },
    };
  });

  return [rootNode, ...layoutedChildren];
};
