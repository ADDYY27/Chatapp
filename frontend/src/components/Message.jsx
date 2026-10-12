import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const Message = ({ message }) => {
  const { authUser } = useAuth();

  const senderId = message.senderId?._id?.toString() || message.senderId?.toString();
  const myId = authUser?._id?.toString();
  const isMine = senderId === myId;

  const isGroup = message.isGroupMessage;
  const senderName = message.senderId?.fullname;
  const senderPic = message.senderId?.profilepic;

  const timeStr = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div style={{ display: "flex", marginBottom: 4, gap: 8, justifyContent: isMine ? "flex-end" : "flex-start" }}>
      {!isMine && (
        <Avatar
          src={senderPic}
          name={senderName}
          size={28}
          style={{ alignSelf: "flex-end", flexShrink: 0 }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 320 }}>
        {isGroup && !isMine && senderName && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ng-muted)", margin: "0 0 1px", paddingLeft: 4 }}>
            {senderName}
          </p>
        )}

        <div style={{
          padding: "9px 14px",
          borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          lineHeight: 1.5,
          wordBreak: "break-word",
          backgroundColor: isMine ? "var(--ng-accent)" : "var(--ng-hover)",
          color: isMine ? "var(--ng-accent-fg)" : "var(--ng-text)",
        }}>
          {message.message}
        </div>

        {(timeStr || isMine) && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, opacity: 0.5, justifyContent: isMine ? "flex-end" : "flex-start", fontFamily: "var(--font-body)" }}>
            {timeStr && <span>{timeStr}</span>}
            {isMine && (
              <span style={{ color: message.isRead ? "var(--ng-online)" : "inherit", opacity: message.isRead ? 1 : 0.5 }}>
                {message.isRead ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;