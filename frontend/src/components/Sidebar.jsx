import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import useGetUsers from "../hooks/useGetUsers";
import useGetCurrentChatters from "../hooks/useGetCurrentChatters";
import useLogout from "../hooks/useLogout";
import useChatStore from "../store/useChatStore";
import UserItem from "./UserItem";
import CreateGroup from "./CreateGroup";
import useGetGroups from "../hooks/useGetGroups";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import Avatar from "./Avatar";
import { getDropInRooms, getUpcomingMeets } from "../services/meetService";

const ALLOWED_TYPES = ["image/jpeg","image/jpg","image/png","image/webp","image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

/* ============================================================
   Shared inline style helpers
   ============================================================ */
const S = {
  label: {
    fontFamily: "var(--font-body)",
    fontSize: 10,
    fontWeight: 600,
    color: "var(--ng-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "8px 12px 4px",
    display: "block",
  },
  sectionTitle: {
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    fontSize: 22,
    color: "var(--ng-text)",
    margin: 0,
  },
  sectionSub: {
    fontFamily: "var(--font-body)",
    fontSize: 12,
    color: "var(--ng-muted)",
    margin: 0,
  },
};

/* ============================================================
   Profile Picture Section
   ============================================================ */
const ProfilePicSection = ({ authUser, setAuthUser }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error("Invalid image type"); return; }
    if (file.size > MAX_SIZE) { toast.error("Image too large (max 5MB)"); return; }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setUploading(true);
        const { data } = await axiosInstance.put("/auth/profile/pic", { profilepic: reader.result });
        if (data.success) {
          setAuthUser({ ...authUser, profilepic: data.profilepic });
          toast.success("Profile picture updated!");
        }
      } catch {
        toast.error("Failed to update picture");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "20px 0" }}>
        <div
          style={{ position: "relative", cursor: uploading ? "default" : "pointer" }}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          <div style={{ borderRadius: "50%", padding: 3, background: "linear-gradient(135deg, var(--ng-accent) 0%, var(--ng-terracotta) 100%)", display: "inline-flex" }}>
            <Avatar
              src={authUser?.profilepic}
              name={authUser?.fullname || authUser?.username}
              size={76}
            />
          </div>
          <div style={{
            position: "absolute", inset: 3, borderRadius: "50%",
            background: "rgba(0,0,0,0.5)", display: "flex",
            alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0"}
          >
            {uploading ? (
              <span className="loading loading-spinner loading-xs" style={{ color: "#fff" }} />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>

        <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16, color: "var(--ng-text)", margin: "12px 0 2px" }}>
          {authUser?.fullname}
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)" }}>
          @{authUser?.username}
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ng-muted)", marginTop: 8, opacity: 0.6 }}>
          Click photo to change
        </p>
      </div>
    </div>
  );
};

/* ============================================================
   Group Info Modal
   ============================================================ */
