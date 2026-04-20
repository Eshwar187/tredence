# HR Workflow Designer Prototype

Mini HR workflow builder built with React + TypeScript + React Flow. It allows HR admins to model workflows (onboarding, leave approvals, document checks), configure each step, and run a sandbox simulation against a mock API.

## Completed Deliverables

1. React application (Vite + TypeScript)
2. React Flow canvas with custom nodes (Start, Task, Approval, Automated Step, End)
3. Dynamic node configuration panel with per-node forms
4. Mock API layer for automations and workflow simulation
5. Workflow test/sandbox panel with validation + execution timeline
6. Architecture/design notes and assumptions in this README

## Architecture

```text
src/
  api/
    mockApi.ts                     # Mock GET /automations and POST /simulate
  components/
    WorkflowCanvas.tsx             # React Flow canvas + DnD + interactions
    forms/
      NodeConfigPanel.tsx          # Node editor forms (typed + dynamic)
    nodes/
      *.tsx                        # Visual node renderers
      index.ts                     # Node registry + node factory defaults
    ui/
      Layout.tsx                   # Topbar + shell layout
      NodePalette.tsx              # Draggable node palette
      SimulationPanel.tsx          # Test/sandbox execution panel
  hooks/
    useAutomations.ts              # Fetch automation actions once and cache in state
  store/
    workflowStore.ts               # Zustand graph state + actions + validation
  types/
    workflow.ts                    # Shared domain types/contracts
```

## Design Choices

- React Flow state is centralized in a Zustand store to keep canvas logic and form logic synchronized.
- Node forms are controlled components and update node data in place through typed partial updates.
- Dynamic key-value editor is reusable for Start metadata and Task custom fields.
- Validation is store-level so both top bar and simulation panel can consume the same constraints.
- Simulation API consumes a serialized graph payload to mimic a real backend contract.

## Functional Coverage

### 1) Workflow Canvas

- Drag nodes from sidebar to canvas
- Connect nodes with edges
- Select nodes from click or canvas selection
- Delete nodes/edges with React Flow delete behavior + panel delete
- Built-in controls/minimap/snap grid

### 2) Node Configuration Forms

- Start Node
  - Start title
  - Optional metadata key-value pairs
- Task Node
  - Title (required in UX)
  - Description
  - Assignee
  - Due date
  - Optional custom fields key-value pairs
- Approval Node
  - Title
  - Approver role
  - Auto-approve threshold
- Automated Step Node
  - Title
  - Action selection from mock API
  - Dynamic action parameters from selected action definition
- End Node
  - End message
  - Summary flag toggle

### 3) Mock API Layer

Implemented in local async mocks:

- `getAutomations()` -> behaves like `GET /automations`
- `simulateWorkflow(payload)` -> behaves like `POST /simulate`

Sample automations include:

- `send_email`
- `generate_doc`
- `send_slack`
- `create_calendar`
- `update_database`
- `webhook`

### 4) Sandbox / Test Panel

- Serializes current graph (`nodes`, `edges`) into simulation payload
- Runs workflow simulation via mock API
- Displays step-by-step execution timeline
- Displays validation errors before simulation when graph is invalid

### 5) Validation Rules

- Exactly one Start node
- At least one End node
- Start cannot have incoming edges
- End cannot have outgoing edges
- No orphan non-start nodes (must have incoming edge)
- No cycles
- All nodes should be reachable from Start
- Edges must reference existing nodes

## How To Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Assumptions

- Persistence/auth are intentionally omitted per assignment.
- Validation remains lightweight and user-friendly, not a full BPMN rule engine.
- Simulation is deterministic and graph-based, returning mocked execution messages.

## What I Would Add With More Time

- Import/export workflow JSON
- Undo/redo stack
- Auto-layout (dagre/elk)
- Node-level inline validation badges
- More advanced branching conditions and runtime context