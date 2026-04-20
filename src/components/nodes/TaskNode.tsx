import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { TaskNodeData } from '../../types/workflow';

interface TaskNodeProps {
  data: TaskNodeData;
  selected?: boolean;
}

const TaskNode = memo(({ data, selected }: TaskNodeProps) => {
  const hasValidationError = Boolean((data as Record<string, unknown>).hasValidationError);

  return (
    <div className={`workflow-node workflow-node--task ${selected ? 'is-selected' : ''} ${hasValidationError ? 'has-validation-error' : ''}`}>
      <Handle type="target" position={Position.Left} className="workflow-node-handle workflow-node-handle--task" />
      <div className="workflow-node-main workflow-node-main--stacked">
        <div className="workflow-node-icon">
          <span className="material-symbols-outlined">assignment</span>
        </div>
        <div>
          <div className="workflow-node-type">Task</div>
          <div className="workflow-node-title">{data.label || 'Task'}</div>
        </div>
      </div>
      {data.assignee && (
        <div className="workflow-node-meta">
          <span className="material-symbols-outlined">person</span>
          {data.assignee}
        </div>
      )}
      {data.dueDate && (
        <div className="workflow-node-meta">
          <span className="material-symbols-outlined">event</span>
          {data.dueDate}
        </div>
      )}
      {hasValidationError && <div className="node-error-pill">!</div>}
      <Handle type="source" position={Position.Right} className="workflow-node-handle workflow-node-handle--task" />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';

export default TaskNode;