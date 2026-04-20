import { create } from 'zustand';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import type { Edge, Node, OnConnect, OnEdgesChange, OnNodesChange } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import { createNode } from '../components/nodes';
import { workflowTemplates } from '../templates/workflowTemplates';
import type {
  NodeType,
  NodeVersionEntry,
  SimulationResult,
  WorkflowJson,
  WorkflowNodeData,
} from '../types/workflow';

type NodeValidationIssues = Record<string, string[]>;

type WorkflowSnapshot = {
  nodes: Node[];
  edges: Edge[];
  nodeHistory: Record<string, NodeVersionEntry[]>;
};

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
  nodeHistory: Record<string, NodeVersionEntry[]>;
  past: WorkflowSnapshot[];
  future: WorkflowSnapshot[];

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
  getNodeValidationIssues: () => NodeValidationIssues;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  exportWorkflow: () => WorkflowJson;
  importWorkflow: (payload: unknown) => { success: boolean; message: string };
  applyAutoLayout: () => void;
  loadTemplate: (templateId: string) => boolean;

  clearWorkflow: () => void;
}

const HISTORY_LIMIT = 80;

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  simulationResult: null,
  isSimulating: false,
  nodeHistory: {},
  past: [],
  future: [],

  onNodesChange: (changes) => {
    const shouldRecord = changes.some((change) => change.type !== 'select');
    if (shouldRecord) {
      pushSnapshot(set, get);
    }

    const nextNodes = applyNodeChanges(changes, get().nodes) as Node[];
    const selectedId = get().selectedNode?.id;
    set({
      nodes: nextNodes,
      selectedNode: selectedId ? nextNodes.find((node) => node.id === selectedId) || null : null,
    });
  },

  onEdgesChange: (changes) => {
    const shouldRecord = changes.some((change) => change.type !== 'select');
    if (shouldRecord) {
      pushSnapshot(set, get);
    }

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

    pushSnapshot(set, get);

    set({
      edges: addEdge({ ...connection, id: uuidv4() }, get().edges),
    });
  },

  addNode: (type: NodeType, position) => {
    pushSnapshot(set, get);

    const newNode = createNode(type, position);
    const nextHistory = appendNodeHistory(get().nodeHistory, newNode.id, newNode.data as WorkflowNodeData, 1);

    set({
      nodes: [...get().nodes, newNode],
      selectedNode: newNode,
      nodeHistory: nextHistory,
    });
  },

  updateNodeData: (nodeId: string, data: Record<string, unknown>) => {
    pushSnapshot(set, get);

    let updatedNodeData: WorkflowNodeData | null = null;

    const nextNodes = get().nodes.map((node) => {
      if (node.id !== nodeId) {
        return node;
      }

      const mergedData = { ...node.data, ...data } as WorkflowNodeData;
      updatedNodeData = mergedData;

      return {
        ...node,
        data: mergedData,
      };
    });

    const nextHistory = updatedNodeData
      ? appendNodeHistory(get().nodeHistory, nodeId, updatedNodeData)
      : get().nodeHistory;

    set({
      nodes: nextNodes,
      nodeHistory: nextHistory,
      selectedNode: get().selectedNode?.id === nodeId
        ? nextNodes.find((node) => node.id === nodeId) || null
        : get().selectedNode,
    });
  },

  deleteSelected: () => {
    const { nodes, edges, selectedNode, nodeHistory } = get();
    if (!selectedNode) return;

    pushSnapshot(set, get);

    const nodeId = selectedNode.id;
    const nextHistory = { ...nodeHistory };
    delete nextHistory[nodeId];

    set({
      nodes: nodes.filter((node) => node.id !== nodeId),
      edges: edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNode: null,
      nodeHistory: nextHistory,
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
    const { errors } = analyzeWorkflow(get().nodes, get().edges);
    return errors;
  },

  getNodeValidationIssues: () => {
    const { nodeIssues } = analyzeWorkflow(get().nodes, get().edges);
    return nodeIssues;
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) {
      return;
    }

    const currentSnapshot = captureSnapshot(get());
    const previousSnapshot = past[past.length - 1];

    set({
      nodes: deepClone(previousSnapshot.nodes),
      edges: deepClone(previousSnapshot.edges),
      nodeHistory: deepClone(previousSnapshot.nodeHistory),
      selectedNode: null,
      past: past.slice(0, -1),
      future: [...future, currentSnapshot],
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) {
      return;
    }

    const currentSnapshot = captureSnapshot(get());
    const nextSnapshot = future[future.length - 1];

    set({
      nodes: deepClone(nextSnapshot.nodes),
      edges: deepClone(nextSnapshot.edges),
      nodeHistory: deepClone(nextSnapshot.nodeHistory),
      selectedNode: null,
      past: [...past, currentSnapshot],
      future: future.slice(0, -1),
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  exportWorkflow: () => {
    const { nodes, edges } = get();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      nodes: nodes.map((node) => ({
        id: node.id,
        type: asNodeType(node.type),
        data: (node.data || {}) as WorkflowNodeData,
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    };
  },

  importWorkflow: (payload) => {
    const parsed = parseWorkflowPayload(payload);
    if (!parsed.success) {
      return { success: false, message: parsed.message };
    }

    pushSnapshot(set, get);

    const nodeHistory = buildHistoryFromNodes(parsed.nodes);

    set({
      nodes: parsed.nodes,
      edges: parsed.edges,
      nodeHistory,
      selectedNode: null,
      simulationResult: null,
    });

    return { success: true, message: `Imported ${parsed.nodes.length} node(s)` };
  },

  applyAutoLayout: () => {
    const { nodes, edges } = get();
    if (nodes.length === 0) {
      return;
    }

    pushSnapshot(set, get);

    const relayouted = computeAutoLayout(nodes, edges);
    const selectedId = get().selectedNode?.id;

    set({
      nodes: relayouted,
      selectedNode: selectedId ? relayouted.find((node) => node.id === selectedId) || null : null,
    });
  },

  loadTemplate: (templateId: string) => {
    const template = workflowTemplates.find((item) => item.id === templateId);
    if (!template) {
      return false;
    }

    pushSnapshot(set, get);

    const suffix = Date.now().toString();
    const idMap = new Map<string, string>();

    const nodes = template.nodes.map((node) => {
      const nextId = `${node.id}-${suffix}`;
      idMap.set(node.id, nextId);

      return {
        ...deepClone(node),
        id: nextId,
      };
    });

    const edges = template.edges.map((edge) => ({
      ...deepClone(edge),
      id: `${edge.id}-${suffix}`,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
    }));

    set({
      nodes,
      edges,
      nodeHistory: buildHistoryFromNodes(nodes),
      selectedNode: null,
      simulationResult: null,
    });

    return true;
  },

  clearWorkflow: () => {
    pushSnapshot(set, get);

    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      simulationResult: null,
      nodeHistory: {},
    });
  },
}));

function pushSnapshot(
  set: (partial: Partial<WorkflowState>) => void,
  get: () => WorkflowState
) {
  const snapshot = captureSnapshot(get());
  const nextPast = [...get().past, snapshot];
  const trimmedPast = nextPast.length > HISTORY_LIMIT ? nextPast.slice(nextPast.length - HISTORY_LIMIT) : nextPast;

  set({
    past: trimmedPast,
    future: [],
  });
}

function captureSnapshot(state: Pick<WorkflowState, 'nodes' | 'edges' | 'nodeHistory'>): WorkflowSnapshot {
  return {
    nodes: deepClone(state.nodes),
    edges: deepClone(state.edges),
    nodeHistory: deepClone(state.nodeHistory),
  };
}

function appendNodeHistory(
  current: Record<string, NodeVersionEntry[]>,
  nodeId: string,
  data: WorkflowNodeData,
  forcedRevision?: number
) {
  const history = current[nodeId] || [];
  const revision = forcedRevision || history.length + 1;

  return {
    ...current,
    [nodeId]: [
      ...history,
      {
        revision,
        changedAt: new Date().toISOString(),
        data: deepClone(data),
      },
    ],
  };
}

function buildHistoryFromNodes(nodes: Node[]) {
  const history: Record<string, NodeVersionEntry[]> = {};

  nodes.forEach((node) => {
    history[node.id] = [
      {
        revision: 1,
        changedAt: new Date().toISOString(),
        data: deepClone((node.data || {}) as WorkflowNodeData),
      },
    ];
  });

  return history;
}

function analyzeWorkflow(nodes: Node[], edges: Edge[]) {
  const errors: string[] = [];
  const nodeIssues: NodeValidationIssues = {};

  const addNodeIssue = (nodeId: string, issue: string) => {
    if (!nodeIssues[nodeId]) {
      nodeIssues[nodeId] = [];
    }
    if (!nodeIssues[nodeId].includes(issue)) {
      nodeIssues[nodeId].push(issue);
    }
   };

  if (nodes.length === 0) {
    return {
      errors: ['Add at least one node to start building a workflow'],
      nodeIssues,
    };
  }

  const startNodes = nodes.filter((node) => node.type === 'start');
  if (startNodes.length === 0) {
    errors.push('Workflow must have a Start node');
  } else if (startNodes.length > 1) {
    errors.push('Workflow can only have one Start node');
    startNodes.forEach((node) => addNodeIssue(node.id, 'Only one Start node allowed'));
  }

  const endNodes = nodes.filter((node) => node.type === 'end');
  if (endNodes.length === 0) {
    errors.push('Workflow must have an End node');
  }

  const orphanNodes = nodes.filter((node) => {
    if (node.type === 'start') {
      return false;
    }

    const hasIncoming = edges.some((edge) => edge.target === node.id);
    return !hasIncoming;
  });

  if (orphanNodes.length > 0) {
    errors.push(`${orphanNodes.length} node(s) have no incoming connections`);
    orphanNodes.forEach((node) => addNodeIssue(node.id, 'Missing incoming connection'));
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
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
      addNodeIssue(sourceNode.id, 'End node cannot have outgoing edges');
    }

    if (targetNode?.type === 'start') {
      errors.push('Start node must be the first step and cannot have incoming connections');
      addNodeIssue(targetNode.id, 'Start node cannot have incoming edges');
    }
  });

  const cycleNodes = detectCycleNodes(nodes.map((node) => node.id), edges);
  if (cycleNodes.size > 0) {
    errors.push('Workflow contains cycle(s). Use a directed acyclic flow for simulation');
    cycleNodes.forEach((nodeId) => addNodeIssue(nodeId, 'Node participates in a cycle'));
  }

  if (startNodes.length === 1) {
    const reachable = findReachableNodes(startNodes[0].id, edges);
    const unreachableNodes = nodes.filter((node) => !reachable.has(node.id));

    if (unreachableNodes.length > 0) {
      errors.push(`${unreachableNodes.length} node(s) are not reachable from Start node`);
      unreachableNodes.forEach((node) => addNodeIssue(node.id, 'Not reachable from Start')); 
    }
  }

  return {
    errors: Array.from(new Set(errors)),
    nodeIssues,
  };
}

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

