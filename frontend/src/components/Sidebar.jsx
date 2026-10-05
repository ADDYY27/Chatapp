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

const ALLOWED_TYPES = ["image/jpeg","image/jpg","image/png","image/webp","image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

// Profile picture change section
const ProfilePicSection = ({ authUser, setAuthUser }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid image type");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image too large (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setUploading(true);
        const { data } = await axiosInstance.put("/auth/profile/pic", {
          profilepic: reader.result,
        });
        if (data.success) {
          const updated = { ...authUser, profilepic: data.profilepic };
          setAuthUser(updated);
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
    <div className="p-4">
      <div className="flex flex-col items-center text-center py-5">
        <div className="relative group cursor-pointer" onClick={() => !uploading && fileRef.current?.click()}>
          <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/30">
            {authUser?.profilepic ? (
              <img src={authUser.profilepic} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-primary-content font-bold text-2xl">
                {authUser?.fullname?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <span className="loading loading-spinner loading-xs text-white" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <p className="font-semibold mt-3">{authUser?.fullname}</p>
        <p className="text-xs text-base-content/40">@{authUser?.username}</p>
        <p className="text-xs text-base-content/30 mt-2">Click photo to change</p>
      </div>
    </div>
  );
};

// Group Info Modal
const GroupInfoModal = ({ group, authUser, onClose, onGroupUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(group.groupName);
  const fileRef = useRef(null);

  const isAdmin = group.groupAdmin?._id === authUser?._id || group.groupAdmin === authUser?._id;

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid image type");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image too large (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setUploading(true);
        const { data } = await axiosInstance.put(`/group/${group._id}/pic`, {
          groupPic: reader.result,
        });
        if (data.success) {
          toast.success("Group picture updated!");
          onGroupUpdated(data.group);
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to update picture");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNameSave = async () => {
    if (!newName.trim() || newName.trim() === group.groupName) {
      setEditingName(false);
      return;
    }
    try {
      const { data } = await axiosInstance.put(`/group/${group._id}/name`, {
        groupName: newName.trim(),
      });
      if (data.success) {
        toast.success("Group name updated!");
        onGroupUpdated(data.group);
        setEditingName(false);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update name");
    }
  };

  const adminId = group.groupAdmin?._id || group.groupAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-base-100 rounded-2xl shadow-xl w-80 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-base-300">
          <p className="font-bold text-base">Group Info</p>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Group Pic */}
        <div className="flex flex-col items-center py-5 px-5">
          <div
            className={`relative ${isAdmin ? "group cursor-pointer" : ""}`}
            onClick={() => isAdmin && !uploading && fileRef.current?.click()}
          >
            <div className="w-20 h-20 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-content text-2xl ring-2 ring-primary/30">
              {group.groupPic ? (
                <img src={group.groupPic} alt={group.groupName} className="w-full h-full object-cover" />
              ) : (
                "👥"
              )}
            </div>
            {isAdmin && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <span className="loading loading-spinner loading-xs text-white" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            )}
            {isAdmin && (
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
            )}
          </div>

          {/* Group Name */}
          <div className="mt-3 flex items-center gap-2">
            {editingName ? (
              <>
                <input
                  className="input input-sm input-bordered"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  autoFocus
                />
                <button className="btn btn-sm btn-primary" onClick={handleNameSave}>Save</button>
                <button className="btn btn-sm btn-ghost" onClick={() => { setEditingName(false); setNewName(group.groupName); }}>✕</button>
              </>
            ) : (
              <>
                <p className="font-bold text-lg">{group.groupName}</p>
                {isAdmin && (
                  <button className="btn btn-ghost btn-xs" onClick={() => setEditingName(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-base-content/40 mt-1">{group.participants?.length || 0} Members</p>
          {group.createdAt && (
            <p className="text-xs text-base-content/30 mt-1">
              Created {new Date(group.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Members */}
        <div className="px-5 pb-5">
          <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wide mb-3">Members</p>
          <div className="flex flex-col gap-2">
            {group.participants?.map((member) => {
              const memberId = member._id || member;
              const isGroupAdmin = memberId?.toString() === adminId?.toString();
              return (
                <div key={memberId} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-content font-bold flex-shrink-0">
                    {member.profilepic ? (
                      <img src={member.profilepic} alt={member.fullname} className="w-full h-full object-cover" />
                    ) : (
                      member.fullname?.charAt(0).toUpperCase() || "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {member.fullname}
                      {isGroupAdmin && <span className="ml-1.5 text-warning">👑</span>}
                    </p>
                    <p className="text-xs text-base-content/40">@{member.username}</p>
                  </div>
                  {isGroupAdmin && (
                    <span className="badge badge-warning badge-sm">Admin</span>
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
    selectedUser,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
    unreadCounts,
    unreadGroupCounts,
    clearGroupUnread,
    onlineUsers,
  } = useChatStore();

  const { users, loading } = useGetUsers(search);

  const {
    chatters: fetchedChatters,
    loading: chattersLoading,
  } = useGetCurrentChatters();

  const {
    groups,
    loading: groupsLoading,
    getGroups,
  } = useGetGroups();

  const { logout, loading: loggingOut } = useLogout();

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearch("");
  };

  const filteredChatters = fetchedChatters.filter((user) => {
    const query = chatSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      user.fullname?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    );
  });

  const handleClearChat = async (userId, e) => {
    e.stopPropagation();
    setOpenChatMenu(null);
    try {
      await axiosInstance.delete(`/message/clear/${userId}`);
      // If currently viewing this chat, clear messages
      if (selectedUser?._id === userId) {
        useChatStore.setState({ messages: [] });
      }
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
      if (selectedGroup?._id === groupId) {
        useChatStore.setState({ messages: [], selectedGroup: null });
      }
      getGroups();
      toast.success("Group cleared");
    } catch {
      toast.error("Failed to clear group");
    }
  };

  const handleGroupUpdated = (updatedGroup) => {
    setGroupInfoModal(updatedGroup);
    if (selectedGroup?._id === updatedGroup._id) {
      setSelectedGroup(updatedGroup);
    }
    getGroups();
  };

  return (
    <aside className="w-80 flex flex-col h-full bg-base-200 border-r border-base-300" onClick={() => { setOpenChatMenu(null); setOpenGroupMenu(null); }}>

      {/* ================= HEADER ================= */}
      <div className="px-4 py-4 border-b border-base-300">

        {/* Chats */}
        {activeSection === "chats" && (
          <>
            <div className="flex items-center justify-between mb-3">

              <div>
                <p className="font-bold text-lg text-base-content">
                  Chats
                </p>

                <p className="text-xs text-base-content/40">
                  Your conversations
                </p>
              </div>

              <button
                onClick={logout}
                disabled={loggingOut}
                className="btn btn-ghost btn-sm text-base-content/50 hover:text-error tooltip tooltip-bottom"
                data-tip="Logout"
              >
                {loggingOut ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                    />
                  </svg>
                )}
              </button>

            </div>

            <label className="input input-sm input-bordered flex items-center gap-2 bg-base-100">

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5 text-base-content/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0112 0z"
                />
              </svg>

              <input
                type="text"
                className="grow text-xs"
                placeholder="Search conversations..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
              />

              {chatSearch && (
                <button
                  onClick={() => setChatSearch("")}
                  className="text-base-content/40 hover:text-base-content"
                >
                  ✕
                </button>
              )}

            </label>
          </>
        )}

        {/* Find People */}
        {activeSection === "people" && (
          <>
            <div className="mb-3">
              <p className="font-bold text-lg text-base-content">Find People</p>
              <p className="text-xs text-base-content/40">Search for new contacts</p>
            </div>
            <label className="input input-sm input-bordered flex items-center gap-2 bg-base-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0112 0z" />
              </svg>
              <input type="text" className="grow text-xs" placeholder="Search people..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && (
                <button onClick={() => setSearch("")} className="text-base-content/40 hover:text-base-content">✕</button>
              )}
            </label>
          </>
        )}

        {/* Groups */}
        {activeSection === "groups" && (
          <div>
            <p className="font-bold text-lg text-base-content">Groups</p>
            <p className="text-xs text-base-content/40">Your group conversations</p>
          </div>
        )}

        {/* Meet */}
        {activeSection === "meet" && (
          <div>
            <p className="font-bold text-lg text-base-content">Meet</p>
            <p className="text-xs text-base-content/40">Video meetings</p>
          </div>
        )}

        {/* Settings */}
        {activeSection === "settings" && (
          <div>
            <p className="font-bold text-lg text-base-content">Settings</p>
            <p className="text-xs text-base-content/40">Manage your preferences</p>
          </div>
        )}

        {/* Profile */}
        {activeSection === "profile" && (
          <div>
            <p className="font-bold text-lg text-base-content">Profile</p>
            <p className="text-xs text-base-content/40">Your account</p>
          </div>
        )}

      </div>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 overflow-y-auto px-2 py-2">

        {/* ================= CHATS ================= */}
        {activeSection === "chats" && (
          <>
            {chattersLoading ? (
              <div className="flex justify-center py-10">
                <span className="loading loading-dots loading-md text-primary" />
              </div>
            ) : filteredChatters.length === 0 ? (
              <div className="text-center py-10 px-5">

                <div className="text-2xl mb-2">💬</div>

                <p className="text-xs text-base-content/40">
                  {chatSearch ? "No conversations found" : "No conversations yet"}
                </p>

                {!chatSearch && (
                  <p className="text-xs text-base-content/30 mt-1">
                    Find someone to start a chat
                  </p>
                )}

              </div>
            ) : (
              <>
                <p className="px-3 py-2 text-xs font-semibold text-base-content/40 uppercase tracking-wide">
                  Recent Chats
                </p>

                {filteredChatters.map((user) => (
                  <div key={user._id} className="relative">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <UserItem
                          user={user}
                          isSelected={selectedUser?._id === user._id}
                          isOnline={onlineUsers.includes(user._id)}
                          isSearchResult={false}
                          onClick={() => handleSelectUser(user)}
                        />
                      </div>
                      <button
                        className="btn btn-ghost btn-xs mr-2 text-base-content/40 hover:text-base-content"
                        onClick={(e) => { e.stopPropagation(); setOpenChatMenu(openChatMenu === user._id ? null : user._id); setOpenGroupMenu(null); }}
                      >
                        ⋮
                      </button>
                    </div>

                    {openChatMenu === user._id && (
                      <div className="absolute right-2 top-10 z-50 bg-base-100 rounded-xl shadow-lg border border-base-300 py-1 w-36" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="w-full text-left px-4 py-2 text-sm hover:bg-base-200 text-error"
                          onClick={(e) => handleClearChat(user._id, e)}
                        >
                          Clear Chat
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ================= FIND PEOPLE ================= */}
        {activeSection === "people" && (
          <>
            {loading && search.trim() && (
              <div className="flex justify-center py-10">
                <span className="loading loading-dots loading-md text-primary" />
              </div>
            )}

            {!search.trim() && (
              <div className="text-center py-10 px-5">

                <div className="text-2xl mb-2">🔎</div>

                <p className="text-xs text-base-content/40">
                  Search for someone to start chatting
                </p>

              </div>
            )}

            {!loading &&
              search.trim() &&
              users.length === 0 && (
                <div className="text-center py-10 px-5">

                  <div className="text-2xl mb-2">🔎</div>

                  <p className="text-xs text-base-content/40">
                    No users found
                  </p>

                </div>
              )}

            {search.trim() && users.length > 0 && (
              <>
                <p className="px-3 py-2 text-xs font-semibold text-base-content/40 uppercase tracking-wide">
                  Search Results
                </p>

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

        {/* ================= GROUPS ================= */}
        {activeSection === "groups" && (
          <>
            {showCreateGroup ? (
              <CreateGroup
                onCancel={() => setShowCreateGroup(false)}
                onGroupCreated={(group) => {
                  setShowCreateGroup(false);
                  getGroups();
                }}
              />
            ) : (
              <div className="p-4">

                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="btn btn-primary w-full"
                >
                  + Create Group
                </button>

                {groupsLoading ? (
                  <div className="flex justify-center py-10">
                    <span className="loading loading-dots loading-md text-primary" />
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-10">

                    <div className="text-3xl mb-2">👥</div>

                    <p className="text-sm text-base-content/50">No groups yet</p>

                    <p className="text-xs text-base-content/30 mt-1">
                      Create a group to start chatting
                    </p>

                  </div>
                ) : (
                  <div className="mt-4">

                    <p className="px-1 py-2 text-xs font-semibold text-base-content/40 uppercase tracking-wide">
                      Your Groups
                    </p>

                    {groups.map((group) => (
                      <div key={group._id} className="relative">
                        <div className="flex items-center">
                          <div
                            className={`flex-1 flex items-center gap-3 px-3 py-3 mb-1 rounded-xl cursor-pointer transition-colors ${
                              selectedGroup?._id === group._id
                                ? "bg-primary/15"
                                : "hover:bg-base-300/50"
                            }`}
                            onClick={() => {
                              setSelectedGroup(group);
                              clearGroupUnread(group._id);
                            }}
                          >
                            {/* Group Avatar */}
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-content text-lg flex-shrink-0">
                              {group.groupPic ? (
                                <img src={group.groupPic} alt={group.groupName} className="w-full h-full object-cover" />
                              ) : (
                                "👥"
                              )}
                            </div>

                            {/* Group Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-sm truncate">{group.groupName}</p>

                                {unreadGroupCounts[group._id] > 0 && (
                                  <span className="badge badge-primary badge-sm">
                                    {unreadGroupCounts[group._id]}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-base-content/40 truncate">
                                {group.participants?.length || 0} members
                              </p>
                            </div>
                          </div>

                          <button
                            className="btn btn-ghost btn-xs mr-1 text-base-content/40 hover:text-base-content"
                            onClick={(e) => { e.stopPropagation(); setOpenGroupMenu(openGroupMenu === group._id ? null : group._id); setOpenChatMenu(null); }}
                          >
                            ⋮
                          </button>
                        </div>

                        {openGroupMenu === group._id && (
                          <div className="absolute right-1 top-12 z-50 bg-base-100 rounded-xl shadow-lg border border-base-300 py-1 w-40" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-base-200"
                              onClick={(e) => { e.stopPropagation(); setOpenGroupMenu(null); setGroupInfoModal(group); }}
                            >
                              Group Info
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-base-200 text-error"
                              onClick={(e) => handleClearGroup(group._id, e)}
                            >
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

        {/* ================= MEET ================= */}
        {activeSection === "meet" && (
          <div className="p-4">

            <button className="btn btn-primary w-full">
              + Create Meet
            </button>

            <div className="text-center py-10">

              <div className="text-3xl mb-2">📹</div>

              <p className="text-sm text-base-content/50">No meetings yet</p>

              <p className="text-xs text-base-content/30 mt-1">
                Create a meeting to get started
              </p>

            </div>

          </div>
        )}

        {/* ================= SETTINGS ================= */}
        {activeSection === "settings" && (
          <div className="p-4">

            <div className="rounded-xl bg-base-100 p-4">
              <p className="font-semibold text-sm">Settings</p>

              <p className="text-xs text-base-content/40 mt-1">
                Settings will be available here.
              </p>
            </div>

          </div>
        )}

        {/* ================= PROFILE ================= */}
        {activeSection === "profile" && (
          <ProfilePicSection authUser={authUser} setAuthUser={setAuthUser} />
        )}

      </div>

      {/* ================= CURRENT USER ================= */}
      <div className="px-4 py-3 border-t border-base-300 flex items-center gap-3">

        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-primary/40 flex-shrink-0">

          {authUser?.profilepic ? (
            <img
              src={authUser.profilepic}
              alt="me"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-primary-content font-bold">
              {authUser?.fullname?.charAt(0).toUpperCase()}
            </div>
          )}

        </div>

        <div className="flex-1 min-w-0">

          <p className="text-sm font-semibold text-base-content truncate">
            {authUser?.fullname}
          </p>

          <p className="text-xs text-success">
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