import StartNode from '../nodes/StartNode';
import TaskNode from '../nodes/TaskNode';
import ApprovalNode from '../nodes/ApprovalNode';
import AutomatedStepNode from '../nodes/AutomatedStepNode';
import EndNode from '../nodes/EndNode';
import type { NodeType } from '../../types/workflow';

export const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  automatedStep: AutomatedStepNode,
  end: EndNode,
};

export const nodeTypeLabels: Record<string, string> = {
  start: 'Start',
  task: 'Task',
  approval: 'Approval',
  automatedStep: 'Automated Step',
  end: 'End',
};

export const nodeTypeColors: Record<string, { bg: string; border: string; icon: string }> = {
  start: { bg: 'bg-green-100', border: 'border-green-500', icon: 'play_arrow' },
  task: { bg: 'bg-blue-100', border: 'border-blue-400', icon: 'assignment' },
  approval: { bg: 'bg-orange-100', border: 'border-orange-500', icon: 'verified' },
  automatedStep: { bg: 'bg-purple-100', border: 'border-purple-500', icon: 'bolt' },
  end: { bg: 'bg-red-100', border: 'border-red-500', icon: 'stop' },
};

export function createNode(type: NodeType, position: { x: number; y: number }) {
  const labels: Record<string, string> = {
    start: 'Start Workflow',
    task: 'Collect Documents',
    approval: 'Manager Approval',
    automatedStep: 'Automated Action',
    end: 'Workflow completed',
  };

  const defaultDataByType: Record<NodeType, Record<string, unknown>> = {
    start: {
      label: labels.start,
      metadata: {},
    },
    task: {
      label: labels.task,
      description: '',
      assignee: '',
      dueDate: '',
      customFields: {},
    },
    approval: {
      label: labels.approval,
      approverRole: 'Manager',
    },
    automatedStep: {
      label: labels.automatedStep,
      actionId: '',
      actionParams: {},
    },
    end: {
      label: labels.end,
      endMessage: labels.end,
      summaryFlag: false,
    },
  };

  return {
    id: `${type}-${Date.now()}`,
    type,
    position,
    data: defaultDataByType[type],
  };
}