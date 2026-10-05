import { useAuth } from "../context/AuthContext";

const Message = ({ message }) => {
  const { authUser } = useAuth();

  const senderId =
    message.senderId?._id?.toString() || message.senderId?.toString();

  const myId = authUser?._id?.toString();
  const isMine = senderId === myId;

  const isGroup = message.isGroupMessage;
  const senderName = message.senderId?.fullname;
  const senderPic = message.senderId?.profilepic;
  const senderInitial = senderName?.charAt(0).toUpperCase() || "?";

  const timeStr = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className={`flex mb-2 gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
      {/* Avatar for incoming messages */}
      {!isMine && (
        <div className="w-7 h-7 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-content font-bold text-xs flex-shrink-0 self-end">
          {senderPic ? (
            <img src={senderPic} alt={senderName} className="w-full h-full object-cover" />
          ) : senderInitial}
        </div>
      )}

      <div className="flex flex-col gap-1 max-w-xs">
        {/* Sender name in group chats */}
        {isGroup && !isMine && senderName && (
          <p className="text-xs text-base-content/50 px-1">{senderName}</p>
        )}

        <div
          className={`px-4 py-2 rounded-2xl text-sm break-words shadow-sm ${
            isMine
              ? "bg-primary text-primary-content rounded-br-none"
              : "bg-base-300 text-base-content rounded-bl-none"
          }`}
        >
          {message.message}
        </div>

        {(timeStr || isMine) && (
          <div
            className={`flex items-center gap-1 text-xs opacity-40 ${
              isMine ? "justify-end" : "justify-start"
            }`}
          >
            {timeStr && <span>{timeStr}</span>}

            {isMine && (
              <span className={message.isRead ? "text-info opacity-100" : ""}>
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