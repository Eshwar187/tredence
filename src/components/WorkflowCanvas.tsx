import { useCallback, useRef, DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  BackgroundVariant,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes';
import { useWorkflowStore } from '../store/workflowStore';
import { NodePalette } from './ui/NodePalette';
import { NodeConfigPanel } from './forms/NodeConfigPanel';
import { SimulationPanel } from './ui/SimulationPanel';
import type { NodeType } from '../types/workflow';

const workflowStyles = {
  background: 'transparent',
};

function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
  } = useWorkflowStore();

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 80,
        y: event.clientY - reactFlowBounds.top,
      };

      addNode(type, position);
    },
    [addNode]
  );

  const onNodeClick: NodeMouseHandler<Node> = useCallback(
    (_, node) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const handleQuickAddNode = useCallback(
    (type: NodeType) => {
      const nextIndex = nodes.length;
      addNode(type, {
        x: 120 + (nextIndex % 3) * 260,
        y: 120 + Math.floor(nextIndex / 3) * 160,
      });
    },
    [addNode, nodes.length]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      setSelectedNode(selectedNodes.length > 0 ? selectedNodes[0] : null);
    },
    [setSelectedNode]
  );

  return (
    <div className="workflow-designer">
      <NodePalette onAddNode={handleQuickAddNode} />
      <div className="canvas-stage" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onSelectionChange={onSelectionChange}
          onDragOver={onDragOver}
          onDrop={onDrop}
          style={workflowStyles}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#d8dfeb"
          />
          <Controls className="rf-controls" />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="rf-minimap"
          />
        </ReactFlow>
      </div>
      <NodeConfigPanel />
      <SimulationPanel />
    </div>
  );
}

export default function WorkflowCanvasWithProvider() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}