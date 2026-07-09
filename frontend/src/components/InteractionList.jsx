import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInteractions, selectInteraction, resetDraft } from "../store/interactionSlice.js";
import { Calendar, Mail, MessageSquare, Phone, PlusCircle, Search } from "lucide-react";

const formatDate = (dateStr) => {
  if (!dateStr) return "No Date";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    return dateObj.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return dateStr;
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' becomes '12'
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeStr;
};

export function InteractionList() {
  const dispatch = useDispatch();
  const { interactionsList, interactionId, status } = useSelector((state) => state.interaction);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  const getTypeIcon = (type) => {
    switch (type) {
      case "Phone Call":
        return <Phone size={15} />;
      case "Email":
        return <Mail size={15} />;
      case "Conference":
        return <Calendar size={15} />;
      default:
        return <MessageSquare size={15} />;
    }
  };

  const getSentimentClass = (sentiment) => {
    switch (sentiment) {
      case "Positive":
        return "sentiment-pos";
      case "Negative":
        return "sentiment-neg";
      default:
        return "sentiment-neu";
    }
  };

  const filteredInteractions = interactionsList.filter((item) => {
    const term = search.toLowerCase();
    const hcpName = (item.hcp_name || "").toLowerCase();
    const topics = (item.topics_discussed || "").toLowerCase();
    const type = (item.interaction_type || "").toLowerCase();
    return hcpName.includes(term) || topics.includes(term) || type.includes(term);
  });

  return (
    <aside className="workspace-panel history-panel" aria-label="Interaction history list">
      <div className="history-header">
        <div>
          <h2>Logged Interactions</h2>
          <p>Select a record to view or edit</p>
        </div>
        <button
          className="new-button"
          type="button"
          onClick={() => dispatch(resetDraft())}
          aria-label="New interaction"
          title="Start a new interaction record"
        >
          <PlusCircle size={16} />
          New
        </button>
      </div>

      <div className="search-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Filter interactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="history-list">
        {status === "loading" && interactionsList.length === 0 ? (
          <div className="status-message">Loading records...</div>
        ) : filteredInteractions.length === 0 ? (
          <div className="status-message">
            {search ? "No matching interactions found." : "No interactions logged yet."}
          </div>
        ) : (
          filteredInteractions.map((item) => {
            const isActive = interactionId === item.id;
            return (
              <div
                key={item.id}
                className={`history-item ${isActive ? "active" : ""}`}
                onClick={() => dispatch(selectInteraction(item))}
              >
                <div className="item-meta">
                  <span className={`type-badge ${item.interaction_type?.toLowerCase().replace(" ", "-")}`}>
                    {getTypeIcon(item.interaction_type)}
                    <span>{item.interaction_type}</span>
                  </span>
                  <span className={`sentiment-dot ${getSentimentClass(item.sentiment)}`} title={`Sentiment: ${item.sentiment}`} />
                </div>
                <div className="item-hcp">{item.hcp_name || "Unknown HCP"}</div>
                {item.topics_discussed && (
                  <p className="item-snippet" title={item.topics_discussed}>
                    {item.topics_discussed.length > 70
                      ? `${item.topics_discussed.slice(0, 67)}...`
                      : item.topics_discussed}
                  </p>
                )}
                <div className="item-date">
                  {formatDate(item.interaction_date)}
                  {item.interaction_time ? ` · ${formatTime(item.interaction_time)}` : ""}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
