import { useWorkflowStore } from '../../store/workflowStore';
import { NavLink } from 'react-router-dom';

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
  const { validateWorkflow, clearWorkflow, nodes, edges } = useWorkflowStore();

  const errors = validateWorkflow();
  const hasWorkflow = nodes.length > 0;

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-logo-small">
          <span className="material-symbols-outlined">account_tree</span>
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
          <span className="material-symbols-outlined">corporate_fare</span>
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