import Avatar from "./Avatar";

const UserItem = ({
  user,
  isSelected,
  onClick,
  isOnline,
  isSearchResult,
  subtitle,
  timestamp,
  unreadCount = 0,
  hasRing = false,
  isTyping = false,
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
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "var(--ng-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Avatar with online indicator and optional ring */}
      <div style={{ padding: hasRing || isSelected ? 2 : 0, flexShrink: 0 }}>
        <Avatar
          src={user.profilepic}
          name={user.fullname || user.username}
          size={48}
          online={isSearchResult ? undefined : isOnline}
          borderColor="var(--ng-panel)"
          ring={hasRing || isSelected}
          ringColor={isSelected ? "var(--ng-terracotta)" : undefined}
        />
      </div>

      {/* User info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--ng-text)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.fullname}
          </p>

          {timestamp && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: isSelected ? "var(--ng-accent)" : "var(--ng-muted)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {timestamp}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {isSearchResult ? (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--ng-muted)",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              @{user.username}
            </p>
          ) : isTyping ? (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--ng-accent)",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              typing..
            </p>
          ) : subtitle ? (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: isSelected ? "var(--ng-text)" : "var(--ng-muted)",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                opacity: isSelected ? 0.9 : 0.8,
              }}
            >
              {subtitle}
            </p>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: isOnline ? "var(--ng-online)" : "var(--ng-muted)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: isOnline ? "var(--ng-online)" : "var(--ng-muted)",
                }}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          )}

          {unreadCount > 0 && !isSelected && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 10,
                fontWeight: 700,
                color: "var(--ng-accent-fg)",
                backgroundColor: "var(--ng-accent)",
                borderRadius: 99,
                padding: "1px 7px",
                minWidth: 18,
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserItem;