import type { NodeType } from '../../types/workflow';
import { nodeTypeLabels, nodeTypeColors } from '../nodes';

interface NodePaletteProps {
  onAddNode: (type: NodeType) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const nodeTypes: NodeType[] = ['start', 'task', 'approval', 'automatedStep', 'end'];

  return (
    <div className="node-palette">
      <h2 className="palette-title">
        <span className="material-symbols-outlined">add_circle</span>
        Node Types
      </h2>
      <div className="palette-list">
        {nodeTypes.map((type) => {
          const colors = nodeTypeColors[type];
          return (
            <div
              key={type}
              draggable
              role="button"
              tabIndex={0}
              onClick={() => onAddNode(type)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onAddNode(type);
                }
              }}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', type);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className={`palette-item ${type}`}
            >
              <div className="palette-item-content">
                <span className="material-symbols-outlined palette-item-icon">{colors.icon}</span>
                <span className="palette-item-label">{nodeTypeLabels[type]}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="palette-footer">
        <p>Drag nodes to the canvas or click to add</p>
      </div>
    </div>
  );
}