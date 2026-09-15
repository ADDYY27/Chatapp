import { useAuth } from "../context/AuthContext";

const Message = ({ message }) => {
  const { authUser } = useAuth();

  const senderId =
    message.senderId?._id?.toString() || message.senderId?.toString();

  const myId = authUser?._id?.toString();
  const isMine = senderId === myId;

  const timeStr = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col gap-1 max-w-xs">
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