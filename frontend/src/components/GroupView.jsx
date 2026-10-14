import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import useChatStore from "../store/useChatStore";
import Avatar from "./Avatar";
import ChatWindow from "./ChatWindow";
import toast from "react-hot-toast";
import {
  getGroupPolls,
  voteGroupPoll,
  getGroupTasks,
  toggleGroupTask,
  addGroupTask,
  getGroupEvents,
  toggleEventRsvp,
  getGroupFiles,
} from "../services/groupExtrasService";

const TABS = ["Chat", "Polls", "Tasks", "Files", "Events"];

const GroupView = () => {
  const { authUser } = useAuth();
  const { selectedGroup, onlineUsers } = useChatStore();
  const [activeTab, setActiveTab] = useState("Chat");

  const groupId = selectedGroup?._id || "default-group";
  const [polls, setPolls] = useState(() => getGroupPolls(groupId));
  const [tasks, setTasks] = useState(() => getGroupTasks(groupId));
  const [events, setEvents] = useState(() => getGroupEvents(groupId));
  const [files, setFiles] = useState(() => getGroupFiles(groupId));
  const [newTaskInput, setNewTaskInput] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    if (selectedGroup?._id) {
      setPolls(getGroupPolls(selectedGroup._id));
      setTasks(getGroupTasks(selectedGroup._id));
      setEvents(getGroupEvents(selectedGroup._id));
      setFiles(getGroupFiles(selectedGroup._id));
    }
  }, [selectedGroup?._id]);

  if (!selectedGroup) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--ng-bg)",
          gap: 16,
          padding: 24,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "var(--r-tile)",
            background: "var(--ng-panel)",
            border: "1px solid var(--ng-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          👥
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--ng-text)", margin: "0 0 6px" }}>
            No group selected
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-muted)", margin: 0 }}>
            Pick a group from the sidebar to view chat, polls, tasks, and events
          </p>
        </div>
      </div>
    );
  }

  // Participants & online counts
  const participants = selectedGroup.participants || [];
  const onlineCount = participants.filter((p) => {
    const id = p._id || p;
    return (onlineUsers || []).includes(id);
  }).length;

  // Poll voting handler
  const handleVote = (pollId, optionId) => {
    const updated = voteGroupPoll(groupId, pollId, optionId, authUser?._id);
    setPolls(updated);
    toast.success("Vote recorded! (Demo service)");
  };

  // Task toggle handler
  const handleToggleTask = (taskId) => {
    const updated = toggleGroupTask(groupId, taskId);
    setTasks(updated);
  };

  const handleAddNewTask = (e) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const updated = addGroupTask(groupId, newTaskInput);
    setTasks(updated);
    setNewTaskInput("");
    setShowAddTask(false);
    toast.success("Task added");
  };

  // Event RSVP handler
  const handleRsvp = (eventId) => {
    const updated = toggleEventRsvp(groupId, eventId, authUser?._id);
    setEvents(updated);
    const ev = updated.find((e) => e.id === eventId);
    const isGoing = ev?.attendees?.[authUser?._id] === "going";
    toast.success(isGoing ? "RSVP confirmed: Going!" : "RSVP removed");
  };

  const handleInvite = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
    }
    toast.success(`Invite link for "${selectedGroup.groupName}" copied!`);
  };

  // Completed task stats
  const completedTaskCount = tasks.filter((t) => t.completed).length;

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--ng-bg)",
        overflow: "hidden",
      }}
    >
      {/* ================= GROUP HEADER (NG2) ================= */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--ng-border)",
          background: "var(--ng-panel)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--ng-text)", margin: "0 0 2px" }}>
            {selectedGroup.groupName}
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: 0 }}>
            {participants.length} members · {onlineCount > 0 ? `${onlineCount} online` : "offline"}
          </p>
        </div>

        {/* Stacked Avatars + Invite Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {participants.slice(0, 4).map((p, idx) => (
              <div
                key={p._id || idx}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "2px solid var(--ng-panel)",
                  marginLeft: idx > 0 ? -8 : 0,
                  overflow: "hidden",
                }}
              >
                <Avatar
                  src={p.profilepic}
                  name={p.fullname || p.username}
                  size={24}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleInvite}
            style={{
              background: "var(--ng-hover)",
              color: "var(--ng-text)",
              border: "1px solid var(--ng-border)",
              borderRadius: "var(--r-btn)",
              padding: "6px 16px",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--ng-accent)";
              e.currentTarget.style.background = "var(--ng-border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--ng-border)";
              e.currentTarget.style.background = "var(--ng-hover)";
            }}
          >
            Invite
          </button>
        </div>
      </div>

      {/* ================= TABS NAVIGATION (NG2) ================= */}
      <div
        style={{
          padding: "10px 24px",
          borderBottom: "1px solid var(--ng-border)",
          background: "var(--ng-panel)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: isSelected ? "var(--ng-accent)" : "transparent",
                color: isSelected ? "var(--ng-accent-fg)" : "var(--ng-muted)",
                border: "none",
                borderRadius: 99,
                padding: "6px 16px",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.color = "var(--ng-text)";
                  e.currentTarget.style.background = "var(--ng-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.color = "var(--ng-muted)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ================= TAB CONTENT CONTAINER ================= */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === "Chat" ? (
          /* EMBEDDED REAL GROUP CHAT */
          <ChatWindow />
        ) : (
          /* EXTRAS DASHBOARD (POLLS, TASKS, FILES, EVENTS) */
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Top row: Polls + Tasks (NG2) */}
            {(activeTab === "Polls" || activeTab === "Tasks") && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
                
                {/* ---- POLLS CARD ---- */}
                <div
                  style={{
                    background: "var(--ng-panel)",
                    border: "1px solid var(--ng-border)",
                    borderRadius: "var(--r-card)",
                    padding: "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {polls.map((poll) => {
                    const totalVotes = poll.options.reduce((acc, o) => acc + o.votes, 0);
                    const myVote = poll.voters?.[authUser?._id];

                    return (
                      <div key={poll.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ng-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            POLL · {poll.closingDate}
                          </span>
                          <span style={{ fontSize: 10, background: "var(--ng-hover)", color: "var(--ng-muted)", padding: "2px 6px", borderRadius: 4 }}>
                            Demo Service
                          </span>
                        </div>

                        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--ng-text)", margin: 0 }}>
                          {poll.question}
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                          {poll.options.map((opt) => {
                            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                            const isMyChoice = myVote === opt.id;

                            return (
                              <div
                                key={opt.id}
                                onClick={() => handleVote(poll.id, opt.id)}
                                role="button"
                                tabIndex={0}
                                style={{
                                  background: "var(--ng-hover)",
                                  border: isMyChoice ? "1px solid var(--ng-accent)" : "1px solid var(--ng-border)",
                                  borderRadius: "var(--r-btn)",
                                  padding: "10px 14px",
                                  cursor: "pointer",
                                  position: "relative",
                                  overflow: "hidden",
                                  transition: "border-color 0.15s",
                                }}
                              >
                                {/* Saffron Progress Fill Bar */}
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    width: `${pct}%`,
                                    background: "rgba(232, 163, 61, 0.18)",
                                    transition: "width 0.3s ease-out",
                                  }}
                                />

                                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <span style={{ fontSize: 13, fontWeight: isMyChoice ? 700 : 500, color: isMyChoice ? "var(--ng-accent)" : "var(--ng-text)" }}>
                                    {opt.text} {isMyChoice && "✓"}
                                  </span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ng-muted)" }}>
                                    {pct}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ---- SHARED CHECKLIST CARD ---- */}
                <div
                  style={{
                    background: "var(--ng-panel)",
                    border: "1px solid var(--ng-border)",
                    borderRadius: "var(--r-card)",
                    padding: "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ng-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      SHARED CHECKLIST · {completedTaskCount}/{tasks.length}
                    </span>
                    <button
                      onClick={() => setShowAddTask((prev) => !prev)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--ng-accent)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {showAddTask && (
                    <form onSubmit={handleAddNewTask} style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        autoFocus
                        placeholder="New checklist item..."
                        value={newTaskInput}
                        onChange={(e) => setNewTaskInput(e.target.value)}
                        style={{
                          flex: 1,
                          background: "var(--ng-hover)",
                          border: "1px solid var(--ng-accent)",
                          borderRadius: "var(--r-btn)",
                          padding: "6px 12px",
                          color: "var(--ng-text)",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          background: "var(--ng-accent)",
                          color: "var(--ng-accent-fg)",
                          border: "none",
                          borderRadius: "var(--r-btn)",
                          padding: "6px 14px",
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                    </form>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        role="button"
                        tabIndex={0}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "8px 10px",
                          borderRadius: "var(--r-btn)",
                          background: task.completed ? "rgba(255,255,255,0.02)" : "var(--ng-hover)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            border: task.completed ? "none" : "1.5px solid var(--ng-border)",
                            background: task.completed ? "var(--ng-accent)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--ng-accent-fg)",
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {task.completed && "✓"}
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 13,
                            color: task.completed ? "var(--ng-muted)" : "var(--ng-text)",
                            textDecoration: task.completed ? "line-through" : "none",
                            userSelect: "none",
                          }}
                        >
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ---- EVENTS CARD (NG2) ---- */}
            {(activeTab === "Events" || activeTab === "Polls" || activeTab === "Tasks") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ng-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Upcoming Events
                </span>
                {events.map((ev) => {
                  const isGoing = ev.attendees?.[authUser?._id] === "going";

                  return (
                    <div
                      key={ev.id}
                      style={{
                        background: "var(--ng-panel)",
                        border: "1px solid var(--ng-border)",
                        borderRadius: "var(--r-card)",
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 16,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        {/* Date badge */}
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: "var(--r-btn)",
                            background: "var(--ng-hover)",
                            border: "1px solid var(--ng-border)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1.1,
                          }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ng-muted)" }}>{ev.day}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ng-accent)" }}>{ev.time}</span>
                        </div>

                        <div>
                          <h4 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--ng-text)", margin: "0 0 2px" }}>
                            {ev.title}
                          </h4>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: 0 }}>
                            {ev.subtitle} · {ev.goingCount} going, {ev.maybeCount} maybe
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRsvp(ev.id)}
                        style={{
                          background: isGoing ? "var(--ng-accent)" : "var(--ng-hover)",
                          color: isGoing ? "var(--ng-accent-fg)" : "var(--ng-text)",
                          border: isGoing ? "none" : "1px solid var(--ng-border)",
                          borderRadius: "var(--r-btn)",
                          padding: "10px 24px",
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        {isGoing ? "Going ✓" : "Going"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ---- FILES TAB ---- */}
            {activeTab === "Files" && (
              <div
                style={{
                  background: "var(--ng-panel)",
                  border: "1px solid var(--ng-border)",
                  borderRadius: "var(--r-card)",
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--ng-text)", margin: 0 }}>
                    Shared Documents & Media
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {files.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        background: "var(--ng-hover)",
                        borderRadius: "var(--r-btn)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 20 }}>
                          {f.type === "pdf" ? "📄" : f.type === "image" ? "🖼️" : "🎵"}
                        </span>
                        <div>
                          <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--ng-text)", margin: 0 }}>
                            {f.name}
                          </p>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ng-muted)", margin: "2px 0 0" }}>
                            {f.size} · Uploaded {f.date}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toast(`Downloading ${f.name}`)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--ng-accent)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default GroupView;