function detectCycleNodes(nodeIds: string[], edges: Edge[]) {
  const adjacency = new Map<string, string[]>();
  nodeIds.forEach((id) => adjacency.set(id, []));
  edges.forEach((edge) => {
    if (adjacency.has(edge.source)) {
      adjacency.get(edge.source)!.push(edge.target);
    }
  });

  const visited = new Set<string>();
  const inPath = new Set<string>();
  const cycleNodes = new Set<string>();

  const dfs = (nodeId: string): boolean => {
    if (inPath.has(nodeId)) {
      cycleNodes.add(nodeId);
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    inPath.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    let foundCycle = false;

    neighbors.forEach((next) => {
      if (dfs(next)) {
        cycleNodes.add(nodeId);
        foundCycle = true;
      }
    });

    inPath.delete(nodeId);
    return foundCycle;
  };

  nodeIds.forEach((nodeId) => {
    if (!visited.has(nodeId)) {
      dfs(nodeId);
    }
  });

  return cycleNodes;
}

function computeAutoLayout(nodes: Node[], edges: Edge[]) {
  const outgoing = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  nodes.forEach((node) => {
    outgoing.set(node.id, []);
    indegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    if (!outgoing.has(edge.source) || !indegree.has(edge.target)) {
      return;
    }

    outgoing.get(edge.source)!.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
  });

  const startNode = nodes.find((node) => node.type === 'start');
  const queue: string[] = startNode ? [startNode.id] : nodes.filter((node) => (indegree.get(node.id) || 0) === 0).map((node) => node.id);

  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
  }

  const layerMap = new Map<string, number>();
  queue.forEach((nodeId) => layerMap.set(nodeId, 0));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const currentLayer = layerMap.get(current) || 0;
    (outgoing.get(current) || []).forEach((next) => {
      const nextLayer = Math.max(layerMap.get(next) || 0, currentLayer + 1);
      layerMap.set(next, nextLayer);

      const nextIndegree = (indegree.get(next) || 0) - 1;
      indegree.set(next, nextIndegree);
      if (nextIndegree <= 0) {
        queue.push(next);
      }
    });
  }

  let fallbackLayer = Math.max(...Array.from(layerMap.values(), (value) => value), 0) + 1;
  nodes.forEach((node) => {
    if (!layerMap.has(node.id)) {
      layerMap.set(node.id, fallbackLayer);
      fallbackLayer += 1;
    }
  });

  const grouped = new Map<number, string[]>();
  layerMap.forEach((layer, nodeId) => {
    if (!grouped.has(layer)) {
      grouped.set(layer, []);
    }
    grouped.get(layer)!.push(nodeId);
  });

  const HORIZONTAL_GAP = 230;
  const VERTICAL_GAP = 130;
  const START_X = 96;
  const START_Y = 96;

  const nextNodes = nodes.map((node) => {
    const layer = layerMap.get(node.id) || 0;
    const nodeIds = grouped.get(layer) || [];
    const rowIndex = nodeIds.indexOf(node.id);

    return {
      ...node,
      position: {
        x: START_X + layer * HORIZONTAL_GAP,
        y: START_Y + Math.max(rowIndex, 0) * VERTICAL_GAP,
      },
    };
  });

  return nextNodes;
}

