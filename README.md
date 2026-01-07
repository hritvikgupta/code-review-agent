# Code Explanation Agent - Take Home Project

Build an AI agent that explains code using natural language.

## 🎯 The Challenge

Create an agent that:

1. Accepts code via a chat interface
2. Analyzes and explains the code
3. Answers follow-up questions
4. Streams responses in real-time

**What's provided:**

- ✅ FastAPI skeleton with `/explain` endpoint
- ✅ React frontend with CopilotKit chat UI
- ⚠️ ~~Groq LLM integration~~ → **Using OpenAI instead But added the GROQ_API_KEY and GROQ_MODEL support also** (see note below)

> **Note on LLM Choice:** Groq was not used because the Groq free tier was quite slow for workflow. So i just used my own OpenAI (gpt-4o) for faster inferenceing.  But i added the GROQ_API_KEY and GROQ_MODEL support also.

**What you implement:**

- ⬜ Agent architecture (how do you structure the code?)
- ⬜ Code analysis logic (AST parsing? LLM prompts? Tools?)
- ⬜ Response streaming
- ⬜ Error handling

## 🚀 Quick Start

### Prerequisites

```bash
# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Get free Groq API key
# https://console.groq.com/
```

### Setup

```bash
# Backend
cd backend
uv sync
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Run
uv run python main.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

## 📋 Requirements

### Minimum (2-3 hours)

Your agent should:

- ✅ Explain what code does (basic understanding)
- ✅ Identify potential issues
- ✅ Suggest improvements
- ✅ Stream responses to the UI
- ✅ Handle errors gracefully

## ✅ Evaluation Criteria

We'll evaluate on:

1. **Code Organization** (30%)

   - How did you structure your code?
   - Is it easy to understand and maintain?
   - Good separation of concerns?

2. **Implementation Quality** (30%)

   - Does it work end-to-end?
   - Clean, readable code?
   - Proper error handling?
   - Type hints used appropriately?

3. **Architecture Decisions** (25%)

   - Smart use of LLM vs traditional parsing?
   - Good tool design (if applicable)?
   - Appropriate abstractions?

4. **Documentation** (15%)
   - Clear README explaining your approach
   - Inline comments where helpful
   - Design decisions documented

## 🔧 Development Commands

```bash
# Run server
uv run python main.py

# Run with auto-reload
uv run uvicorn main:app --reload

# Add a package
uv add package-name

# Run tests (if you add them)
uv run pytest
```

## 📝 Submission Guidelines

### Update This README

Add a new section at the bottom explaining:

1. **Architecture Overview**

   - How did you structure your code?
   - What files did you create and why?

2. **Design Decisions**

   - Why did you choose this approach?
   - What trade-offs did you make?

3. **How It Works**

   - Brief explanation of the flow
   - Key functions/classes

4. **What Would You Improve?**
   - With more time, what would you add?
   - Known limitations?

### Testing

Make sure:

- Both backend and frontend run without errors
- Can paste code and get a response
- Streaming works (not just one big chunk at the end)
- Error messages are helpful

### Code Quality

- Use type hints
- Add docstrings to classes/functions
- Handle edge cases (empty input, invalid code, etc.)
- Clean, readable code

## ❓ Questions?

If anything is unclear, make reasonable assumptions and document them in your README submission.

Good luck! 🚀

---

## 📝 Your Implementation

### Architecture Overview

The application follows a **clean separation** between frontend and backend, with a multi-agent system orchestrated by LangGraph.

#### Project Structure

```
with-langgraph-fastapi/
├── frontend/                              # Next.js React Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                   # Main IDE-like interface
│   │   │   ├── layout.tsx                 # Root layout with providers
│   │   │   └── api/copilotkit/route.ts    # CopilotKit API endpoint
│   │   ├── components/
│   │   │   ├── CodeExplainer.tsx          # Monaco editor with CopilotKit hooks
│   │   │   ├── FileExplorer.tsx           # Left sidebar file tree
│   │   │   ├── Toast.tsx                  # Error notification system
│   │   │   ├── issues/                    # Bug/Issue tracker components
│   │   │   │   ├── IssueList.tsx
│   │   │   │   ├── IssueDetail.tsx
│   │   │   │   └── CreateIssue.tsx
│   │   │   └── layout/
│   │   │       ├── Header.tsx
│   │   │       └── Tabs.tsx
│   │   ├── lib/errors/                    # Centralized error handling
│   │   └── types/                         # TypeScript type definitions
│   └── package.json
│
├── backend/                               # FastAPI + LangGraph Backend
│   ├── src/code_review_agent/
│   │   ├── agent.py                       # Main LangGraph workflow definition
│   │   ├── state.py                       # Shared state schema (TypedDict)
│   │   ├── error_handler.py               # Production-scale error tracking
│   │   ├── agents/                        # Specialized AI Agents
│   │   │   ├── analyzer_agent.py          # Explains code structure
│   │   │   ├── validator_agent.py         # Finds bugs and issues
│   │   │   ├── summarizer_agent.py        # Combines results
│   │   │   ├── supervisor.py              # Agent coordination tools
│   │   │   └── nodes/                     # LangGraph node implementations
│   │   │       ├── entry_node.py          # Extracts code from context
│   │   │       ├── validation_node.py     # Runs validator
│   │   │       ├── analyzer_node.py       # Runs analyzer
│   │   │       └── summarizer_node.py     # Final output
│   │   ├── tools/                         # LangChain tools
│   │   │   ├── ast_tools.py               # Python AST parsing
│   │   │   ├── file_tools.py              # File operations
│   │   │   └── validation_tools.py        # Code validation
│   │   └── prompts/
│   │       └── prompts.py                 # Centralized LLM prompts
│   ├── main.py                            # FastAPI server entry point
│   └── pyproject.toml
│
├── README.md
├── LICENSE
└── .env                                   # Environment variables
```

#### LangGraph Workflow

The agent uses a **sequential graph architecture** where each node performs a specific task:

```
┌─────────────┐    ┌──────────────────┐    ┌───────────────┐    ┌──────────────────┐
│ entry_node  │───▶│ validation_node  │───▶│ analyzer_node │───▶│ summarizer_node  │───▶ END
└─────────────┘    └──────────────────┘    └───────────────┘    └──────────────────┘
      │                    │                       │                      │
      ▼                    ▼                       ▼                      ▼
 Extract code        Find bugs &            Explain code           Combine all
 from CopilotKit     suggest fixes          structure              results
