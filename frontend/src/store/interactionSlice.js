import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const getEmptyDraft = () => {
  const today = new Date();
  const time = today.toTimeString().slice(0, 5);
  return {
    hcp_name: "",
    interaction_type: "Meeting",
    interaction_date: today.toISOString().slice(0, 10),
    interaction_time: time,
    attendees: "",
    topics_discussed: "",
    materials_shared: "",
    samples_distributed: "",
    sentiment: "Neutral",
    outcomes: "",
    follow_up_actions: "",
    summary: "",
    compliance_flags: "",
  };
};

export const sendAgentMessage = createAsyncThunk(
  "interaction/sendAgentMessage",
  async (message, { getState }) => {
    const { draft, interactionId } = getState().interaction;
    const response = await fetch(`${API_BASE}/api/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, draft, interaction_id: interactionId }),
    });
    if (!response.ok) throw new Error("Assistant request failed");
    return response.json();
  },
);

export const saveInteraction = createAsyncThunk(
  "interaction/saveInteraction",
  async (_, { getState }) => {
    const { draft, interactionId } = getState().interaction;
    const url = interactionId ? `${API_BASE}/api/interactions/${interactionId}` : `${API_BASE}/api/interactions`;
    const response = await fetch(url, {
      method: interactionId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!response.ok) throw new Error("Save failed");
    return response.json();
  },
);

const interactionSlice = createSlice({
  name: "interaction",
  initialState: {
    draft: getEmptyDraft(),
    interactionId: null,
    status: "idle",
    saveStatus: "idle",
    error: "",
    toolCalls: [],
    messages: [
      {
        role: "assistant",
        text:
          'Log interaction details here. Example: "Met Dr. Smith, discussed Prodo-X efficacy, positive sentiment, shared brochure."',
      },
    ],
  },
  reducers: {
    updateField(state, action) {
      const { field, value } = action.payload;
      state.draft[field] = value;
    },
    resetDraft(state) {
      state.draft = getEmptyDraft();
      state.interactionId = null;
      state.toolCalls = [];
      state.messages = state.messages.slice(0, 1);
      state.saveStatus = "idle";
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendAgentMessage.pending, (state, action) => {
        state.status = "loading";
        state.error = "";
        state.messages.push({ role: "user", text: action.meta.arg });
      })
      .addCase(sendAgentMessage.fulfilled, (state, action) => {
        state.status = "idle";
        state.draft = action.payload.draft;
        state.toolCalls = action.payload.tool_calls;
        state.messages.push({ role: "assistant", text: action.payload.reply });
      })
      .addCase(sendAgentMessage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(saveInteraction.pending, (state) => {
        state.saveStatus = "saving";
        state.error = "";
      })
      .addCase(saveInteraction.fulfilled, (state, action) => {
        state.saveStatus = "saved";
        state.interactionId = action.payload.id;
        state.draft = action.payload;
        state.messages.push({
          role: "assistant",
          text: "Interaction logged successfully. The record is saved and ready for later edits.",
        });
      })
      .addCase(saveInteraction.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export const { updateField, resetDraft } = interactionSlice.actions;
export default interactionSlice.reducer;
