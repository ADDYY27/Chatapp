import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MiniNavigation from "../components/MiniNavigation";
import SettingsView from "../components/SettingsView";
import MeetView from "../components/MeetView";
import FindPeopleView from "../components/FindPeopleView";
import GroupView from "../components/GroupView";
import useChatStore from "../store/useChatStore";

const Home = () => {
  const { activeSection, settingsTab, meetRoomId, selectedUser } = useChatStore();

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
      ) : activeSection === "meet" ? (
        <MeetView selectedRoomId={meetRoomId} />
      ) : activeSection === "people" && !selectedUser ? (
        <FindPeopleView />
      ) : activeSection === "groups" ? (
        <GroupView />
      ) : (
        <ChatWindow />
      )}
    </div>
  );
};

export default Home;