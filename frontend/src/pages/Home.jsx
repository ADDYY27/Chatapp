import { useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MiniNavigation from "../components/MiniNavigation";
import SettingsView from "../components/SettingsView";
import MeetView from "../components/MeetView";
import FindPeopleView from "../components/FindPeopleView";
import GroupView from "../components/GroupView";
import useChatStore from "../store/useChatStore";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";

const Home = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { activeSection, settingsTab, meetRoomId, selectedUser, isDetailsOpen, setIsDetailsOpen } = useChatStore();

  const handleEscape = useCallback(() => {
    // 1. If shortcuts overlay modal is open, close it
    if (showShortcuts) {
      setShowShortcuts(false);
      return true;
    }

    // 2. If any generic dialog/modal is open, trigger its close button
    const activeModalCloseBtn = document.querySelector(
      '[role="dialog"] button[aria-label*="close" i], .modal button[aria-label*="close" i]'
    );
    if (activeModalCloseBtn) {
      activeModalCloseBtn.click();
      return true;
    }

    // 3. If chat details drawer is open, close it without navigating away from chat
    if (isDetailsOpen) {
      setIsDetailsOpen(false);
      return true;
    }

    return false;
  }, [showShortcuts, isDetailsOpen, setIsDetailsOpen]);

  useKeyboardShortcuts({
    onFocusSearch: () => {
      const searchInput =
        document.getElementById("chat-search") ||
        document.getElementById("people-search") ||
        document.querySelector('input[type="text"]');
      if (searchInput) {
        searchInput.focus();
        if (searchInput.select) searchInput.select();
      }
    },
    onEscape: handleEscape,
    onToggleShortcuts: () => {
      setShowShortcuts((prev) => !prev);
    },
  });

  return (
    <div
      style={{
        display: "flex",
        height: "100svh",
        width: "100%",
        overflow: "hidden",
        background: "var(--ng-bg)",
        position: "relative",
      }}
    >
      <MiniNavigation />
      <Sidebar />
      {activeSection === "settings" || activeSection === "profile" ? (
        <SettingsView initialTab={settingsTab} />
      ) : activeSection === "meet" ? (
        <MeetView selectedRoomId={meetRoomId} />
      ) : activeSection === "people" && !selectedUser ? (
        <FindPeopleView />
      ) : activeSection === "groups" ? (
        <GroupView />
      ) : (
        <ChatWindow />
      )}

      {/* ================= KEYBOARD SHORTCUTS MODAL ================= */}
      {showShortcuts && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard Shortcuts"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setShowShortcuts(false)}
        >
          <div
            style={{
              background: "var(--ng-panel)",
              border: "1px solid var(--ng-border)",
              borderRadius: "var(--r-card)",
              width: "100%",
              maxWidth: 440,
              padding: 24,
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>⌨️</span>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--ng-text)", margin: 0 }}>
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                aria-label="Close shortcuts modal"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ng-muted)",
                  fontSize: 18,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "var(--r-btn)",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { keys: "Ctrl + K", desc: "Focus sidebar search input" },
                { keys: "Escape", desc: "Close modals & details drawer" },
                { keys: "Ctrl + /", desc: "Toggle keyboard shortcuts" },
                { keys: "Enter", desc: "Send message" },
                { keys: "Shift + Enter", desc: "New line in composer" },
              ].map((sc) => (
                <div
                  key={sc.keys}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--ng-hover)",
                    borderRadius: "var(--r-btn)",
                    border: "1px solid var(--ng-border)",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-text)" }}>
                    {sc.desc}
                  </span>
                  <kbd
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      background: "var(--ng-panel)",
                      border: "1px solid var(--ng-border)",
                      padding: "3px 8px",
                      borderRadius: 6,
                      color: "var(--ng-accent)",
                    }}
                  >
                    {sc.keys}
                  </kbd>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button
                onClick={() => setShowShortcuts(false)}
                style={{
                  background: "var(--ng-accent)",
                  color: "var(--ng-accent-fg)",
                  border: "none",
                  borderRadius: "var(--r-btn)",
                  padding: "8px 18px",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;