import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import useGetUsers from "../hooks/useGetUsers";
import useChatStore from "../store/useChatStore";
import Avatar from "./Avatar";
import toast from "react-hot-toast";
import { getSettings, updateSettings } from "../services/settingsService";
import {
  getUserVibes,
  calculateSharedVibes,
  filterUsers,
  MOCK_PENDING_REQUESTS,
} from "../services/discoveryService";

const FindPeopleView = () => {
  const { authUser } = useAuth();
  const { setSelectedUser, setActiveSection, onlineUsers, addChatter } = useChatStore();
  const settings = getSettings();
  const myVibes = settings.vibeTags || ["#design", "#night owl", "#lofi"];

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'online' | 'same_vibe' | 'new'
  const [pendingRequests, setPendingRequests] = useState(MOCK_PENDING_REQUESTS);

  const { users, loading } = useGetUsers(search);

  // Exclude current user from candidate cards
  const candidateUsers = (users || []).filter((u) => u._id !== authUser?._id);
  const filteredList = filterUsers(candidateUsers, filterType, myVibes, onlineUsers || []);

  const handleSayHi = (targetUser) => {
    setSelectedUser(targetUser);
    addChatter({
      ...targetUser,
      lastMessage: "👋 Say hi!",
      lastMessageTime: new Date().toISOString(),
    });
    setActiveSection("chats");
    toast(`Started chat with ${targetUser.fullname || targetUser.username}! 👋`);
  };

  const handleAcceptRequest = (reqId, personName) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== reqId));
    toast.success(`Connected with ${personName}! (Demo service)`);
  };

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        background: "var(--ng-bg)",
        padding: "28px 36px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 960, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* ================= HEADER & VIBE BANNER ================= */}
        <div
          style={{
            background: "var(--ng-panel)",
            border: "1px solid var(--ng-border)",
            borderRadius: "var(--r-card)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 700, color: "var(--ng-text)", margin: "0 0 4px" }}>
              Find People
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-muted)", margin: 0 }}>
              Discover collaborators and friends based on shared vibes
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ng-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Your Vibes:
            </span>
            {myVibes.map((tag) => (
              <span
                key={tag}
                style={{
                  background: "var(--ng-hover)",
                  color: "var(--ng-accent)",
                  border: "1px solid var(--ng-border)",
                  borderRadius: 99,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ================= SEARCH & FILTERS ================= */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {/* Search bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--ng-panel)",
              border: "1px solid var(--ng-border)",
              borderRadius: "var(--r-btn)",
              padding: "0 14px",
              height: 42,
              flex: "1 1 260px",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--ng-muted)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, handle, or vibe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--ng-text)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {[
              { id: "all", label: "All" },
              { id: "online", label: "Online now" },
              { id: "same_vibe", label: "Same vibe" },
              { id: "new", label: "New" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  background: filterType === f.id ? "var(--ng-accent)" : "var(--ng-panel)",
                  color: filterType === f.id ? "var(--ng-accent-fg)" : "var(--ng-muted)",
                  border: "1px solid var(--ng-border)",
                  borderRadius: 99,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= PENDING REQUESTS (Labelled Mock Service) ================= */}
        {pendingRequests.length > 0 && (
          <div
            style={{
              background: "var(--ng-panel)",
              border: "1px solid var(--ng-border)",
              borderRadius: "var(--r-card)",
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ng-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Pending Requests ({pendingRequests.length})
                </span>
                <span style={{ fontSize: 10, background: "var(--ng-hover)", color: "var(--ng-muted)", padding: "2px 6px", borderRadius: 4 }}>
                  Demo Service
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--ng-hover)",
                    borderRadius: "var(--r-btn)",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={req.user.fullname} size={40} />
                    <div>
                      <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--ng-text)", margin: 0 }}>
                        {req.user.fullname} <span style={{ color: "var(--ng-muted)", fontWeight: 400, fontSize: 12 }}>@{req.user.username}</span>
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ng-muted)", margin: "2px 0 0" }}>
                        {req.user.statusNote} · {req.sentAt}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => handleAcceptRequest(req.id, req.user.fullname)}
                      style={{
                        background: "var(--ng-accent)",
                        color: "var(--ng-accent-fg)",
                        border: "none",
                        borderRadius: "var(--r-btn)",
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => toast(`Viewing @${req.user.username}`)}
                      style={{
                        background: "none",
                        border: "1px solid var(--ng-border)",
                        color: "var(--ng-text)",
                        borderRadius: "var(--r-btn)",
                        padding: "5px 12px",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= USER CARDS GRID ================= */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ng-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Suggested Contacts ({filteredList.length})
            </span>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <span className="loading loading-dots loading-md" style={{ color: "var(--ng-accent)" }} />
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--ng-panel)", borderRadius: "var(--r-card)" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--ng-text)", margin: "0 0 4px" }}>
                No matches found
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-muted)", margin: 0 }}>
                Try adjusting your search query or filter tags
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filteredList.map((user) => {
                const userVibes = getUserVibes(user);
                const shared = calculateSharedVibes(myVibes, userVibes);
                const isOnline = (onlineUsers || []).includes(user._id);

                return (
                  <div
                    key={user._id}
                    style={{
                      background: "var(--ng-panel)",
                      border: "1px solid var(--ng-border)",
                      borderRadius: "var(--r-card)",
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 14,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                      transition: "border-color 0.15s, transform 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--ng-accent)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--ng-border)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div>
                      {/* Avatar + Online + Names */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <Avatar
                          src={user.profilepic}
                          name={user.fullname || user.username}
                          size={46}
                          online={isOnline}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, color: "var(--ng-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {user.fullname || user.username}
                          </h3>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: "1px 0 0" }}>
                            @{user.username}
                          </p>
                        </div>
                      </div>

                      {/* Status note */}
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: "0 0 12px", lineHeight: 1.4 }}>
                        {user.statusNote || "exploring night garden · building connections"}
                      </p>

                      {/* Vibe tags */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                        {userVibes.map((tag) => {
                          const isShared = shared.includes(tag);
                          return (
                            <span
                              key={tag}
                              style={{
                                background: isShared ? "rgba(232,163,61,0.12)" : "var(--ng-hover)",
                                color: isShared ? "var(--ng-accent)" : "var(--ng-muted)",
                                border: isShared ? "1px solid var(--ng-accent)" : "1px solid var(--ng-border)",
                                borderRadius: 99,
                                padding: "2px 8px",
                                fontSize: 11,
                                fontWeight: isShared ? 600 : 400,
                              }}
                            >
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shared Vibes Count + Say hi button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--ng-border)" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: shared.length > 0 ? "var(--ng-accent)" : "var(--ng-muted)" }}>
                        {shared.length > 0 ? `${shared.length} shared vibe${shared.length > 1 ? "s" : ""}` : "New contact"}
                      </span>

                      <button
                        onClick={() => handleSayHi(user)}
                        style={{
                          background: "var(--ng-accent)",
                          color: "var(--ng-accent-fg)",
                          border: "none",
                          borderRadius: "var(--r-btn)",
                          padding: "6px 16px",
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "opacity 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        Say hi 👋
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FindPeopleView;
