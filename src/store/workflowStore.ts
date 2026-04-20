import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import type { NodeType, SimulationResult } from '../types/workflow';
import { createNode } from '../components/nodes';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
  
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
  onConnect: OnConnect;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  deleteSelected: () => void;
  setSelectedNode: (node: Node | null) => void;
  setSimulationResult: (result: SimulationResult | null) => void;
  setIsSimulating: (isSimulating: boolean) => void;
  validateWorkflow: () => string[];
  clearWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  simulationResult: null,
  isSimulating: false,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node[],
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    const { source, target } = connection;
    if (!source || !target || source === target) {
      return;
    }

    const nodes = get().nodes;
    const sourceNode = nodes.find((node) => node.id === source);
    const targetNode = nodes.find((node) => node.id === target);

    if (!sourceNode || !targetNode) {
      return;
    }

    // Prevent invalid structural edges at creation time.
    if (targetNode.type === 'start' || sourceNode.type === 'end') {
      return;
    }

    set({
      edges: addEdge({ ...connection, id: uuidv4() }, get().edges),
    });
  },

  addNode: (type: NodeType, position) => {
    const newNode = createNode(type, position);
    set({
      nodes: [...get().nodes, newNode],
      selectedNode: newNode,
    });
  },

  updateNodeData: (nodeId: string, data: Record<string, unknown>) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
      selectedNode: get().selectedNode?.id === nodeId
        ? { ...get().selectedNode!, data: { ...get().selectedNode!.data, ...data } }
        : get().selectedNode,
    });
  },

  deleteSelected: () => {
    const { nodes, edges, selectedNode } = get();
    if (!selectedNode) return;
    
    const nodeId = selectedNode.id;
    set({
      nodes: nodes.filter((n) => n.id !== nodeId),
      edges: edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: null,
    });
  },

  setSelectedNode: (node) => {
    set({ selectedNode: node });
  },

  setSimulationResult: (result) => {
    set({ simulationResult: result });
  },

  setIsSimulating: (isSimulating) => {
    set({ isSimulating });
  },

  validateWorkflow: () => {
    const { nodes, edges } = get();
    const errors: string[] = [];

    if (nodes.length === 0) {
      return ['Add at least one node to start building a workflow'];
    }
    
    const startNodes = nodes.filter((n) => n.type === 'start');
    if (startNodes.length === 0) {
      errors.push('Workflow must have a Start node');
    } else if (startNodes.length > 1) {
      errors.push('Workflow can only have one Start node');
    }

    const endNodes = nodes.filter((n) => n.type === 'end');
    if (endNodes.length === 0) {
      errors.push('Workflow must have an End node');
    }

    const orphanNodes = nodes.filter((n) => {
      if (n.type === 'start') return false;
      const hasIncoming = edges.some((e) => e.target === n.id);
      return !hasIncoming;
    });
    if (orphanNodes.length > 0) {
      errors.push(`${orphanNodes.length} node(s) have no incoming connections`);
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    edges.forEach((edge) => {
      if (!nodeIds.has(edge.source)) {
        errors.push('Edge references non-existent source node');
      }
      if (!nodeIds.has(edge.target)) {
        errors.push('Edge references non-existent target node');
      }

      const sourceNode = nodes.find((node) => node.id === edge.source);
      const targetNode = nodes.find((node) => node.id === edge.target);
      if (sourceNode?.type === 'end') {
        errors.push('End nodes cannot have outgoing connections');
      }
      if (targetNode?.type === 'start') {
        errors.push('Start node must be the first step and cannot have incoming connections');
      }
    });

    const hasCycle = detectCycle(nodes.map((n) => n.id), edges);
    if (hasCycle) {
      errors.push('Workflow contains cycle(s). Use a directed acyclic flow for simulation');
    }

    if (startNodes.length === 1) {
      const reachable = findReachableNodes(startNodes[0].id, edges);
      const unreachableCount = nodes.filter((node) => !reachable.has(node.id)).length;
      if (unreachableCount > 0) {
        errors.push(`${unreachableCount} node(s) are not reachable from Start node`);
      }
    }

    const duplicateErrors = new Set(errors);

    return Array.from(duplicateErrors);
  },

  clearWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      simulationResult: null,
    });
  },
}));

function findReachableNodes(startNodeId: string, edges: Edge[]) {
  const visited = new Set<string>();
  const queue: string[] = [startNodeId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);
    edges
      .filter((edge) => edge.source === current)
      .forEach((edge) => {
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
        }
      });
  }

  return visited;
}

function detectCycle(nodeIds: string[], edges: Edge[]) {
  const adjacency = new Map<string, string[]>();
  nodeIds.forEach((id) => adjacency.set(id, []));
  edges.forEach((edge) => {
    if (adjacency.has(edge.source)) {
      adjacency.get(edge.source)!.push(edge.target);
    }
  });

  const visited = new Set<string>();
  const inPath = new Set<string>();

  const dfs = (nodeId: string): boolean => {
    if (inPath.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    inPath.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const next of neighbors) {
      if (dfs(next)) {
        return true;
      }
    }

    inPath.delete(nodeId);
    return false;
  };

  for (const nodeId of nodeIds) {
    if (dfs(nodeId)) {
      return true;
    }
  }

  return false;
}