import { Bot, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendAgentMessage } from "../store/interactionSlice.js";

export function AIAssistant() {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const { messages, status, toolCalls, error } = useSelector((state) => state.interaction);

  const submit = (event) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || status === "loading") return;
    dispatch(sendAgentMessage(trimmed));
    setMessage("");
  };

  return (
    <aside className="workspace-panel assistant-panel" aria-label="AI assistant">
      <div className="assistant-header">
        <div className="assistant-icon">
          <Bot size={24} />
        </div>
        <div>
          <h2>AI Assistant</h2>
          <p>Log interaction details via chat</p>
        </div>
      </div>

      <div className="chat-stream">
        {messages.map((item, index) => (
          <div key={`${item.role}-${index}`} className={`message ${item.role}`}>
            {item.text}
          </div>
        ))}
        {status === "loading" && <div className="message assistant">Extracting details and checking next best action...</div>}
        {error && <div className="message error">{error}</div>}
      </div>

      <div className="tool-strip">
        <Sparkles size={16} />
        <span>{toolCalls.length ? toolCalls.join(" · ") : "LangGraph tools ready"}</span>
      </div>

      <form className="chat-form" onSubmit={submit}>
        <textarea
          value={message}
          placeholder="Describe interaction..."
          rows={2}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button className="primary" type="submit" aria-label="Send to AI assistant" title="Send to AI assistant">
          <Send size={19} />
          <span>Log</span>
        </button>
      </form>
    </aside>
  );
}
