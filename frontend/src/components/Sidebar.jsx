
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import useGetUsers from "../hooks/useGetUsers";
import useLogout from "../hooks/useLogout";
import useChatStore from "../store/useChatStore";
import UserItem from "./UserItem";

const Sidebar = () => {
  const { authUser } = useAuth();
  const [search, setSearch] = useState("");
  const { users, loading } = useGetUsers(search);
  const { logout, loading: loggingOut } = useLogout();
  const { selectedUser, setSelectedUser, onlineUsers } = useChatStore();

  return (
    <aside className="w-80 flex flex-col h-full bg-base-200 border-r border-base-300">
      {/* Header */}
      <div className="px-4 py-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-content" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <span className="font-bold text-base-content text-lg tracking-tight">Chattr</span>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
        </div>

        {/* Search */}
        <label className="input input-sm input-bordered flex items-center gap-2 bg-base-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            className="grow text-xs"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-base-content/40 hover:text-base-content">✕</button>
          )}
        </label>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-dots loading-md text-primary" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-xs text-base-content/40 py-10">No users found</p>
        ) : (
          users.map((user) => (
            <UserItem
              key={user._id}
              user={user}
              isSelected={selectedUser?._id === user._id}
              isOnline={onlineUsers.includes(user._id)}
              onClick={() => setSelectedUser(user)}  //
            />
          ))
        )}
      </div>

      {/* Current user footer */}
      <div className="px-4 py-3 border-t border-base-300 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-primary/40 flex-shrink-0">
          {authUser?.profilepic ? (
            <img src={authUser.profilepic} alt="me" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-primary-content font-bold">
              {authUser?.fullname?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-base-content truncate">{authUser?.fullname}</p>
          <p className="text-xs text-success">● Active</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

