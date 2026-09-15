const UserItem = ({
  user,
  isSelected,
  onClick,
  isOnline,
  isSearchResult,
}) => {
  const initial = user.fullname?.charAt(0).toUpperCase() || "?";

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 mx-2 mb-1
        cursor-pointer rounded-xl
        border transition-all duration-200
        ${
          isSelected
            ? "bg-primary/15 border-primary/30"
            : "border-transparent hover:bg-base-300/50"
        }
      `}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold text-lg">
          {initial}
        </div>

        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-200" />
        )}
      </div>

      {/* User Info */}
      <div className="flex flex-col items-start justify-center flex-1 min-w-0 text-left">
        <p className="font-semibold text-sm text-base-content truncate w-full">
          {user.fullname}
        </p>

        {isSearchResult ? (
          <p className="text-xs text-base-content/45 truncate w-full mt-0.5">
            @{user.username}
          </p>
        ) : (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? "bg-success" : "bg-base-content/30"
              }`}
            />

            <span
              className={`text-xs ${
                isOnline ? "text-success" : "text-base-content/40"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserItem;