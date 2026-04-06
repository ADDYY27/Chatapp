

import useChatStore from "../store/useChatStore";

const UserItem = ({ user, isSelected, onClick, isOnline }) => {
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const count = unreadCounts[user._id] || 0;
  const initial = user.fullname?.charAt(0).toUpperCase() || "?";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all duration-200
        ${isSelected
          ? "bg-primary/20 border border-primary/30"
          : "hover:bg-base-300/60 border border-transparent"
        }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold text-lg ring-2 ring-base-300">
          {initial}
        </div>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-200" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-base-content truncate">{user.fullname}</p>
        <p className="text-xs text-base-content/50">{isOnline ? "🟢 Online" : "⚪ Offline"}</p>
      </div>

      {count > 0 && (
        <div className="w-5 h-5 rounded-full bg-error flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold leading-none">
            {count > 99 ? "99+" : count}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserItem;
