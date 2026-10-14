import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MiniNavigation from "../components/MiniNavigation";
import SettingsView from "../components/SettingsView";
import useChatStore from "../store/useChatStore";

const Home = () => {
  const { activeSection, settingsTab } = useChatStore();

  return (
    <div
      style={{
        display: "flex",
        height: "100svh",
        width: "100%",
        overflow: "hidden",
        background: "var(--ng-bg)",
      }}
    >
      <MiniNavigation />
      <Sidebar />
      {activeSection === "settings" || activeSection === "profile" ? (
        <SettingsView initialTab={settingsTab} />
      ) : (
        <ChatWindow />
      )}
    </div>
  );
};

export default Home;