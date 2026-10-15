import { useEffect, useCallback } from "react";

/**
 * useKeyboardShortcuts
 * 
 * Reusable hook for global keyboard shortcuts:
 * - Ctrl + K / Cmd + K: Focus sidebar search input and prevent browser default
 * - Escape: Close chat details drawer or dismiss currently active modal/overlay
 * - Ctrl + / / Cmd + /: Toggle shortcuts view
 * 
 * Constraints:
 * - Supports platform modifier keys (Ctrl on Windows/Linux, Cmd on Mac)
 * - Ignores non-Escape shortcuts while typing in input, textarea, or contenteditable
 * - Does not interfere with normal Enter / Shift+Enter in message composer
 * - Registers and cleanly unbinds global window event listeners
 */
export const useKeyboardShortcuts = ({
  onFocusSearch,
  onEscape,
  onToggleShortcuts,
  enabled = true,
}) => {
  const handleKeyDown = useCallback(
    (e) => {
      if (!enabled) return;

      const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key;

      const target = e.target;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // 1. Ctrl + K / Cmd + K -> Focus search input
      if (modifier && (key === "k" || key === "K")) {
        e.preventDefault();
        if (onFocusSearch) {
          onFocusSearch();
        } else {
          const searchInput =
            document.getElementById("chat-search") ||
            document.getElementById("people-search") ||
            document.querySelector('input[type="text"]');
          if (searchInput) {
            searchInput.focus();
            if (searchInput.select) searchInput.select();
          }
        }
        return;
      }

      // 2. Ctrl + / / Cmd + / -> Toggle shortcuts view
      if (modifier && (key === "/" || key === "?")) {
        e.preventDefault();
        if (onToggleShortcuts) {
          onToggleShortcuts();
        }
        return;
      }

      // 3. Escape -> Close modal or details drawer without leaving chat
      if (key === "Escape") {
        if (onEscape) {
          const handled = onEscape();
          if (handled !== false && isInput) {
            target.blur();
          }
        } else if (isInput) {
          target.blur();
        }
        return;
      }

      // If user is currently typing in an input element, do not trigger other shortcuts
      if (isInput) {
        return;
      }
    },
    [enabled, onFocusSearch, onEscape, onToggleShortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
