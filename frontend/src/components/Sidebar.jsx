import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import useGetUsers from "../hooks/useGetUsers";
import useGetCurrentChatters from "../hooks/useGetCurrentChatters";
import useLogout from "../hooks/useLogout";
import useChatStore from "../store/useChatStore";
import UserItem from "./UserItem";
import CreateGroup from "./CreateGroup";
import useGetGroups from "../hooks/useGetGroups";

const Sidebar = () => {
  const { authUser } = useAuth();

  const [search, setSearch] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
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
  // Find People search
  const { users, loading } = useGetUsers(search);

  // Existing conversations
  const {
    chatters,
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

  const filteredChatters = chatters.filter((user) => {
    const query = chatSearch.toLowerCase().trim();

    if (!query) return true;

    return (
      user.fullname?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    );
  });

  return (
    <aside className="w-80 flex flex-col h-full bg-base-200 border-r border-base-300">

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

            {/* Chat Search */}
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
       {activeSection === "groups" && (
  <>
    {showCreateGroup ? (
      <CreateGroup
        onCancel={() => setShowCreateGroup(false)}
        onGroupCreated={(group) => {
          console.log("Group created:", group);
          setShowCreateGroup(false);

          // Newly created group ko immediately list me add karo
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

            <div className="text-3xl mb-2">
              👥
            </div>

            <p className="text-sm text-base-content/50">
              No groups yet
            </p>

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
             <div
  key={group._id}
onClick={() => {
  setSelectedGroup(group);
  clearGroupUnread(group._id);
}}
  className={`flex items-center gap-3 px-3 py-3 mb-1 rounded-xl cursor-pointer transition-colors ${
    selectedGroup?._id === group._id
      ? "bg-primary/15"
      : "hover:bg-base-300/50"
  }`}
>

                {/* Group Avatar */}
                <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-content text-lg">
                  👥
                </div>

                {/* Group Info */}
                <div className="flex-1 min-w-0">

                  <div className="flex items-center justify-between gap-2">
  <p className="font-semibold text-sm truncate">
    {group.groupName}
  </p>

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
            ))}

          </div>
        )}

      </div>
    )}
  </>
)}

        {/* Groups */}
        {activeSection === "groups" && (
          <div>
            <p className="font-bold text-lg text-base-content">
              Groups
            </p>

            <p className="text-xs text-base-content/40">
              Your group conversations
            </p>
          </div>
        )}

        {/* Meet */}
        {activeSection === "meet" && (
          <div>
            <p className="font-bold text-lg text-base-content">
              Meet
            </p>

            <p className="text-xs text-base-content/40">
              Video meetings
            </p>
          </div>
        )}

        {/* Settings */}
        {activeSection === "settings" && (
          <div>
            <p className="font-bold text-lg text-base-content">
              Settings
            </p>

            <p className="text-xs text-base-content/40">
              Manage your preferences
            </p>
          </div>
        )}

        {/* Profile */}
        {activeSection === "profile" && (
          <div>
            <p className="font-bold text-lg text-base-content">
              Profile
            </p>

            <p className="text-xs text-base-content/40">
              Your account
            </p>
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

                <div className="text-2xl mb-2">
                  💬
                </div>

                <p className="text-xs text-base-content/40">
                  {chatSearch
                    ? "No conversations found"
                    : "No conversations yet"}
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
                  <UserItem
                    key={user._id}
                    user={user}
                    isSelected={selectedUser?._id === user._id}
                    isOnline={onlineUsers.includes(user._id)}
                    isSearchResult={false}
                    onClick={() => handleSelectUser(user)}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* ================= FIND PEOPLE ================= */}
        {activeSection === "find" && (
          <>
            {loading && search.trim() && (
              <div className="flex justify-center py-10">
                <span className="loading loading-dots loading-md text-primary" />
              </div>
            )}

            {!search.trim() && (
              <div className="text-center py-10 px-5">

                <div className="text-2xl mb-2">
                  🔎
                </div>

                <p className="text-xs text-base-content/40">
                  Search for someone to start chatting
                </p>

              </div>
            )}

            {!loading &&
              search.trim() &&
              users.length === 0 && (
                <div className="text-center py-10 px-5">

                  <div className="text-2xl mb-2">
                    🔎
                  </div>

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
                  console.log("Group created:", group);
                  setShowCreateGroup(false);
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

                <div className="text-center py-10">

                  <div className="text-3xl mb-2">
                    👥
                  </div>

                  <p className="text-sm text-base-content/50">
                    No groups yet
                  </p>

                  <p className="text-xs text-base-content/30 mt-1">
                    Create a group to start chatting
                  </p>

                </div>

              </div>
            )}
          </>
        )}

        {/* ================= MEET ================= */}
        {activeSection === "meet" && (
          <div className="p-4">

            <button
              className="btn btn-primary w-full"
            >
              + Create Meet
            </button>

            <div className="text-center py-10">

              <div className="text-3xl mb-2">
                📹
              </div>

              <p className="text-sm text-base-content/50">
                No meetings yet
              </p>

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
              <p className="font-semibold text-sm">
                Settings
              </p>

              <p className="text-xs text-base-content/40 mt-1">
                Settings will be available here.
              </p>
            </div>

          </div>
        )}

        {/* ================= PROFILE ================= */}
        {activeSection === "profile" && (
          <div className="p-4">

            <div className="flex flex-col items-center text-center py-5">

              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/30">

                {authUser?.profilepic ? (
                  <img
                    src={authUser.profilepic}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-primary-content font-bold text-2xl">
                    {authUser?.fullname
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>
                )}

              </div>

              <p className="font-semibold mt-3">
                {authUser?.fullname}
              </p>

              <p className="text-xs text-base-content/40">
                @{authUser?.username}
              </p>

            </div>

          </div>
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

    </aside>
  );
};

export default Sidebar;