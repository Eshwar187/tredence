import type { Node } from '@xyflow/react';
import { useMemo } from 'react';
import { useAutomations } from '../../hooks/useAutomations';
import { useWorkflowStore } from '../../store/workflowStore';

export function DashboardPage() {
  const { nodes, edges, simulationResult, validateWorkflow } = useWorkflowStore();

  const validationErrors = validateWorkflow();
  const stats = useMemo(() => buildNodeStats(nodes), [nodes]);

  return (
    <section className="section-page">
      <header className="section-page-header">
        <p className="section-page-kicker">Operations Overview</p>
        <h2>Workflow Dashboard</h2>
        <p>Monitor graph quality, node composition, and latest simulation health in one place.</p>
      </header>

      <div className="metrics-grid">
        <MetricCard title="Total Nodes" value={nodes.length} icon="hub" tone="blue" />
        <MetricCard title="Connections" value={edges.length} icon="timeline" tone="teal" />
        <MetricCard title="Validation Issues" value={validationErrors.length} icon="warning" tone={validationErrors.length > 0 ? 'red' : 'green'} />
        <MetricCard title="Last Simulation" value={simulationResult?.success ? 'Passed' : simulationResult ? 'Failed' : 'Not Run'} icon="science" tone={simulationResult?.success ? 'green' : simulationResult ? 'red' : 'neutral'} />
      </div>

      <div className="section-grid">
        <article className="section-card">
          <h3>Node Distribution</h3>
          <div className="chip-row">
            {Object.entries(stats).map(([type, count]) => (
              <span key={type} className="soft-chip">{type}: {count}</span>
            ))}
          </div>
        </article>

        <article className="section-card">
          <h3>Validation Summary</h3>
          {validationErrors.length === 0 ? (
            <p className="muted-copy">All workflow constraints are currently satisfied.</p>
          ) : (
            <ul className="plain-list">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </article>

        <article className="section-card">
          <h3>Recent Execution Steps</h3>
          {!simulationResult || simulationResult.steps.length === 0 ? (
            <p className="muted-copy">Run simulation from Designer to populate execution history.</p>
          ) : (
            <ul className="plain-list">
              {simulationResult.steps.slice(-5).map((step) => (
                <li key={`${step.nodeId}-${step.step}`}>
                  {step.step}. {step.nodeLabel} - {step.status}
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}

export function DirectoryPage() {
  const { nodes } = useWorkflowStore();

  const assignees = useMemo(() => getUniqueNodeValues(nodes, 'task', 'assignee'), [nodes]);
  const approverRoles = useMemo(() => getUniqueNodeValues(nodes, 'approval', 'approverRole'), [nodes]);

  return (
    <section className="section-page">
      <header className="section-page-header">
        <p className="section-page-kicker">People & Roles</p>
        <h2>Directory</h2>
        <p>Track participants frequently referenced in task and approval nodes.</p>
      </header>

      <div className="section-grid">
        <article className="section-card">
          <h3>Task Assignees Detected</h3>
          {assignees.length === 0 ? (
            <p className="muted-copy">No assignees configured yet. Add assignee in Task node form.</p>
          ) : (
            <ul className="plain-list">
              {assignees.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
        </article>

        <article className="section-card">
          <h3>Approver Roles Used</h3>
          {approverRoles.length === 0 ? (
            <p className="muted-copy">No approver roles configured yet.</p>
          ) : (
            <ul className="plain-list">
              {approverRoles.map((role) => (
                <li key={role}>{role}</li>
              ))}
            </ul>
          )}
        </article>

        <article className="section-card">
          <h3>Recommended Default Roles</h3>
          <div className="chip-row">
            <span className="soft-chip">HR Ops</span>
            <span className="soft-chip">Hiring Manager</span>
            <span className="soft-chip">HRBP</span>
            <span className="soft-chip">IT Support</span>
            <span className="soft-chip">Director</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export function AutomationsPage() {
  const { actions, isLoading } = useAutomations();

  return (
    <section className="section-page">
      <header className="section-page-header">
        <p className="section-page-kicker">Automation Catalog</p>
        <h2>Automations</h2>
        <p>Available action definitions retrieved from mock GET /automations.</p>
      </header>

      {isLoading ? (
        <p className="muted-copy">Loading automation definitions...</p>
      ) : (
        <div className="section-grid">
          {actions.map((action) => (
            <article className="section-card" key={action.id}>
              <h3>{action.label}</h3>
              <p className="muted-copy">Action ID: {action.id}</p>
              <div className="chip-row">
                {action.params.map((param) => (
                  <span key={param} className="soft-chip">{param}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function TemplatesPage() {
  const templates = [
    {
      name: 'Employee Onboarding',
      steps: 'Start -> Collect Documents -> Manager Approval -> Send Email -> End',
    },
    {
      name: 'Leave Approval',
      steps: 'Start -> Submit Request -> Approval -> Update Database -> End',
    },
    {
      name: 'Document Verification',
      steps: 'Start -> Task Review -> Automated Validation -> Approval -> End',
    },
  ];

  return (
    <section className="section-page">
      <header className="section-page-header">
        <p className="section-page-kicker">Workflow Starters</p>
        <h2>Templates</h2>
        <p>Reference process templates you can reproduce quickly in Designer.</p>
      </header>

      <div className="section-grid">
        {templates.map((template) => (
          <article className="section-card" key={template.name}>
            <h3>{template.name}</h3>
            <p className="muted-copy">{template.steps}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HistoryPage() {
  const { simulationResult, nodes, edges } = useWorkflowStore();

  return (
    <section className="section-page">
      <header className="section-page-header">
        <p className="section-page-kicker">Execution Archive</p>
        <h2>History</h2>
        <p>Inspect latest simulation output and context captured from current workflow graph.</p>
      </header>

      <div className="section-grid">
        <article className="section-card">
          <h3>Last Payload Snapshot</h3>
          <div className="chip-row">
            <span className="soft-chip">Nodes: {nodes.length}</span>
            <span className="soft-chip">Edges: {edges.length}</span>
          </div>
        </article>

        <article className="section-card">
          <h3>Simulation Result</h3>
          {!simulationResult ? (
            <p className="muted-copy">No simulation found. Run simulation from Designer first.</p>
          ) : (
            <>
              <p className="muted-copy">
                Status: <strong>{simulationResult.success ? 'Passed' : 'Failed'}</strong>
              </p>
              {simulationResult.errors && simulationResult.errors.length > 0 && (
                <ul className="plain-list">
                  {simulationResult.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </article>

        <article className="section-card">
          <h3>Execution Timeline</h3>
          {!simulationResult || simulationResult.steps.length === 0 ? (
            <p className="muted-copy">Timeline is empty.</p>
          ) : (
            <ul className="plain-list">
              {simulationResult.steps.map((step) => (
                <li key={`${step.nodeId}-${step.step}`}>
                  {step.step}. {step.nodeLabel} - {new Date(step.timestamp).toLocaleTimeString()}
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}

export function SettingsPage() {
  return (
    <section className="section-page">
      <header className="section-page-header">
        <p className="section-page-kicker">Designer Preferences</p>
        <h2>Settings</h2>
        <p>Manage defaults for authoring and reviewing workflows.</p>
      </header>

      <div className="section-grid">
        <article className="section-card">
          <h3>Canvas Behavior</h3>
          <ul className="plain-list">
            <li>Snap to grid enabled</li>
            <li>Delete key support enabled</li>
            <li>Drag-and-click node creation enabled</li>
          </ul>
        </article>

        <article className="section-card">
          <h3>Validation Policy</h3>
          <ul className="plain-list">
            <li>Single Start node required</li>
            <li>At least one End node required</li>
            <li>Cycle detection enabled</li>
            <li>Reachability checks from Start node</li>
          </ul>
        </article>

        <article className="section-card">
          <h3>Simulation Behavior</h3>
          <p className="muted-copy">Simulation uses local mock POST /simulate with BFS traversal and payload validation.</p>
        </article>
      </div>
    </section>
  );
}

function MetricCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string | number;
  icon: string;
  tone: 'blue' | 'teal' | 'red' | 'green' | 'neutral';
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-card-header">
        <span className="material-symbols-outlined">{icon}</span>
        <p>{title}</p>
      </div>
      <h3>{value}</h3>
    </article>
  );
}

function buildNodeStats(nodes: Node[]) {
  const stats: Record<string, number> = {
    start: 0,
    task: 0,
    approval: 0,
    automatedStep: 0,
    end: 0,
  };

  nodes.forEach((node) => {
    if (node.type && stats[node.type] !== undefined) {
      stats[node.type] += 1;
    }
  });

  return stats;
}

function getUniqueNodeValues(nodes: Node[], type: string, dataKey: string) {
  const values = new Set<string>();

  nodes.forEach((node) => {
    if (node.type !== type || typeof node.data !== 'object' || node.data === null) {
      return;
    }

    const maybeValue = (node.data as Record<string, unknown>)[dataKey];
    if (typeof maybeValue === 'string' && maybeValue.trim()) {
      values.add(maybeValue.trim());
    }
  });

  return Array.from(values);
}
