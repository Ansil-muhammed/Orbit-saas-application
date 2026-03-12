# Product Requirements Document (PRD): Project "Orbit" (SaaS Task Management)

## 1. Project Overview
Orbit is a high-performance, drag-and-drop task management platform. It allows teams to organize projects into visual boards, manage task lifecycles, and track activity in real-time.

## 2. Core Functional Requirements

### Phase 1: Foundation & Security
* **User Auth**: Secure signup/login using JWT.
* **Workspace Isolation**: Users can create multiple Workspaces; data must be strictly siloed so users only see boards they have access to.

### Phase 2: The Board Engine
* **Board Creation**: Dynamic board generation with custom titles.
* **List Management**: Create columns (e.g., "To Do," "In Progress," "Done").
* **Task Cards**: Create, Edit, and Delete cards within lists.
* **Drag-and-Drop**: Seamlessly move cards between lists or reorder within a single list.

### Phase 3: Collaboration & Context
* **Comments**: Nested conversation threads on individual task cards.
* **Activity Feed**: A "Recent History" log showing who moved what and when.

## 3. Technical Architecture

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React + Tailwind | Component-based UI with rapid styling. |
| **State** | TanStack Query (React Query) | Essential for syncing server state with UI. |
| **Backend** | Django + DRF | Robust ORM for complex PostgreSQL relationships. |
| **Database** | PostgreSQL | Relational integrity for Workspace/Board hierarchies. |
| **DND** | @hello-pangea/dnd | The industry standard for accessible drag-and-drop. |

## 4. Database Schema (High-Level)
To impress recruiters, the PostgreSQL schema should look like this:
* **User**: `ID, Email, Password, Avatar`
* **Workspace**: `ID, Name, Owner_ID`
* **Board**: `ID, Title, Workspace_ID`
* **List**: `ID, Title, Board_ID, Position (Integer)`
* **Task**: `ID, Title, Description, List_ID, Position (Integer)`
* **Comment**: `ID, Content, Task_ID, User_ID, Created_At`

## 5. Implementation Roadmap (AI-Assisted)

### Step 1: The Backend Backbone
* **Prompt for AI**: "Generate a Django model structure for a Trello clone including Workspace, Board, List, and Task models. Use ForeignKeys to link them and include a 'position' field for ordering."
* **Goal**: Set up Django REST Framework (DRF) serializers and views.

### Step 2: Frontend Scaffolding
* **Prompt for AI**: "Create a React dashboard layout using Tailwind CSS with a sidebar for Workspaces and a main content area for the Board view."
* **Goal**: Establish the visual "shell."

### Step 3: The "Wow" Factor (Drag-and-Drop)
* **Prompt for AI**: "Using @hello-pangea/dnd, implement a drag-and-drop interface where I can move cards between three hardcoded columns. Then, help me connect this to a Django PATCH endpoint to save the new position."

## 6. Recruiter "Easter Eggs"
To make this stand out, we should add these "Senior-level" touches:
* **Optimistic Updates**: When a user drags a card, the UI updates instantly before the server responds.
* **Debounced Search**: A search bar that filters tasks across the whole board.
* **Loading Skeletons**: Professional "shimmer" effects instead of generic spinners.
