import useChatStore from "../store/useChatStore";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const NAV_ITEMS = [
  {
    id: "chats",
    label: "Chats",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: "groups",
    label: "Groups",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 20a4 4 0 00-8 0M13 7a4 4 0 11-8 0 4 4 0 018 0zM21 20a4 4 0 00-4-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: "meet",
    label: "Meet",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 10l4.5-2.5v9L15 14m-9 5h8a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "people",
    label: "Find",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
    ),
  },
];

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.33 4.32l.94-1.55a1 1 0 011.73 0l.94 1.55a1 1 0 001.12.44l1.76-.42a1 1 0 011.2.7l.47 1.7a1 1 0 00.82.72l1.78.25a1 1 0 01.86 1v1.98a1 1 0 01-.86 1l-1.78.25a1 1 0 00-.82.72l-.47 1.7a1 1 0 01-1.2.7l-1.76-.42a1 1 0 00-1.12.44l-.94 1.55a1 1 0 01-1.73 0l-.94-1.55a1 1 0 00-1.12-.44l-1.76.42a1 1 0 01-1.2-.7l-.47-1.7a1 1 0 00-.82-.72l-1.78-.25a1 1 0 01-.86-1V8.71a1 1 0 01.86-1l1.78-.25a1 1 0 00.82-.72l.47-1.7a1 1 0 011.2-.7l1.76.42a1 1 0 001.12-.44z" />
    <circle cx="12" cy="10" r="3" strokeWidth="1.8" />
  </svg>
);

const NavButton = ({ item, active, onClick }) => (
  <button
    onClick={onClick}
    aria-label={item.label}
    aria-current={active ? "page" : undefined}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      width: "100%",
      minHeight: 56,
      padding: "8px 4px",
      borderRadius: "var(--r-row)",
      border: "none",
      cursor: "pointer",
      transition: "background 0.15s, color 0.15s",
      backgroundColor: active ? "var(--ng-hover)" : "transparent",
      color: active ? "var(--ng-accent)" : "var(--ng-muted)",
      position: "relative",
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = "var(--ng-hover)"; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
  >
    {item.icon}
    <span style={{ fontSize: 10, fontWeight: 500, fontFamily: "var(--font-body)", letterSpacing: "0.01em", lineHeight: 1 }}>
      {item.label}
    </span>
  </button>
);

const MiniNavigation = () => {
  const { activeSection, setActiveSection } = useChatStore();
  const { authUser } = useAuth();

  return (
    <aside
      aria-label="Main navigation"
      style={{
        width: 84,
        minWidth: 84,
        height: "100%",
        backgroundColor: "var(--ng-rail)",
        borderRight: "1px solid var(--ng-border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 8px",
        gap: 0,
        flexShrink: 0,
      }}
    >
      {/* Logo tile */}
      <div
        aria-label="Chattr"
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--r-tile)",
          backgroundColor: "var(--ng-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          flexShrink: 0,
        }}
      >
        <span style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: 24,
          color: "var(--ng-accent-fg)",
          lineHeight: 1,
          letterSpacing: "-1px",
          userSelect: "none",
        }}>
          c
        </span>
      </div>

      {/* Main nav items */}
      <nav
        style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}
        aria-label="Primary navigation"
      >
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeSection === item.id}
            onClick={() => setActiveSection(item.id)}
          />
        ))}
      </nav>

      {/* Bottom items */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
        <NavButton
          item={{ id: "settings", label: "Settings", icon: <SettingsIcon /> }}
          active={activeSection === "settings"}
          onClick={() => setActiveSection("settings")}
        />

        {/* Profile avatar */}
        <button
          onClick={() => setActiveSection("profile")}
          aria-label="Profile"
          aria-current={activeSection === "profile" ? "page" : undefined}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            width: "100%",
            minHeight: 56,
            padding: "8px 4px",
            borderRadius: "var(--r-row)",
            border: "none",
            cursor: "pointer",
            transition: "background 0.15s",
            backgroundColor: activeSection === "profile" ? "var(--ng-hover)" : "transparent",
          }}
          onMouseEnter={e => { if (activeSection !== "profile") e.currentTarget.style.backgroundColor = "var(--ng-hover)"; }}
          onMouseLeave={e => { if (activeSection !== "profile") e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <Avatar
            src={authUser?.profilepic}
            name={authUser?.fullname || authUser?.username}
            size={32}
            style={{ outline: activeSection === "profile" ? "2px solid var(--ng-accent)" : "none", outlineOffset: 2 }}
          />
          <span style={{ fontSize: 10, fontWeight: 500, fontFamily: "var(--font-body)", color: activeSection === "profile" ? "var(--ng-accent)" : "var(--ng-muted)", lineHeight: 1 }}>
            Profile
          </span>
        </button>
      </div>
    </aside>
  );
};

export default MiniNavigation;