import { Calendar, Edit, Mic, Plus, RefreshCcw, Save, Search, TestTube2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { resetDraft, saveInteraction, updateField } from "../store/interactionSlice.js";
import { Field, TextArea, TextInput } from "./Field.jsx";

const hcpOptions = ["Dr. Smith", "Dr. Ananya Rao", "Dr. Michael Chen", "Dr. Priya Nair"];

export function InteractionForm() {
  const dispatch = useDispatch();
  const { draft, saveStatus, interactionId } = useSelector((state) => state.interaction);
  const setField = (field) => (value) => dispatch(updateField({ field, value }));

  return (
    <section className="workspace-panel form-panel" aria-label="Log HCP interaction form">
      <div className="panel-header">
        <div>
          <p className="eyebrow">HCP Module</p>
          <div className="title-with-badge">
            <h1>{interactionId ? "Edit Interaction" : "Log HCP Interaction"}</h1>
            {interactionId && <span className="edit-id-badge">ID: #{interactionId}</span>}
          </div>
        </div>
        <button className="icon-button" type="button" onClick={() => dispatch(resetDraft())} aria-label="Reset form" title="Reset form">
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="section-title">Interaction Details</div>
      <div className="form-grid">
        <Field label="HCP Name">
          <TextInput value={draft.hcp_name} list="hcp-list" placeholder="Search or select HCP..." onChange={setField("hcp_name")} />
          <datalist id="hcp-list">
            {hcpOptions.map((hcp) => (
              <option key={hcp} value={hcp} />
            ))}
          </datalist>
        </Field>
        <Field label="Interaction Type">
          <select value={draft.interaction_type} onChange={(event) => setField("interaction_type")(event.target.value)}>
            <option>Meeting</option>
            <option>Phone Call</option>
            <option>Email</option>
            <option>Conference</option>
            <option>Virtual Meeting</option>
          </select>
        </Field>
        <Field label="Date">
          <div className="input-icon">
            <TextInput type="date" value={draft.interaction_date} onChange={setField("interaction_date")} />
            <Calendar size={17} />
          </div>
        </Field>
        <Field label="Time">
          <TextInput type="time" value={draft.interaction_time} onChange={setField("interaction_time")} />
        </Field>
      </div>

      <Field label="Attendees">
        <TextInput value={draft.attendees} placeholder="Enter names or search..." onChange={setField("attendees")} />
      </Field>

      <Field label="Topics Discussed">
        <TextArea value={draft.topics_discussed} placeholder="Enter key discussion points..." onChange={setField("topics_discussed")} rows={5} />
      </Field>

      <button className="text-action" type="button">
        <Mic size={16} />
        Summarize from Voice Note (Requires Consent)
      </button>

      <div className="section-title">Materials Shared / Samples Distributed</div>
      <div className="inline-row">
        <Field label="Materials Shared">
          <TextInput value={draft.materials_shared} placeholder="No materials added." onChange={setField("materials_shared")} />
        </Field>
        <button className="small-button" type="button">
          <Search size={16} />
          Search/Add
        </button>
      </div>

      <div className="inline-row">
        <Field label="Samples Distributed">
          <TextInput value={draft.samples_distributed} placeholder="No samples added." onChange={setField("samples_distributed")} />
        </Field>
        <button className="small-button" type="button">
          <Plus size={16} />
          Add Sample
        </button>
      </div>

      <div className="section-title">Observed/Inferred HCP Sentiment</div>
      <div className="segmented">
        {["Positive", "Neutral", "Negative"].map((sentiment) => (
          <button
            type="button"
            key={sentiment}
            className={draft.sentiment === sentiment ? "active" : ""}
            onClick={() => setField("sentiment")(sentiment)}
          >
            {sentiment}
          </button>
        ))}
      </div>

      <Field label="Outcomes">
        <TextArea value={draft.outcomes} placeholder="Key outcomes or agreements..." onChange={setField("outcomes")} rows={4} />
      </Field>

      <Field label="Follow-up Actions">
        <TextArea value={draft.follow_up_actions} placeholder="Next best action, owner, and due date..." onChange={setField("follow_up_actions")} rows={3} />
      </Field>

      <div className="compliance">
        <TestTube2 size={18} />
        <span>{draft.compliance_flags || "Compliance review will appear after AI extraction."}</span>
      </div>

      <button className="primary save-button" type="button" onClick={() => dispatch(saveInteraction())}>
        {interactionId ? <Edit size={18} /> : <Save size={18} />}
        {saveStatus === "saving" 
          ? (interactionId ? "Updating..." : "Saving...") 
          : saveStatus === "saved" 
            ? (interactionId ? "Updated" : "Saved") 
            : (interactionId ? "Update Interaction" : "Log Interaction")}
      </button>
    </section>
  );
}
