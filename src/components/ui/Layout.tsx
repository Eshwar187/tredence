import { useWorkflowStore } from '../../store/workflowStore';
import { NavLink } from 'react-router-dom';
import { ChangeEvent, useRef } from 'react';

const topTabs = [
  { label: 'Templates', to: '/templates' },
  { label: 'Designer', to: '/' },
  { label: 'History', to: '/history' },
] as const;

const sideNavItems = [
  { label: 'Dashboard', icon: 'grid_view', to: '/dashboard' },
  { label: 'Workflows', icon: 'account_tree', to: '/' },
  { label: 'Directory', icon: 'badge', to: '/directory' },
  { label: 'Automations', icon: 'bolt', to: '/automations' },
  { label: 'Settings', icon: 'settings_heart', to: '/settings' },
] as const;

export function TopBar() {
  const {
    validateWorkflow,
    clearWorkflow,
    nodes,
    edges,
    undo,
    redo,
    canUndo,
    canRedo,
    exportWorkflow,
    importWorkflow,
    applyAutoLayout,
    loadTemplate,
  } = useWorkflowStore();

  const importInputRef = useRef<HTMLInputElement>(null);

  const errors = validateWorkflow();
  const hasWorkflow = nodes.length > 0;

  const handleExport = () => {
    const payload = exportWorkflow();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const result = importWorkflow(parsed);
      if (!result.success) {
        window.alert(result.message);
      }
    } catch {
      window.alert('Invalid JSON file. Please choose a valid workflow export.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-logo-small">
          <BrandMark />
        </div>
        <div>
          <h1 className="topbar-title">HR Workflow Designer</h1>
          <p className="topbar-subtitle">Structured Sanctuary</p>
        </div>
      </div>

      <nav className="topbar-nav" aria-label="Main navigation">
        {topTabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="topbar-actions">
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden-file-input"
          onChange={handleImport}
        />

        <button
          onClick={() => undo()}
          disabled={!canUndo()}
          className="btn btn-secondary"
          title="Undo"
        >
          Undo
        </button>

        <button
          onClick={() => redo()}
          disabled={!canRedo()}
          className="btn btn-secondary"
          title="Redo"
        >
          Redo
        </button>

        <button onClick={handleExport} disabled={!hasWorkflow} className="btn btn-secondary" title="Export workflow JSON">
          Export
        </button>

        <button onClick={() => importInputRef.current?.click()} className="btn btn-secondary" title="Import workflow JSON">
          Import
        </button>

        <button
          onClick={() => loadTemplate('onboarding')}
          className="btn btn-secondary"
          title="Load onboarding template"
        >
          Template
        </button>

        <button
          onClick={applyAutoLayout}
          disabled={!hasWorkflow}
          className="btn btn-secondary"
          title="Auto-layout workflow nodes"
        >
          Auto-layout
        </button>

        {hasWorkflow && (
          <div className="nodes-count">
            <span className="material-symbols-outlined">hub</span>
            {nodes.length} nodes
            <span>•</span>
            {edges.length} edges
          </div>
        )}

        {errors.length > 0 && (
          <div className="error-badge">
            <span className="material-symbols-outlined">warning</span>
            {errors.length}
          </div>
        )}

        <button
          onClick={clearWorkflow}
          disabled={!hasWorkflow}
          className="btn btn-secondary"
        >
          Clear
        </button>

        <div className="user-avatar" aria-hidden="true">
          <span className="material-symbols-outlined">person</span>
        </div>
      </div>
    </header>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <BrandMark />
        </div>
        <div>
          <div className="sidebar-title">Structured Sanctuary</div>
          <div className="sidebar-subtitle">Enterprise Admin</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sideNavItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 7h4v4H7z" />
      <path d="M13 13h4v4h-4z" />
      <path d="M13 5h4v4h-4z" />
      <path d="M7 15h4v4H7z" />
      <path className="link" d="M11 9h2v2h-2z" />
      <path className="link" d="M11 13h2v2h-2z" />
      <path className="connector" d="M11 8h2" />
      <path className="connector" d="M11 14h2" />
      <path className="connector" d="M9 11v2" />
      <path className="connector" d="M15 9v4" />
    </svg>
  );
}