```

**Node Responsibilities:**

| Node | Purpose | Output |
|------|---------|--------|
| `entry_node` | Extracts user's code from CopilotKit readable context | `user_code` in state |
| `validation_node` | Runs validator agent to find syntax errors, bugs, antipatterns | `validation_results` |
| `analyzer_node` | Runs analyzer agent to explain structure, imports, functions | `analyzer_results` |
| `summarizer_node` | Combines validation + analysis into human-readable summary | Final response |

#### Frontend Components

| Component | Purpose |
|-----------|---------|
| `page.tsx` | Main IDE interface with file explorer, editor, issues tracker |
| `CodeExplainer.tsx` | Monaco editor + CopilotKit hooks for code sharing |
| `FileExplorer.tsx` | Tree-view file browser with project switching |
| `Toast.tsx` | Toast notification system for errors (top-right, 2s) |
| `IssuesView` | GitHub-style issue/bug tracker with comments |

---

### Design Decisions

First i have decided though working with design supervisor agents that contain one suppisor agent and then add other agents to it as a tool so that it call the other agents as per need , analyze and provide the results. But the main problem is it is quite slow. What now i have done is the linear workflow where we validate, analyze and then summarize the results. There are two agents in the backup which are fetch agent and supervisor agent that we use when we go production scale and clone the large repo for complet analyze and parsing of code. 

#### 1. Linear Flow Multi-Agent Architecture
Split responsibilities into specialized agents rather than one monolithic LLM call. Each agent has its own set of **tools** and a focused **system prompt**.

##### Analyzer Agent (`analyzer_agent.py`)
**Purpose**: Explains code structure, imports, functions, and behavior.

| Tool | Description |
|------|-------------|
| `parse_python_code(code)` | Parses Python code using AST and returns structure (imports, functions, classes, global variables) |
| `extract_functions(code)` | Extracts all function definitions with signatures, parameters, return types, and docstrings |
| `get_code_complexity(code)` | Analyzes complexity metrics (line count, nesting depth, loop count, conditional count) |

##### Validator Agent (`validator_agent.py`)
**Purpose**: Finds bugs, syntax errors, antipatterns, and suggests improvements.

| Tool | Description |
|------|-------------|
| `check_syntax(code)` | Validates Python syntax using AST parsing, returns errors if any |
| `find_common_issues(code)` | Detects common issues: bare except clauses, unused variables, TODO comments, long lines, magic numbers, missing docstrings, print statements |
| `suggest_improvements(code)` | Suggests improvements: type hints, error handling, list comprehensions, context managers, named constants |

##### Summarizer Agent (`summarizer_agent.py`)
**Purpose**: Combines validation and analyzer results into a comprehensive, user-friendly summary.

| Tool | Description |
|------|-------------|
| *(No tools)* | Uses pure LLM capabilities to aggregate and format results from other agents |

##### Fetch Agent (`fetch_agent.py`) - *Backup for Production*
**Purpose**: Reads files and explores codebase structure for large repository analysis.

| Tool | Description |
|------|-------------|
| `read_file(path)` | Reads and returns contents of a file |
| `list_directory(path)` | Lists files and subdirectories in a folder |
| `get_file_info(path)` | Returns file metadata (size, modification date, type) |

##### Supervisor Agent (`supervisor.py`) - *Backup for Production*
**Purpose**: Orchestrates other agents dynamically based on user requests.

| Tool | Description |
|------|-------------|
| `analyze_code(request)` | Invokes the Analyzer Agent |
| `validate_code(request)` | Invokes the Validator Agent |

**Why this architecture?** Each agent has a focused system prompt with specific tools, leading to more accurate and faster outputs than a single large agent trying to do everything.

#### 2. AST Parsing + LLM Hybrid
Combined Python's `ast` module with LLM analysis:

```python
# ast_tools.py - Accurate structural data
parse_python_code(code)       # Returns imports, functions, classes
extract_functions(code)        # Function signatures + docstrings
get_code_complexity(code)      # Nesting depth, loop count, etc.
```

**Why?** AST gives deterministic, accurate structure. LLM provides natural language explanations. Best of both worlds.

#### 3. Sequential Graph Flow
Used a linear workflow instead of dynamic routing:
```
entry → validation → analyzer → summarizer → end
```

**Why?** Predictable execution, easier debugging, simpler state management.

#### 4. CopilotKit Integration
Leveraged CopilotKit's AG-UI protocol:
- `useCopilotReadable()` - Shares code context with agent
- `useCopilotAction()` - Defines callable actions
- Real-time streaming via Server-Sent Events

**Why?** Handles message formatting, streaming, and state sync automatically.

#### 5. Comprehensive Error Handling
Implemented a production-scale error system:
- **Backend**: `error_handler.py` with structured logging, metrics, request tracking
- **Frontend**: `Toast.tsx` + global error listeners for user feedback
- **API**: Custom HTTP exception classes with proper status codes

---

### How to Test

#### Quick Start
```bash
# Terminal 1 - Backend
cd backend && uv run main.py
# Runs on http://localhost:8123

