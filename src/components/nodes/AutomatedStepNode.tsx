import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { AutomatedStepNodeData } from '../../types/workflow';

interface AutomatedStepNodeProps {
  data: AutomatedStepNodeData;
  selected?: boolean;
}

const AutomatedStepNode = memo(({ data, selected }: AutomatedStepNodeProps) => {
  const hasValidationError = Boolean((data as Record<string, unknown>).hasValidationError);

  return (
    <div className={`workflow-node workflow-node--automated ${selected ? 'is-selected' : ''} ${hasValidationError ? 'has-validation-error' : ''}`}>
      <Handle type="target" position={Position.Left} className="workflow-node-handle workflow-node-handle--automated" />
      <div className="workflow-node-main workflow-node-main--stacked">
        <div className="workflow-node-icon">
          <span className="material-symbols-outlined">bolt</span>
        </div>
        <div>
          <div className="workflow-node-type">Automated</div>
          <div className="workflow-node-title">{data.label || 'Automated Step'}</div>
        </div>
      </div>
      {data.actionId && (
        <div className="workflow-node-meta">
          <span className="material-symbols-outlined">smart_toy</span>
          {data.actionId}
        </div>
      )}
      {data.actionParams && Object.keys(data.actionParams).length > 0 && (
        <div className="workflow-node-meta">
          {Object.keys(data.actionParams).length} param(s) configured
        </div>
      )}
      {hasValidationError && <div className="node-error-pill">!</div>}
      <Handle type="source" position={Position.Right} className="workflow-node-handle workflow-node-handle--automated" />
    </div>
  );
});

AutomatedStepNode.displayName = 'AutomatedStepNode';

export default AutomatedStepNode;