# AI-First CRM HCP Module

An implementation of an **AI-first Healthcare Professional (HCP) CRM interaction logger** featuring Redux-managed React UI, an interactive agentic chat helper, and database persistence.

---

## 🌟 Key Features

### 1. Unified Log & Edit Workflows
- **Create Records**: Log full HCP interactions using the structured form or natural language chat notes.
- **Interactive History Sidebar**: View, search, and filter previous records dynamically.
- **Edit Records**: Select any past interaction from the history list to load its contents. Any subsequent edits (via form fields or chat instructions) will update the existing database record directly.

### 2. Conversational AI Assistant (LangGraph & LLM)
- Natural language notes are automatically extracted into structured CRM fields.
- Leverages a Graph workflow containing:
  - `log_interaction`: Extract details from message note.
  - `edit_interaction`: Updates database record if an active ID is selected.
  - `hcp_profile_lookup`: Autocompletes attendee lists using HCP directories.
  - `materials_recommendation`: Suggests literature or handouts based on topics discussed.
  - `compliance_check`: Flags potential compliance hazards (e.g. gifts, cash, guarantees).
  - `suggest_follow_up`: Automates action items based on inferred sentiment.

### 3. Date, Time & Classification Enhancements
- **Timezone-Safe Dates**: Eliminates the JavaScript date parsing timezone-shift bug.
- **UX Readability**: Formats timeline schedules inside the history panel to 12-hour AM/PM local time.
- **Strict Mapping**: Standardizes model extractions to conform exactly to frontend configuration types (Meeting, Phone Call, Email, Conference, Virtual Meeting) and sentiments (Positive, Neutral, Negative).

---

## 🚀 Setup & Execution

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**

---

### 2. Run Backend

Navigate to the `backend` folder, configure environment variables, install dependencies, and start the FastAPI server:

```powershell
cd backend
# Create environment configuration
copy .env.example .env

# Install requirements
python -m pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

> [!NOTE]
> Set `GROQ_API_KEY` in `backend/.env` to enable advanced Groq LLM extraction (utilizing `gemma2-9b-it`). If left empty, the application falls back to a regex-based heuristic extractor so the application remains fully testable offline.

#### Database Configurations (Optional)
The system defaults to a local SQLite database (`hcp_crm.db`). You can override this in `backend/.env` with production databases (e.g., PostgreSQL or MySQL):
- **Postgres**: `DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/hcp_crm`
- **MySQL**: `DATABASE_URL=mysql+pymysql://user:password@localhost:3306/hcp_crm`

---

### 3. Run Frontend

Navigate to the `frontend` folder, install Node modules, and run the Vite dev server:

```powershell
cd frontend
npm install
npm run dev
```

The application will start running locally at: **`http://127.0.0.1:5173`** and proxy API calls to the backend on `http://127.0.0.1:8000`.

---

## 🧪 Demo Scenarios

### Scenario A: Log New Interaction & Format Checks
1. In the AI Assistant chat box, paste this note and click **Log**:
   > `"Yesterday (2026-07-08) at 2:30 PM, I had a virtual Zoom call with Dr. Michael Chen. We discussed Prodo-X efficacy. Sentiment was negative due to pricing concerns. Shared product monograph."`
2. Form fields auto-populate. Verify **Virtual Meeting** is selected, and Date/Time read `2026-07-08` / `14:30`.
3. Click **Log Interaction**.
4. In the history panel, verify it lists under **Jul 8, 2026** at **2:30 PM** with a **Red dot** (Negative sentiment) and a **Virtual Meeting** badge.

### Scenario B: Edit Interaction & Compliance Warnings
1. Click **New** in the sidebar. Paste:
   > `"On July 1st at 10 AM, I emailed Dr. Priya Nair to follow up on clinical studies. Neutral sentiment."`
2. Click **Log Interaction**.
3. Select **Dr. Priya Nair**'s record in the sidebar to activate edit mode.
4. Type in the AI chat:
   > `"Actually, the sentiment was positive, she asked for samples, and promised a guaranteed outcome if we send a gift."`
5. The form state updates: Sentiment becomes **Positive**, and a warning banner appears flagging the compliance risk (*guaranteed outcome* and *gift*). The database record and history list are updated instantly.
