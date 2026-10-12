import Avatar from "./Avatar";

const UserItem = ({
  user,
  isSelected,
  onClick,
  isOnline,
  isSearchResult,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      aria-label={`Open conversation with ${user.fullname}`}
      aria-pressed={isSelected}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        marginBottom: 2,
        borderRadius: "var(--r-row)",
        cursor: "pointer",
        border: "1px solid transparent",
        transition: "background 0.15s, border-color 0.15s",
        minHeight: 64,
        backgroundColor: isSelected ? "var(--ng-hover)" : "transparent",
        borderColor: isSelected ? "var(--ng-border)" : "transparent",
        outline: "none",
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "var(--ng-hover)"; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {/* Avatar with online indicator */}
      <Avatar
        src={user.profilepic}
        name={user.fullname || user.username}
        size={48}
        online={isSearchResult ? undefined : isOnline}
        borderColor="var(--ng-panel)"
      />

      {/* User info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 14,
          color: "var(--ng-text)",
          margin: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {user.fullname}
        </p>

        {isSearchResult ? (
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--ng-muted)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            @{user.username}
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: isOnline ? "var(--ng-online)" : "var(--ng-muted)",
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: isOnline ? "var(--ng-online)" : "var(--ng-muted)",
            }}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserItem;