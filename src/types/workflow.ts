export type NodeType = 'start' | 'task' | 'approval' | 'automatedStep' | 'end';

export interface BaseNodeData {
  label: string;
  [key: string]: unknown;
}

export type KeyValueMap = Record<string, string>;

export interface StartNodeData extends BaseNodeData {
  metadata?: KeyValueMap;
}

export interface TaskNodeData extends BaseNodeData {
  description?: string;
  assignee?: string;
  dueDate?: string;
  customFields?: KeyValueMap;
}

export interface ApprovalNodeData extends BaseNodeData {
  description?: string;
  approverRole?: string;
  autoApproveThreshold?: number;
}

export interface AutomatedStepNodeData extends BaseNodeData {
  actionId?: string;
  actionParams?: KeyValueMap;
}

export interface EndNodeData extends BaseNodeData {
  endMessage?: string;
  summaryFlag?: boolean;
}

export type WorkflowNodeData = 
  | StartNodeData 
  | TaskNodeData 
  | ApprovalNodeData 
  | AutomatedStepNodeData 
  | EndNodeData;

export interface AutomationAction {
  id: string;
  label: string;
  params: string[];
}

export interface WorkflowNodeSnapshot {
  id: string;
  type: NodeType;
  data: WorkflowNodeData;
}

export interface WorkflowEdgeSnapshot {
  source: string;
  target: string;
}

export interface WorkflowSimulationRequest {
  nodes: WorkflowNodeSnapshot[];
  edges: WorkflowEdgeSnapshot[];
}

export interface SimulationStep {
  step: number;
  nodeId: string;
  nodeLabel: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  timestamp: string;
}

export interface SimulationResult {
  success: boolean;
  steps: SimulationStep[];
  errors?: string[];
}