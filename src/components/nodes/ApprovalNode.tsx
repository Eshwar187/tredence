import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { ApprovalNodeData } from '../../types/workflow';

interface ApprovalNodeProps {
  data: ApprovalNodeData;
  selected?: boolean;
}

const ApprovalNode = memo(({ data, selected }: ApprovalNodeProps) => {
  return (
    <div className={`workflow-node workflow-node--approval ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="workflow-node-handle workflow-node-handle--approval" />
      <div className="workflow-node-main workflow-node-main--stacked">
        <div className="workflow-node-icon">
          <span className="material-symbols-outlined">verified</span>
        </div>
        <div>
          <div className="workflow-node-type">Approval</div>
          <div className="workflow-node-title">{data.label || 'Approval'}</div>
        </div>
      </div>
      {data.approverRole && (
        <div className="workflow-node-meta">
          <span className="material-symbols-outlined">badge</span>
          {data.approverRole}
        </div>
      )}
      {typeof data.autoApproveThreshold === 'number' && (
        <div className="workflow-node-meta">
          <span className="material-symbols-outlined">timer</span>
          Auto-approve in {data.autoApproveThreshold} day(s)
        </div>
      )}
      <Handle type="source" position={Position.Right} className="workflow-node-handle workflow-node-handle--approval" />
    </div>
  );
});

ApprovalNode.displayName = 'ApprovalNode';

export default ApprovalNode;