function parseWorkflowPayload(payload: unknown): { success: boolean; message: string; nodes: Node[]; edges: Edge[] } {
  if (!payload || typeof payload !== 'object') {
    return { success: false, message: 'Invalid JSON payload', nodes: [], edges: [] };
  }

  const maybeNodes = (payload as { nodes?: unknown }).nodes;
  const maybeEdges = (payload as { edges?: unknown }).edges;

  if (!Array.isArray(maybeNodes) || !Array.isArray(maybeEdges)) {
    return { success: false, message: 'Payload must include nodes[] and edges[]', nodes: [], edges: [] };
  }

  const nodes: Node[] = [];
  for (const item of maybeNodes) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const id = (item as { id?: unknown }).id;
    const type = (item as { type?: unknown }).type;
    if (typeof id !== 'string' || typeof type !== 'string' || !isNodeType(type)) {
      continue;
    }

    const data = (item as { data?: unknown }).data;
    const position = (item as { position?: { x?: unknown; y?: unknown } }).position;

    nodes.push({
      id,
      type,
      data: typeof data === 'object' && data ? data as Record<string, unknown> : {},
      position: {
        x: typeof position?.x === 'number' ? position.x : 120,
        y: typeof position?.y === 'number' ? position.y : 120,
      },
    });
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: Edge[] = [];
  for (const item of maybeEdges) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const source = (item as { source?: unknown }).source;
    const target = (item as { target?: unknown }).target;
    if (typeof source !== 'string' || typeof target !== 'string') {
      continue;
    }

    if (!nodeIds.has(source) || !nodeIds.has(target)) {
      continue;
    }

    const id = (item as { id?: unknown }).id;
    edges.push({
      id: typeof id === 'string' ? id : uuidv4(),
      source,
      target,
    });
  }

  if (nodes.length === 0) {
    return { success: false, message: 'Import payload contains no valid nodes', nodes: [], edges: [] };
  }

  return { success: true, message: 'Workflow imported', nodes, edges };
}

function isNodeType(type: string): type is NodeType {
  return ['start', 'task', 'approval', 'automatedStep', 'end'].includes(type);
}

function asNodeType(type: string | undefined): NodeType {
  return type && isNodeType(type) ? type : 'task';
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}
