import useChatStore from "../store/useChatStore";

const MiniNavigation = () => {
  const { activeSection, setActiveSection } = useChatStore();

  const navigation = [
    {
      id: "chats",
      label: "Chats",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      id: "groups",
      label: "Groups",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M17 20a4 4 0 00-8 0M13 7a4 4 0 11-8 0 4 4 0 018 0zM21 20a4 4 0 00-4-3.87M16 3.13a4 4 0 010 7.75"
          />
        </svg>
      ),
    },
    {
      id: "meet",
      label: "Meet",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 10l4.5-2.5v9L15 14m-9 5h8a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "people",
      label: "Find People",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-20 h-full bg-base-200 border-r border-base-300 flex flex-col items-center py-4">

      {/* Logo */}
      <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-primary-content"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col gap-3 w-full px-2">
        {navigation.map((item) => {
          const active = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                group relative w-full h-16 rounded-xl
                flex flex-col items-center justify-center gap-1
                transition-all duration-200
                ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-base-content/45 hover:text-base-content hover:bg-base-300/60"
                }
              `}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
              )}

              {item.icon}

              <span className="text-[10px] font-medium">
                {item.label}
              </span>

              {/* Tooltip */}
              <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-base-300 text-xs text-base-content whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto flex flex-col gap-3 w-full px-2">

        <button
          onClick={() => setActiveSection("settings")}
          className={`
            group relative w-full h-14 rounded-xl
            flex flex-col items-center justify-center
            transition-all
            ${
              activeSection === "settings"
                ? "bg-primary/15 text-primary"
                : "text-base-content/45 hover:text-base-content hover:bg-base-300/60"
            }
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M10.33 4.32l.94-1.55a1 1 0 011.73 0l.94 1.55a1 1 0 001.12.44l1.76-.42a1 1 0 011.2.7l.47 1.7a1 1 0 00.82.72l1.78.25a1 1 0 01.86 1v1.98a1 1 0 01-.86 1l-1.78.25a1 1 0 00-.82.72l-.47 1.7a1 1 0 01-1.2.7l-1.76-.42a1 1 0 00-1.12.44l-.94 1.55a1 1 0 01-1.73 0l-.94-1.55a1 1 0 00-1.12-.44l-1.76.42a1 1 0 01-1.2-.7l-.47-1.7a1 1 0 00-.82-.72l-1.78-.25a1 1 0 01-.86-1V8.71a1 1 0 01.86-1l1.78-.25a1 1 0 00.82-.72l.47-1.7a1 1 0 011.2-.7l1.76.42a1 1 0 001.12-.44z"
            />
            <circle cx="12" cy="10" r="3" strokeWidth="1.8" />
          </svg>

          <span className="text-[10px] font-medium">Settings</span>
        </button>

        <button
          onClick={() => setActiveSection("profile")}
          className={`
            group relative w-full h-14 rounded-xl
            flex flex-col items-center justify-center
            transition-all
            ${
              activeSection === "profile"
                ? "bg-primary/15 text-primary"
                : "text-base-content/45 hover:text-base-content hover:bg-base-300/60"
            }
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeWidth="1.8"
              d="M20 21a8 8 0 00-16 0M12 13a5 5 0 100-10 5 5 0 000 10z"
            />
          </svg>

          <span className="text-[10px] font-medium">Profile</span>
        </button>

      </div>
    </aside>
  );
};

export default MiniNavigation;