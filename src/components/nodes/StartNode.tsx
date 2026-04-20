import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { StartNodeData } from '../../types/workflow';

interface StartNodeProps {
  data: StartNodeData;
  selected?: boolean;
}

const StartNode = memo(({ data, selected }: StartNodeProps) => {
  return (
    <div className={`workflow-node workflow-node--start ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="workflow-node-handle workflow-node-handle--start" />
      <div className="workflow-node-main">
        <div className="workflow-node-icon">
          <span className="material-symbols-outlined">play_arrow</span>
        </div>
        <div>
          <div className="workflow-node-type">Start</div>
          <div className="workflow-node-title">{data.label || 'Start'}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="workflow-node-handle workflow-node-handle--start" />
    </div>
  );
});

StartNode.displayName = 'StartNode';

export default StartNode;