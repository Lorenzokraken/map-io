export const tools = [
  {
    type: 'function',
    function: {
      name: 'add_node',
      description: 'Adds a new node to the mind map.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The title of the new node.',
          },
          parentNodeId: {
            type: 'string',
            description: 'The ID of the parent node to connect the new node to. If not provided, it will be connected to the root node of the current graph.',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_node',
      description: 'Updates the data of an existing node.',
      parameters: {
        type: 'object',
        properties: {
          nodeId: {
            type: 'string',
            description: 'The ID of the node to update.',
          },
          newTitle: {
            type: 'string',
            description: 'The new title for the node.',
          },
        },
        required: ['nodeId', 'newTitle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_node',
      description: 'Deletes a node from the mind map.',
      parameters: {
        type: 'object',
        properties: {
          nodeId: {
            type: 'string',
            description: 'The ID of the node to delete.',
          },
        },
        required: ['nodeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_nodes',
      description: 'Lists all the nodes in the current graph.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];
