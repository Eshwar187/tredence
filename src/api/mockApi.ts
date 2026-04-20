import type {
  AutomationAction,
  SimulationResult,
  SimulationStep,
  WorkflowEdgeSnapshot,
  WorkflowNodeSnapshot,
  WorkflowSimulationRequest,
} from '../types/workflow';

const mockActions: AutomationAction[] = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject'] },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
  { id: 'send_slack', label: 'Send Slack Message', params: ['channel', 'message'] },
  { id: 'create_calendar', label: 'Create Calendar Event', params: ['title', 'date', 'duration'] },
  { id: 'update_database', label: 'Update Database', params: ['table', 'field', 'value'] },
  { id: 'webhook', label: 'Call Webhook', params: ['url', 'method', 'payload'] },
];

export async function getAutomations(): Promise<AutomationAction[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockActions;
}

export async function getAutomationById(id: string): Promise<AutomationAction | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return mockActions.find((a) => a.id === id);
}

export async function simulateWorkflow(request: WorkflowSimulationRequest): Promise<SimulationResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const { nodes, edges } = request;
  const errors = validateSimulationPayload(nodes, edges);
  if (errors.length > 0) {
    return {
      success: false,
      steps: [],
      errors,
    };
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!outgoing.has(edge.source)) {
      outgoing.set(edge.source, []);
    }
    outgoing.get(edge.source)!.push(edge.target);
  });

  const startNode = nodes.find((node) => node.type === 'start');
  if (!startNode) {
    return {
      success: false,
      steps: [],
      errors: ['No Start node found in simulation payload'],
    };
  }

  const orderedNodeIds = breadthFirstTraversal(startNode.id, outgoing);
  const steps: SimulationStep[] = [];
  const now = new Date();

  for (let i = 0; i < orderedNodeIds.length; i++) {
    const node = nodeMap.get(orderedNodeIds[i]);
    if (!node) {
      continue;
    }
    const stepTime = new Date(now.getTime() + i * 200);

    steps.push({
      step: i + 1,
      nodeId: node.id,
      nodeLabel: node.data?.label || node.type,
      status: 'success',
      message: getStatusMessage(node.type),
      timestamp: stepTime.toISOString(),
    });
  }

  return {
    success: true,
    steps,
  };
}

function getStatusMessage(type: WorkflowNodeSnapshot['type']): string {
  const messages: Record<WorkflowNodeSnapshot['type'], string> = {
    start: 'Workflow initiated',
    task: 'Task queued for human completion',
    approval: 'Approval rule evaluated',
    automatedStep: 'Automation action executed',
    end: 'Workflow completed',
  };

  return messages[type];
}

function breadthFirstTraversal(startId: string, outgoing: Map<string, string[]>) {
  const queue: string[] = [startId];
  const visited = new Set<string>();
  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);
    ordered.push(current);

    (outgoing.get(current) || []).forEach((next) => {
      if (!visited.has(next)) {
        queue.push(next);
      }
    });
  }

  return ordered;
}

function validateSimulationPayload(nodes: WorkflowNodeSnapshot[], edges: WorkflowEdgeSnapshot[]) {
  const errors: string[] = [];

  if (nodes.length < 2) {
    errors.push('Workflow needs at least 2 nodes for simulation');
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const startNodeCount = nodes.filter((node) => node.type === 'start').length;
  const endNodeCount = nodes.filter((node) => node.type === 'end').length;

  if (startNodeCount !== 1) {
    errors.push('Simulation payload must contain exactly one Start node');
  }

  if (endNodeCount < 1) {
    errors.push('Simulation payload must contain at least one End node');
  }

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push(`Invalid edge ${edge.source} -> ${edge.target}`);
    }
  });

  return errors;
}