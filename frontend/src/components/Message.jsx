// import { useAuth } from "../context/AuthContext";

// const Message = ({ message }) => {
//   const { authUser } = useAuth();
  
//   // fix: toString() compare karo
//   const isMine = message.senderId?.toString() === authUser?._id?.toString();

//   const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//   });

//   return (
//     <div className={`chat ${isMine ? "chat-end" : "chat-start"}`}>
//       <div className={`chat-bubble text-sm max-w-xs break-words shadow-sm ${isMine ? "chat-bubble-primary" : "chat-bubble-accent"}`}>
//         {message.message}
//       </div>
//       <div className="chat-footer opacity-40 text-xs mt-0.5">{timeStr}</div>
//     </div>
//   );
// };

// export default Message;
import { useAuth } from "../context/AuthContext";

const Message = ({ message }) => {
  const { authUser } = useAuth();

  const senderId = message.senderId?._id?.toString() || message.senderId?.toString();
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
        {timeStr && (
          <span className={`text-xs opacity-40 ${isMine ? "text-right" : "text-left"}`}>
            {timeStr}
          </span>
        )}
      </div>
    </div>
  );
};

export default Message;



