import { useState } from "react";

const MessageInput = ({ onSend, sending }) => {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 px-4 py-3 bg-base-200 border-t border-base-300"
    >
      <textarea
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="textarea textarea-bordered textarea-sm flex-1 resize-none bg-base-100 text-sm leading-relaxed focus:outline-none focus:border-primary transition-colors"
        style={{ minHeight: "2.5rem", maxHeight: "8rem" }}
        onInput={(e) => {
          e.target.style.height = "auto";
          e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
        }}
      />
      <button
        type="submit"
        disabled={sending || !text.trim()}
        className="btn btn-primary btn-sm px-4 flex-shrink-0"
      >
        {sending ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        )}
      </button>
    </form>
  );
};

export default MessageInput;
