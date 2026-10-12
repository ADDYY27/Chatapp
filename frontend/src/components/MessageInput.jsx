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
      style={{
        display: "flex", alignItems: "flex-end", gap: 10,
        padding: "12px 16px",
        background: "var(--ng-panel)",
        borderTop: "1px solid var(--ng-border)",
        flexShrink: 0,
      }}
    >
      <textarea
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        aria-label="Message input"
        style={{
          flex: 1,
          resize: "none",
          background: "var(--ng-hover)",
          border: "1px solid var(--ng-border)",
          borderRadius: "var(--r-btn)",
          padding: "10px 14px",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "var(--ng-text)",
          caretColor: "var(--ng-accent)",
          outline: "none",
          lineHeight: 1.5,
          minHeight: 44,
          maxHeight: 128,
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "var(--ng-accent)"}
        onBlur={e => e.target.style.borderColor = "var(--ng-border)"}
        onInput={(e) => {
          e.target.style.height = "auto";
          e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
        }}
      />
      <button
        type="submit"
        disabled={sending || !text.trim()}
        aria-label="Send message"
        style={{
          width: 44, height: 44, borderRadius: "var(--r-btn)",
          background: sending || !text.trim() ? "var(--ng-hover)" : "var(--ng-accent)",
          color: sending || !text.trim() ? "var(--ng-muted)" : "var(--ng-accent-fg)",
          border: "1px solid var(--ng-border)",
          cursor: sending || !text.trim() ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.15s, color 0.15s",
        }}
      >
        {sending ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        )}
      </button>
    </form>
  );
};

export default MessageInput;
