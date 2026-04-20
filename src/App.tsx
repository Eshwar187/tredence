import { Navigate, Route, Routes } from 'react-router-dom';
import {
  AutomationsPage,
  DashboardPage,
  DirectoryPage,
  HistoryPage,
  SettingsPage,
  TemplatesPage,
} from './components/pages/WorkspacePages';
import { TopBar, Sidebar } from './components/ui/Layout';
import WorkflowCanvasWithProvider from './components/WorkflowCanvas';

function App() {
  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-main">
        <Sidebar />
        <main className="workspace-main">
          <Routes>
            <Route path="/" element={<WorkflowCanvasWithProvider />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;