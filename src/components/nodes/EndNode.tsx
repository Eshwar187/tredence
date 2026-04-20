import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { EndNodeData } from '../../types/workflow';

interface EndNodeProps {
  data: EndNodeData;
  selected?: boolean;
}

const EndNode = memo(({ data, selected }: EndNodeProps) => {
  return (
    <div className={`workflow-node workflow-node--end ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="workflow-node-handle workflow-node-handle--end" />
      <div className="workflow-node-main">
        <div className="workflow-node-icon">
          <span className="material-symbols-outlined">stop</span>
        </div>
        <div>
          <div className="workflow-node-type">End</div>
          <div className="workflow-node-title">{data.endMessage || data.label || 'End'}</div>
        </div>
      </div>
    </div>
  );
});

EndNode.displayName = 'EndNode';

export default EndNode;