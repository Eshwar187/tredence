import { useMemo, useState, type ReactNode } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useAutomations } from '../../hooks/useAutomations';
import type {
  ApprovalNodeData,
  AutomatedStepNodeData,
  EndNodeData,
  KeyValueMap,
  StartNodeData,
  TaskNodeData,
  WorkflowNodeData,
} from '../../types/workflow';

type NodeFormProps<T extends WorkflowNodeData> = {
  data: T;
  onChange: (data: Partial<T>) => void;
};

export function NodeConfigPanel() {
  const { selectedNode, updateNodeData, setSelectedNode, deleteSelected, nodeHistory } = useWorkflowStore();
  const { actions, isLoading } = useAutomations();

  if (!selectedNode) {
    return (
      <aside className="config-panel">
        <div className="empty-panel-state">
          <span className="material-symbols-outlined">touch_app</span>
          <h3>Node Configuration</h3>
          <p>Select a node to edit settings and form fields.</p>
        </div>
      </aside>
    );
  }

  const handleClose = () => setSelectedNode(null);

  const selectedNodeData = selectedNode.data as WorkflowNodeData;
  const selectedNodeHistory = nodeHistory[selectedNode.id] || [];

  const updateSelectedNode = (data: Partial<WorkflowNodeData>) => {
    updateNodeData(selectedNode.id, data);
  };

  const renderForm = () => {
    switch (selectedNode.type) {
      case 'start':
        return (
          <StartNodeForm
            data={selectedNodeData as StartNodeData}
            onChange={(data) => updateSelectedNode(data)}
          />
        );
      case 'task':
        return (
          <TaskNodeForm
            data={selectedNodeData as TaskNodeData}
            onChange={(data) => updateSelectedNode(data)}
          />
        );
      case 'approval':
        return (
          <ApprovalNodeForm
            data={selectedNodeData as ApprovalNodeData}
            onChange={(data) => updateSelectedNode(data)}
          />
        );
      case 'automatedStep':
        return (
          <AutomatedStepForm
            data={selectedNodeData as AutomatedStepNodeData}
            actions={actions}
            isLoadingActions={isLoading}
            onChange={(data) => updateSelectedNode(data)}
          />
        );
      case 'end':
        return (
          <EndNodeForm
            data={selectedNodeData as EndNodeData}
            onChange={(data) => updateSelectedNode(data)}
          />
        );
      default:
        return <div>Unknown node type</div>;
    }
  };

  return (
    <aside className="config-panel">
      <header className="panel-header">
        <div>
          <p className="panel-kicker">Node Form Panel</p>
          <h3 className="panel-title">{selectedNode.type} Node</h3>
        </div>
        <button onClick={handleClose} className="icon-btn" aria-label="Close node configuration panel">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <div className="panel-content">{renderForm()}</div>

      {selectedNodeHistory.length > 0 && (
        <div className="node-history-block">
          <p className="field-label">Node Version History</p>
          <ul className="plain-list">
            {selectedNodeHistory.slice(-5).reverse().map((entry) => (
              <li key={`${selectedNode.id}-${entry.revision}`}>
                Rev {entry.revision} - {new Date(entry.changedAt).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel-footer">
        <button onClick={deleteSelected} className="btn btn-danger panel-delete-btn">
          <span className="material-symbols-outlined">delete</span>
          Delete Node
        </button>
      </div>
    </aside>
  );
}

function StartNodeForm({ data, onChange }: NodeFormProps<StartNodeData>) {
  const metadata = useMemo(() => data.metadata || {}, [data.metadata]);

  return (
    <div className="node-form">
      <FormField label="Start Title">
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => onChange({ label: e.target.value })}
          className="form-control"
          placeholder="Enter start title"
        />
      </FormField>

      <KeyValueEditor
        title="Metadata"
        helperText="Optional key-value metadata for workflow entry"
        values={metadata}
        onChange={(values) => onChange({ metadata: values })}
      />
    </div>
  );
}

function TaskNodeForm({ data, onChange }: NodeFormProps<TaskNodeData>) {
  const customFields = useMemo(() => data.customFields || {}, [data.customFields]);

  return (
    <div className="node-form">
      <FormField label="Title *">
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => onChange({ label: e.target.value })}
          className="form-control"
          required
          placeholder="Collect employee documents"
        />
      </FormField>

      <FormField label="Description">
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="form-control form-control-textarea"
          placeholder="Describe the task instructions"
        />
      </FormField>

      <FormField label="Assignee">
        <input
          type="text"
          value={data.assignee || ''}
          onChange={(e) => onChange({ assignee: e.target.value })}
          className="form-control"
          placeholder="HR Ops"
        />
      </FormField>

      <FormField label="Due Date">
        <input
          type="date"
          value={data.dueDate || ''}
          onChange={(e) => onChange({ dueDate: e.target.value })}
          className="form-control"
        />
      </FormField>

      <KeyValueEditor
        title="Custom Fields"
        helperText="Optional extra values specific to this human task"
        values={customFields}
        onChange={(values) => onChange({ customFields: values })}
      />
    </div>
  );
}

function ApprovalNodeForm({ data, onChange }: NodeFormProps<ApprovalNodeData>) {
  return (
    <div className="node-form">
      <FormField label="Title">
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => onChange({ label: e.target.value })}
          className="form-control"
          placeholder="Manager Approval"
        />
      </FormField>

      <FormField label="Approver Role">
        <select
          value={data.approverRole || 'Manager'}
          onChange={(e) => onChange({ approverRole: e.target.value })}
          className="form-control"
        >
          <option value="Manager">Manager</option>
          <option value="HRBP">HR Business Partner</option>
          <option value="Director">Director</option>
        </select>
      </FormField>

      <FormField label="Auto-approve Threshold (days)">
        <input
          type="number"
          value={data.autoApproveThreshold || ''}
          onChange={(e) => {
            const rawValue = e.target.value;
            onChange({
              autoApproveThreshold:
                rawValue === '' ? undefined : Math.max(0, Number.parseInt(rawValue, 10) || 0),
            });
          }}
          placeholder="Leave blank to disable"
          className="form-control"
        />
      </FormField>
    </div>
  );
}

function AutomatedStepForm({
  data,
  actions,
  isLoadingActions,
  onChange,
}: NodeFormProps<AutomatedStepNodeData> & {
  actions: Array<{ id: string; label: string; params: string[] }>;
  isLoadingActions: boolean;
}) {
  const selectedAction = actions.find((a) => a.id === data.actionId);

  return (
    <div className="node-form">
      <FormField label="Title">
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => onChange({ label: e.target.value })}
          className="form-control"
          placeholder="Automated Email Notification"
        />
      </FormField>

      <FormField label="Action">
        <select
          value={data.actionId || ''}
          onChange={(e) => onChange({ actionId: e.target.value, actionParams: {} })}
          className="form-control"
          disabled={isLoadingActions}
        >
          <option value="">{isLoadingActions ? 'Loading actions...' : 'Select an action...'}</option>
          {actions.map((action) => (
            <option key={action.id} value={action.id}>
              {action.label}
            </option>
          ))}
        </select>
      </FormField>

      {selectedAction && (
        <div className="params-section">
          <p className="field-label">Action Parameters</p>
          <div className="params-list">
            {selectedAction.params.map((param) => (
              <FormField key={param} label={param} compact>
                <input
                  type="text"
                  value={data.actionParams?.[param] || ''}
                  onChange={(e) =>
                    onChange({
                      actionParams: { ...data.actionParams, [param]: e.target.value },
                    })
                  }
                  className="form-control"
                />
              </FormField>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EndNodeForm({ data, onChange }: NodeFormProps<EndNodeData>) {
  return (
    <div className="node-form">
      <FormField label="End Message">
        <input
          type="text"
          value={data.endMessage || ''}
          onChange={(e) => onChange({ endMessage: e.target.value, label: e.target.value || 'End' })}
          placeholder="Workflow completed"
          className="form-control"
        />
      </FormField>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={data.summaryFlag || false}
          onChange={(e) => onChange({ summaryFlag: e.target.checked })}
        />
        <span>Generate Summary Report</span>
      </label>
    </div>
  );
}

function KeyValueEditor({
  title,
  helperText,
  values,
  onChange,
}: {
  title: string;
  helperText?: string;
  values: KeyValueMap;
  onChange: (values: KeyValueMap) => void;
}) {
  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');

  const addEntry = () => {
    const trimmedKey = keyInput.trim();
    if (!trimmedKey) {
      return;
    }

    onChange({
      ...values,
      [trimmedKey]: valueInput,
    });
    setKeyInput('');
    setValueInput('');
  };

  const removeEntry = (key: string) => {
    const nextValues = { ...values };
    delete nextValues[key];
    onChange(nextValues);
  };

  return (
    <div className="kv-editor">
      <p className="field-label">{title}</p>
      {helperText && <p className="field-help">{helperText}</p>}

      <div className="kv-input-row">
        <input
          type="text"
          placeholder="Key"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          className="form-control"
        />
        <input
          type="text"
          placeholder="Value"
          value={valueInput}
          onChange={(e) => setValueInput(e.target.value)}
          className="form-control"
        />
        <button type="button" onClick={addEntry} className="icon-btn accent" aria-label={`Add ${title} item`}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {Object.keys(values).length > 0 && (
        <div className="kv-list">
          {Object.entries(values).map(([key, value]) => (
            <div key={key} className="kv-chip">
              <span>{key}: {value}</span>
              <button type="button" onClick={() => removeEntry(key)} className="icon-btn danger" aria-label={`Remove ${key}`}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <label className={`field ${compact ? 'compact' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}