# Terminal 2 - Frontend
cd frontend && npm run dev
# Runs on http://localhost:3000
```

#### Test Cases

| Test | Input | Expected Result |
|------|-------|-----------------|
| Basic explanation | `print("Hello")` | Explains print statement, mentions stdout |
| Function analysis | `def add(a,b): return a+b` | Explains signature, parameters, return value |
| Bug detection | `x = 1; y = 2; print(z)` | Identifies undefined variable `z` |
| Class structure | Paste a class with methods | Lists methods, docstrings, inheritance |
| Syntax error | `def foo(` | Reports syntax error gracefully |
| Empty input | Send message without code | Handles gracefully, asks for code |

#### Error Handling Test
1. Stop the backend server (`Ctrl+C`)
2. Send a message in the chat
3. Toast notification should appear: "Backend service unavailable"

---

### Future Improvements

#### 🔧 Core Enhancements

| Feature | Description |
|---------|-------------|
| **Multi-language AST** | Add parsers for JavaScript (`@babel/parser`), TypeScript, Go, Rust |
| **Incremental Analysis** | Only re-analyze changed code sections |
| **Caching Layer** | Redis/SQLite cache for duplicate code analysis |
| **Code Fix Generation** | Output actual fixed code, not just descriptions |

#### 🤖 New Agent Integrations

The frontend already has UI components ready for these agents:

##### 1. **README Agent**
- **Purpose**: Auto-generate or update README.md based on codebase analysis
- **Integration**: Uses the "readme" tab in the editor
- **How it works**:
  ```
  readme_agent analyzes:
  ├── Project structure
  ├── Main entry points
  ├── Dependencies (package.json, pyproject.toml)
  ├── API endpoints
  └── Outputs: Markdown README
  ```

##### 2. **Bug Agent**
- **Purpose**: Creates GitHub-style issues for detected bugs
- **Integration**: Populates the "Bug" tab in the Issues view
- **How it works**:
  ```
  bug_agent workflow:
  ├── Receives validation results
  ├── Classifies severity (critical, major, minor)
  ├── Creates Issue object with:
  │   ├── Title (bug summary)
  │   ├── Description (detailed explanation)
  │   ├── Suggested fix
  │   └── Line numbers
  └── Displays in IssuesView component
  ```

##### 3. **Documentation Agent**
- **Purpose**: Generates inline documentation (docstrings, comments)
- **Integration**: Could add a "Document" button in editor
- **Output**: Adds `"""docstrings"""` to functions/classes

##### 4. **Refactor Agent**
- **Purpose**: Suggests code refactoring (extract method, rename, simplify)
- **Integration**: Right-click menu or dedicated panel
- **Output**: Side-by-side original vs. refactored code

##### 5. **Test Generator Agent**
- **Purpose**: Generates pytest/unittest test cases
- **Integration**: "Generate Tests" button
- **Output**: Test file with assertions based on code analysis

#### 🎨 Frontend Enhancements

| Feature | Description |
|---------|-------------|
| **Real file system** | Connect to actual local files via Electron or file upload |
| **Persistent projects** | Save projects to localStorage or database |
| **Syntax highlighting themes** | Light/dark mode toggle for editor |
| **Collaboration** | Multi-user editing with WebSocket sync |

#### 📊 Observability

| Feature | Description |
|---------|-------------|
| **Metrics dashboard** | Display agent execution times, success rates |
| **Request tracing** | OpenTelemetry integration for debugging |
| **Cost tracking** | Track LLM token usage per request |

---

### Known Limitations

1. **Python-only AST**: Currently only parses Python syntax
2. **No real file I/O**: Uses mock file system in frontend
3. **Stateless sessions**: Chat history not persisted between refreshes
4. **Single LLM**: Using OpenAI; could add Anthropic, Groq fallbacks