const GroupInfoModal = ({ group, authUser, onClose, onGroupUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(group.groupName);
  const fileRef = useRef(null);

  const isAdmin = group.groupAdmin?._id === authUser?._id || group.groupAdmin === authUser?._id;
  const adminId = group.groupAdmin?._id || group.groupAdmin;

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error("Invalid image type"); return; }
    if (file.size > MAX_SIZE) { toast.error("Image too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setUploading(true);
        const { data } = await axiosInstance.put(`/group/${group._id}/pic`, { groupPic: reader.result });
        if (data.success) { toast.success("Group picture updated!"); onGroupUpdated(data.group); }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to update picture");
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleNameSave = async () => {
    if (!newName.trim() || newName.trim() === group.groupName) { setEditingName(false); return; }
    try {
      const { data } = await axiosInstance.put(`/group/${group._id}/name`, { groupName: newName.trim() });
      if (data.success) { toast.success("Group name updated!"); onGroupUpdated(data.group); setEditingName(false); }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update name");
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--ng-panel)", borderRadius: "var(--r-card)", border: "1px solid var(--ng-border)", width: 320, maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px", borderBottom: "1px solid var(--ng-border)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--ng-text)", margin: 0 }}>Group Info</p>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ng-muted)", fontSize: 18, padding: 4, borderRadius: 8 }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 20px 12px" }}>
          <div
            style={{ position: "relative", cursor: isAdmin ? "pointer" : "default" }}
            onClick={() => isAdmin && !uploading && fileRef.current?.click()}
          >
            <Avatar
              src={group.groupPic}
              name={group.groupName}
              size={80}
            />
            {isAdmin && (
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "rgba(0,0,0,0.5)", display: "flex",
                alignItems: "center", justifyContent: "center",
                opacity: 0, transition: "opacity 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0"}
              >
                {uploading ? <span className="loading loading-spinner loading-xs" style={{ color: "#fff" }} /> : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            )}
            {isAdmin && <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePicChange} />}
          </div>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            {editingName ? (
              <>
                <input
                  className="input input-sm input-bordered"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  autoFocus
                  style={{ background: "var(--ng-hover)", border: "1px solid var(--ng-border)", color: "var(--ng-text)", borderRadius: "var(--r-btn)" }}
                />
                <button className="btn btn-sm btn-primary" onClick={handleNameSave}>Save</button>
                <button className="btn btn-sm btn-ghost" onClick={() => { setEditingName(false); setNewName(group.groupName); }}>✕</button>
              </>
            ) : (
              <>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, color: "var(--ng-text)", margin: 0 }}>{group.groupName}</p>
                {isAdmin && (
                  <button
                    aria-label="Edit group name"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ng-muted)", padding: 2, borderRadius: 6 }}
                    onClick={() => setEditingName(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: "4px 0 0" }}>{group.participants?.length || 0} Members</p>
          {group.createdAt && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ng-muted)", margin: "2px 0 0", opacity: 0.6 }}>
              Created {new Date(group.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ ...S.label, padding: "0 0 8px" }}>Members</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {group.participants?.map((member) => {
              const memberId = member._id || member;
              const isGroupAdmin = memberId?.toString() === adminId?.toString();
              return (
                <div key={memberId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar src={member.profilepic} name={member.fullname} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--ng-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {member.fullname}{isGroupAdmin && <span style={{ marginLeft: 6 }}>👑</span>}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ng-muted)", margin: 0 }}>@{member.username}</p>
                  </div>
                  {isGroupAdmin && (
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, color: "var(--ng-accent)", background: "rgba(232,163,61,0.15)", borderRadius: 6, padding: "2px 7px" }}>
                      Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   Main Sidebar
   ============================================================ */
const Sidebar = () => {
  const { authUser, setAuthUser } = useAuth();

  const [search, setSearch] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [openChatMenu, setOpenChatMenu] = useState(null);
  const [openGroupMenu, setOpenGroupMenu] = useState(null);
  const [groupInfoModal, setGroupInfoModal] = useState(null);

  const {
    activeSection,
    setActiveSection,
    settingsTab,
    setSettingsTab,
    meetRoomId,
    setMeetRoomId,
    selectedUser,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
    unreadCounts,
    unreadGroupCounts,
    clearGroupUnread,
    onlineUsers,
    typingMap,
    addChatter,
  } = useChatStore();

  const { users, loading } = useGetUsers(search);
  const { chatters: fetchedChatters, loading: chattersLoading } = useGetCurrentChatters();
  const { groups, loading: groupsLoading, getGroups } = useGetGroups();
  const { logout, loading: loggingOut } = useLogout();

  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`chatapp_pinned_${authUser?._id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const togglePinUser = (userId, e) => {
    if (e) e.stopPropagation();
    setOpenChatMenu(null);
    setPinnedIds((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      try {
        localStorage.setItem(`chatapp_pinned_${authUser?._id}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const formatChatTime = (time) => {
    if (!time) return "";
    try {
      const d = new Date(time);
      if (isNaN(d.getTime())) return "";
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const handleSelectUser = (user) => {
    addChatter(user);
    setSelectedUser(user);
    setSearch("");
  };

  // Ensure selectedUser is included in chatters list if active
  const allChatters = [...fetchedChatters];
  if (selectedUser && !allChatters.some((u) => u._id === selectedUser._id)) {
    allChatters.unshift(selectedUser);
  }

  const filteredChatters = allChatters.filter((user) => {
    const query = chatSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      user.fullname?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    );
  });

  const pinnedChatters = filteredChatters.filter((user) => pinnedIds.includes(user._id));
  const recentChatters = filteredChatters.filter((user) => !pinnedIds.includes(user._id));

  const renderChatRow = (user, isPinned) => {
    const isSelected = selectedUser?._id === user._id;
    const isTyping = Boolean(typingMap?.[user._id]);
    const unreadCount = unreadCounts[user._id] !== undefined
      ? unreadCounts[user._id]
      : (user.unreadCount || 0);
    const subtitle = user.lastMessage || "";
    const timestamp = formatChatTime(user.lastMessageTime);

    return (
      <div key={user._id} style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <UserItem
              user={user}
              isSelected={isSelected}
              isOnline={onlineUsers.includes(user._id)}
              isSearchResult={false}
              subtitle={subtitle}
              timestamp={timestamp}
              unreadCount={unreadCount}
              hasRing={isPinned || isSelected}
              isTyping={isTyping}
              onClick={() => handleSelectUser(user)}
            />
          </div>
          <button
            aria-label={`More options for ${user.fullname}`}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--ng-muted)", fontSize: 18,
              minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "var(--r-btn)", flexShrink: 0,
              transition: "color 0.15s, background 0.15s",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpenChatMenu(openChatMenu === user._id ? null : user._id);
              setOpenGroupMenu(null);
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ng-text)"; e.currentTarget.style.background = "var(--ng-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ng-muted)"; e.currentTarget.style.background = "none"; }}
          >
            ⋮
          </button>
        </div>

        {openChatMenu === user._id && (
          <div
            style={{
              position: "absolute", right: 8, top: "calc(100% - 4px)", zIndex: 50,
              background: "var(--ng-panel)", borderRadius: "var(--r-card)",
              border: "1px solid var(--ng-border)", padding: "4px 0", width: 148,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                width: "100%", textAlign: "left", padding: "10px 16px",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 13,
                color: "var(--ng-text)", transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ng-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              onClick={(e) => togglePinUser(user._id, e)}
            >
              {isPinned ? "Unpin Chat" : "Pin Chat"}
            </button>
            <button
              style={{
                width: "100%", textAlign: "left", padding: "10px 16px",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 13,
                color: "var(--ng-terracotta)", transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ng-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              onClick={(e) => handleClearChat(user._id, e)}
            >
              Clear Chat
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleClearChat = async (userId, e) => {
    e.stopPropagation();
    setOpenChatMenu(null);
    try {
      await axiosInstance.delete(`/message/clear/${userId}`);
      if (selectedUser?._id === userId) useChatStore.setState({ messages: [] });
      toast.success("Chat cleared");
    } catch {
      toast.error("Failed to clear chat");
    }
  };

  const handleClearGroup = async (groupId, e) => {
    e.stopPropagation();
    setOpenGroupMenu(null);
    try {
      await axiosInstance.delete(`/group/${groupId}/clear`);
      if (selectedGroup?._id === groupId) useChatStore.setState({ messages: [], selectedGroup: null });
      getGroups();
      toast.success("Group cleared");
    } catch {
      toast.error("Failed to clear group");
    }
  };

  const handleGroupUpdated = (updatedGroup) => {
    setGroupInfoModal(updatedGroup);
    if (selectedGroup?._id === updatedGroup._id) setSelectedGroup(updatedGroup);
    getGroups();
  };

  /* ---- Search input shared style ---- */
  const searchInputStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--ng-hover)",
    border: "1px solid var(--ng-border)",
    borderRadius: "var(--r-btn)",
    padding: "0 12px",
    height: 40,
  };

  return (
    <aside
      style={{
        width: 340,
        minWidth: 340,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--ng-panel)",
        borderRight: "1px solid var(--ng-border)",
        flexShrink: 0,
      }}
      onClick={() => { setOpenChatMenu(null); setOpenGroupMenu(null); }}
    >
      {/* ========== HEADER ========== */}
      <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid var(--ng-border)", flexShrink: 0 }}>

        {/* CHATS */}
        {activeSection === "chats" && (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <h1 style={S.sectionTitle}>Chats</h1>
                <p style={S.sectionSub}>Your conversations</p>
              </div>
              <button
                onClick={logout}
                disabled={loggingOut}
                aria-label="Logout"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--ng-muted)", padding: 8, borderRadius: "var(--r-btn)",
                  minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "color 0.15s, background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--ng-terracotta)"; e.currentTarget.style.background = "var(--ng-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--ng-muted)"; e.currentTarget.style.background = "none"; }}
              >
                {loggingOut ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>

            {/* Search + Ctrl K */}
            <div style={searchInputStyle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--ng-muted)", flexShrink: 0 }}>
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0112 0z" />
              </svg>
              <input
                id="chat-search"
                type="text"
                placeholder="Search conversations..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                aria-label="Search conversations"
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-text)",
                  caretColor: "var(--ng-accent)",
                }}
              />
              {chatSearch ? (
                <button
                  onClick={() => setChatSearch("")}
                  aria-label="Clear search"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ng-muted)", fontSize: 14, padding: 0, lineHeight: 1 }}
                >
                  ✕
                </button>
              ) : (
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 500,
                  color: "var(--ng-muted)", background: "var(--ng-border)",
                  borderRadius: 6, padding: "2px 6px", letterSpacing: "0.02em", whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  Ctrl K
                </span>
              )}
            </div>
          </>
        )}

        {/* FIND PEOPLE */}
        {activeSection === "people" && (
          <>
            <div style={{ marginBottom: 12 }}>
              <h1 style={S.sectionTitle}>Find People</h1>
              <p style={S.sectionSub}>Search for new contacts</p>
            </div>
            <div style={searchInputStyle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--ng-muted)", flexShrink: 0 }}>
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0112 0z" />
              </svg>
              <input
                id="people-search"
                type="text"
                placeholder="Search people..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search people"
                style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-text)", caretColor: "var(--ng-accent)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ng-muted)", fontSize: 14, padding: 0 }}>✕</button>
              )}
            </div>
          </>
        )}

        {/* GROUPS */}
        {activeSection === "groups" && (
          <div>
            <h1 style={S.sectionTitle}>Groups</h1>
            <p style={S.sectionSub}>Your group conversations</p>
          </div>
        )}

        {/* MEET */}
        {activeSection === "meet" && (
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={S.sectionTitle}>Meet</h1>
              <p style={S.sectionSub}>Calls and rooms</p>
            </div>
            <button
              onClick={logout}
              disabled={loggingOut}
              aria-label="Logout"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--ng-muted)", padding: 8, borderRadius: "var(--r-btn)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        )}

        {/* SETTINGS */}
        {activeSection === "settings" && (
          <div>
            <h1 style={S.sectionTitle}>Settings</h1>
            <p style={S.sectionSub}>Manage your preferences</p>
          </div>
        )}

        {/* PROFILE */}
        {activeSection === "profile" && (
          <div>
            <h1 style={S.sectionTitle}>Profile</h1>
            <p style={S.sectionSub}>Your account</p>
          </div>
        )}
      </div>

      {/* ========== CONTENT ========== */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>

        {/* ---- CHATS ---- */}
        {activeSection === "chats" && (
          <>
            {chattersLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <span className="loading loading-dots loading-md" style={{ color: "var(--ng-accent)" }} />
              </div>
            ) : (
              <>
                {pinnedChatters.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px 4px" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ color: "var(--ng-accent)", flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v4l2 3v2h-6v7l-1 1-1-1v-7H4v-2l2-3V4h10z" />
                      </svg>
                      <span style={{ ...S.label, padding: 0 }}>Pinned</span>
                    </div>
                    {pinnedChatters.map((user) => renderChatRow(user, true))}
                  </div>
                )}

                {recentChatters.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={S.label}>Recent</span>
                    {recentChatters.map((user) => renderChatRow(user, false))}
                  </div>
                )}

                {pinnedChatters.length === 0 && recentChatters.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-muted)" }}>
                      {chatSearch ? "No conversations found" : "No conversations yet"}
                    </p>
                    {!chatSearch && (
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", opacity: 0.6, marginTop: 4 }}>
                        Find someone to start a chat
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ---- FIND PEOPLE ---- */}
        {activeSection === "people" && (
          <>
            {loading && search.trim() && (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <span className="loading loading-dots loading-md" style={{ color: "var(--ng-accent)" }} />
              </div>
            )}
            {!search.trim() && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔎</div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-muted)" }}>Search for someone to start chatting</p>
              </div>
            )}
            {!loading && search.trim() && users.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔎</div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-muted)" }}>No users found</p>
              </div>
            )}
            {search.trim() && users.length > 0 && (
              <>
                <span style={S.label}>Search Results</span>
                {users.map((user) => (
                  <UserItem
                    key={user._id}
                    user={user}
                    isSelected={selectedUser?._id === user._id}
                    isOnline={onlineUsers.includes(user._id)}
                    isSearchResult={true}
                    onClick={() => handleSelectUser(user)}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* ---- GROUPS ---- */}
        {activeSection === "groups" && (
          <>
            {showCreateGroup ? (
              <CreateGroup
                onCancel={() => setShowCreateGroup(false)}
                onGroupCreated={() => { setShowCreateGroup(false); getGroups(); }}
              />
            ) : (
              <div style={{ padding: 8 }}>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  style={{
                    width: "100%", padding: "10px 16px", borderRadius: "var(--r-btn)",
                    background: "var(--ng-accent)", color: "var(--ng-accent-fg)",
                    border: "none", cursor: "pointer",
                    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  + Create Group
                </button>

                {groupsLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                    <span className="loading loading-dots loading-md" style={{ color: "var(--ng-accent)" }} />
                  </div>
                ) : groups.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-muted)" }}>No groups yet</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", opacity: 0.6, marginTop: 4 }}>Create a group to start chatting</p>
                  </div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <span style={S.label}>Your Groups</span>
                    {groups.map((group) => (
                      <div key={group._id} style={{ position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div
                            style={{
                              flex: 1, display: "flex", alignItems: "center", gap: 12,
                              padding: "10px 12px", marginBottom: 2,
                              borderRadius: "var(--r-row)", cursor: "pointer",
                              transition: "background 0.15s",
                              backgroundColor: selectedGroup?._id === group._id ? "var(--ng-hover)" : "transparent",
                            }}
                            onClick={() => { setSelectedGroup(group); clearGroupUnread(group._id); }}
                            onMouseEnter={e => { if (selectedGroup?._id !== group._id) e.currentTarget.style.backgroundColor = "var(--ng-hover)"; }}
                            onMouseLeave={e => { if (selectedGroup?._id !== group._id) e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            <Avatar src={group.groupPic} name={group.groupName} size={48} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--ng-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.groupName}</p>
                                {unreadGroupCounts[group._id] > 0 && (
                                  <span style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "var(--ng-accent-fg)", background: "var(--ng-accent)", borderRadius: 99, padding: "1px 6px", flexShrink: 0 }}>
                                    {unreadGroupCounts[group._id]}
                                  </span>
                                )}
                              </div>
                              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: 0 }}>{group.participants?.length || 0} members</p>
                            </div>
                          </div>
                          <button
                            aria-label={`More options for ${group.groupName}`}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "var(--ng-muted)", fontSize: 18,
                              minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center",
                              borderRadius: "var(--r-btn)", flexShrink: 0, transition: "color 0.15s, background 0.15s",
                            }}
                            onClick={(e) => { e.stopPropagation(); setOpenGroupMenu(openGroupMenu === group._id ? null : group._id); setOpenChatMenu(null); }}
                            onMouseEnter={e => { e.currentTarget.style.color = "var(--ng-text)"; e.currentTarget.style.background = "var(--ng-hover)"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "var(--ng-muted)"; e.currentTarget.style.background = "none"; }}
                          >
                            ⋮
                          </button>
                        </div>

                        {openGroupMenu === group._id && (
                          <div
                            style={{
                              position: "absolute", right: 8, top: "calc(100% - 4px)", zIndex: 50,
                              background: "var(--ng-panel)", borderRadius: "var(--r-card)",
                              border: "1px solid var(--ng-border)", padding: "4px 0", width: 160,
                              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-text)", transition: "background 0.1s" }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--ng-hover)"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}
                              onClick={(e) => { e.stopPropagation(); setOpenGroupMenu(null); setGroupInfoModal(group); }}>
                              Group Info
                            </button>
                            <button style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-terracotta)", transition: "background 0.1s" }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--ng-hover)"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}
                              onClick={(e) => handleClearGroup(group._id, e)}>
                              Clear Group
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ---- MEET (NG3) ---- */}
        {activeSection === "meet" && (
          <div style={{ padding: "4px 8px" }}>
            {/* Start instant call button */}
            <button
              onClick={() => {
                setMeetRoomId("instant-call");
                toast.success("Instant call room initialized in lobby");
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "var(--r-btn)",
                background: "var(--ng-accent)",
                color: "var(--ng-accent-fg)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 20,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Start instant call
            </button>

            {/* DROP-IN ROOMS */}
            <div style={{ marginBottom: 24 }}>
              <span style={S.label}>Drop-in Rooms</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {getDropInRooms().map((room) => {
                  const isCurrent = meetRoomId === room.id;
                  const initials = room.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div
                      key={room.id}
                      onClick={() => setMeetRoomId(room.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: "var(--r-row)",
                        background: isCurrent ? "var(--ng-hover)" : "transparent",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) e.currentTarget.style.background = "var(--ng-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "var(--r-btn)",
                            background: "var(--ng-panel)",
                            border: "1px solid var(--ng-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--ng-muted)",
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--ng-text)", margin: 0 }}>
                            {room.name}
                          </p>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ng-muted)", margin: 0 }}>
                            {room.count > 0 ? `${room.count} inside` : "Empty. Be the first"}
                          </p>
                        </div>
                      </div>

                      {/* Stacked participant avatars */}
                      {room.participants?.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {room.participants.slice(0, 3).map((p, idx) => (
                            <div
                              key={p.name}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                background: p.color,
                                color: "#0E1311",
                                fontSize: 9,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "2px solid var(--ng-panel)",
                                marginLeft: idx > 0 ? -6 : 0,
                              }}
                            >
                              {p.initials}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* UPCOMING */}
            <div>
              <span style={S.label}>Upcoming</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {getUpcomingMeets().map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: "var(--r-row)",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "var(--r-btn)",
                        background: "var(--ng-hover)",
                        border: "1px solid var(--ng-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--ng-accent)",
                      }}
                    >
                      {item.timeBadge}
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--ng-text)", margin: 0 }}>
                        {item.title}
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ng-muted)", margin: 0 }}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- SETTINGS / PROFILE SUBNAV (NG5) ---- */}
        {(activeSection === "settings" || activeSection === "profile") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 6px" }}>
            {[
              { id: "profile", label: "Profile" },
              { id: "appearance", label: "Appearance" },
              { id: "notifications", label: "Notifications" },
              { id: "privacy", label: "Privacy" },
              { id: "shortcuts", label: "Shortcuts" },
            ].map((tab) => {
              const isCurrent = settingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSettingsTab(tab.id);
                    if (activeSection !== "settings" && activeSection !== "profile") {
                      setActiveSection("settings");
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "var(--r-row)",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: isCurrent ? 600 : 500,
                    backgroundColor: isCurrent ? "var(--ng-hover)" : "transparent",
                    color: isCurrent ? "var(--ng-text)" : "var(--ng-muted)",
                    textAlign: "left",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.backgroundColor = "var(--ng-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========== CURRENT USER FOOTER ========== */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--ng-border)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
        background: "var(--ng-panel)",
      }}>
        <Avatar
          src={authUser?.profilepic}
          name={authUser?.fullname || authUser?.username}
          size={36}
          online={true}
          borderColor="var(--ng-panel)"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--ng-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {authUser?.fullname}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-online)", margin: 0 }}>
            ● Active
          </p>
        </div>
      </div>

      {/* Group Info Modal */}
      {groupInfoModal && (
        <GroupInfoModal
          group={groupInfoModal}
          authUser={authUser}
          onClose={() => setGroupInfoModal(null)}
          onGroupUpdated={handleGroupUpdated}
        />
      )}
    </aside>
  );
};

export default Sidebar;