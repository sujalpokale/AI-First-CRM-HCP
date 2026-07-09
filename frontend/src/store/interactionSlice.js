import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const getEmptyDraft = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  const hours = String(today.getHours()).padStart(2, "0");
  const minutes = String(today.getMinutes()).padStart(2, "0");
  const timeStr = `${hours}:${minutes}`;

  return {
    hcp_name: "",
    interaction_type: "Meeting",
    interaction_date: dateStr,
    interaction_time: timeStr,
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

export const fetchInteractions = createAsyncThunk(
  "interaction/fetchInteractions",
  async () => {
    const response = await fetch(`${API_BASE}/api/interactions`);
    if (!response.ok) throw new Error("Failed to fetch interactions");
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
    interactionsList: [],
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
    selectInteraction(state, action) {
      const interaction = action.payload;
      state.interactionId = interaction.id;
      state.draft = {
        hcp_name: interaction.hcp_name || "",
        interaction_type: interaction.interaction_type || "Meeting",
        interaction_date: interaction.interaction_date || "",
        interaction_time: interaction.interaction_time || "",
        attendees: interaction.attendees || "",
        topics_discussed: interaction.topics_discussed || "",
        materials_shared: interaction.materials_shared || "",
        samples_distributed: interaction.samples_distributed || "",
        sentiment: interaction.sentiment || "Neutral",
        outcomes: interaction.outcomes || "",
        follow_up_actions: interaction.follow_up_actions || "",
        summary: interaction.summary || "",
        compliance_flags: interaction.compliance_flags || "",
      };
      state.saveStatus = "idle";
      state.error = "";
      state.toolCalls = [];
      state.messages = [
        {
          role: "assistant",
          text: `Loaded interaction with ${interaction.hcp_name || "HCP"}. You can edit any details below or chat with me to update the record.`,
        },
      ];
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
        
        // Update list inline if editing
        if (action.payload.interaction_id) {
          const index = state.interactionsList.findIndex((item) => item.id === action.payload.interaction_id);
          if (index !== -1) {
            state.interactionsList[index] = {
              ...state.interactionsList[index],
              ...action.payload.draft,
              id: action.payload.interaction_id,
            };
          }
        }
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
          text: `Interaction ${state.interactionId ? "updated" : "logged"} successfully. The record is saved.`,
        });

        // Update list inline
        const index = state.interactionsList.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.interactionsList[index] = action.payload;
        } else {
          state.interactionsList.unshift(action.payload);
        }
      })
      .addCase(saveInteraction.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchInteractions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.status = "idle";
        state.interactionsList = action.payload;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { updateField, resetDraft, selectInteraction } = interactionSlice.actions;
export default interactionSlice.reducer;
