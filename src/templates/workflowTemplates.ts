import type { Edge, Node } from '@xyflow/react';
import type { NodeType, WorkflowNodeData } from '../types/workflow';

export type WorkflowTemplate = {
  id: string;
  label: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
};

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'onboarding',
    label: 'Employee Onboarding',
    description: 'Collect docs, approve, then trigger welcome communication.',
    nodes: [
      createTemplateNode('tpl-start', 'start', { x: 120, y: 180 }, {
        label: 'Start Onboarding',
        metadata: { source: 'HR Portal' },
      }),
      createTemplateNode('tpl-task', 'task', { x: 340, y: 180 }, {
        label: 'Collect Documents',
        assignee: 'HR Ops',
        dueDate: '',
      }),
      createTemplateNode('tpl-approval', 'approval', { x: 560, y: 180 }, {
        label: 'Manager Approval',
        approverRole: 'Manager',
      }),
      createTemplateNode('tpl-auto', 'automatedStep', { x: 780, y: 180 }, {
        label: 'Send Welcome Email',
        actionId: 'send_email',
        actionParams: { to: 'employee@company.com', subject: 'Welcome Aboard' },
      }),
      createTemplateNode('tpl-end', 'end', { x: 1000, y: 180 }, {
        label: 'Workflow completed',
        endMessage: 'Onboarding completed',
        summaryFlag: true,
      }),
    ],
    edges: [
      { id: 'tpl-e1', source: 'tpl-start', target: 'tpl-task' },
      { id: 'tpl-e2', source: 'tpl-task', target: 'tpl-approval' },
      { id: 'tpl-e3', source: 'tpl-approval', target: 'tpl-auto' },
      { id: 'tpl-e4', source: 'tpl-auto', target: 'tpl-end' },
    ],
  },
  {
    id: 'leave-approval',
    label: 'Leave Approval',
    description: 'Simple request flow with approval and system update.',
    nodes: [
      createTemplateNode('leave-start', 'start', { x: 120, y: 220 }, {
        label: 'Start Leave Request',
      }),
      createTemplateNode('leave-task', 'task', { x: 340, y: 220 }, {
        label: 'Submit Request',
        assignee: 'Employee',
      }),
      createTemplateNode('leave-approval', 'approval', { x: 560, y: 220 }, {
        label: 'HRBP Approval',
        approverRole: 'HRBP',
      }),
      createTemplateNode('leave-auto', 'automatedStep', { x: 780, y: 220 }, {
        label: 'Update Leave Register',
        actionId: 'update_database',
      }),
      createTemplateNode('leave-end', 'end', { x: 1000, y: 220 }, {
        label: 'Workflow completed',
        endMessage: 'Leave request processed',
      }),
    ],
    edges: [
      { id: 'leave-e1', source: 'leave-start', target: 'leave-task' },
      { id: 'leave-e2', source: 'leave-task', target: 'leave-approval' },
      { id: 'leave-e3', source: 'leave-approval', target: 'leave-auto' },
      { id: 'leave-e4', source: 'leave-auto', target: 'leave-end' },
    ],
  },
];

function createTemplateNode(id: string, type: NodeType, position: { x: number; y: number }, data: Partial<WorkflowNodeData>): Node {
  return {
    id,
    type,
    position,
    data: data as Record<string, unknown>,
  };
}
