import { useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { simulateWorkflow } from '../../api/mockApi';
import type { SimulationStep, WorkflowSimulationRequest } from '../../types/workflow';

export function SimulationPanel() {
  const { nodes, edges, validateWorkflow, setSimulationResult, setIsSimulating, isSimulating, simulationResult } = useWorkflowStore();
  const [showPanel, setShowPanel] = useState(false);

  const runSimulation = async () => {
    const errors = validateWorkflow();
    if (errors.length > 0) {
      setSimulationResult({
        success: false,
        steps: [],
        errors,
      });
      setShowPanel(true);
      return;
    }

    setIsSimulating(true);
    setShowPanel(true);

    try {
      const simulationPayload: WorkflowSimulationRequest = {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type as WorkflowSimulationRequest['nodes'][number]['type'],
          data: node.data as WorkflowSimulationRequest['nodes'][number]['data'],
        })),
        edges: edges.map((edge) => ({ source: edge.source, target: edge.target })),
      };

      const result = await simulateWorkflow(simulationPayload);
      setSimulationResult(result);
    } catch (error) {
      setSimulationResult({
        success: false,
        steps: [],
        errors: ['Simulation failed: ' + String(error)],
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const validationErrors = validateWorkflow();

  return (
    <aside className="simulation-panel">
      <header className="panel-header">
        <div className="simulation-title-wrap">
          <h3 className="panel-title panel-title-with-icon">
            <span className="material-symbols-outlined">science</span>
            Test / Sandbox
          </h3>
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="icon-btn"
            aria-label="Expand or collapse simulation panel"
          >
            <span className="material-symbols-outlined">{showPanel ? 'expand_less' : 'expand_more'}</span>
          </button>
        </div>

        <button
          onClick={runSimulation}
          disabled={isSimulating || nodes.length === 0}
          className="btn btn-primary simulation-run-btn"
        >
          <span className="material-symbols-outlined">{isSimulating ? 'hourglass_empty' : 'play_arrow'}</span>
          {isSimulating ? 'Running...' : 'Run Simulation'}
        </button>

        <p className="simulation-payload">
          Payload: {nodes.length} nodes / {edges.length} edges
        </p>
      </header>

      {validationErrors.length > 0 && (
        <div className="validation-strip">
          <div className="validation-strip-content">
            <span className="material-symbols-outlined">warning</span>
            {validationErrors.length} validation issue(s)
          </div>
        </div>
      )}

      {showPanel && simulationResult && (
        <div className="panel-content simulation-scroll">
          <div className={`simulation-status ${simulationResult.success ? 'success' : 'error'}`}>
            <span className="material-symbols-outlined">
              {simulationResult.success ? 'check_circle' : 'error'}
            </span>
            <span>
              {simulationResult.success ? 'Simulation Passed' : 'Simulation Failed'}
            </span>
          </div>

          {simulationResult.errors && simulationResult.errors.length > 0 && (
            <div className="simulation-errors">
              <h4>Errors</h4>
              <ul>
                {simulationResult.errors.map((err: string, i: number) => (
                  <li key={i}>
                    • {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h4 className="timeline-title">Execution Timeline</h4>
          <div className="timeline-list">
            {simulationResult.steps.map((step: SimulationStep, index: number) => (
              <div key={index} className="timeline-row">
                <div className="timeline-marker-column">
                  <div
                    className={`timeline-marker ${
                      step.status === 'success'
                        ? 'success'
                        : step.status === 'running'
                        ? 'running'
                        : 'idle'
                    }`}
                  >
                    {step.status === 'success' ? (
                      <span className="material-symbols-outlined">check</span>
                    ) : step.status === 'running' ? (
                      <span className="material-symbols-outlined spinner">refresh</span>
                    ) : (
                      <span className="timeline-step-no">{step.step}</span>
                    )}
                  </div>
                  {index < simulationResult.steps.length - 1 && (
                    <div className="timeline-line"></div>
                  )}
                </div>
                <div className="timeline-content">
                  <div className="timeline-node-title">{step.nodeLabel}</div>
                  <div className="timeline-node-message">{step.message}</div>
                  <div className="timeline-node-time">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPanel && !simulationResult && (
        <div className="panel-content simulation-empty">
          <p>Run simulation to see results</p>
        </div>
      )}
    </aside>
  );
}