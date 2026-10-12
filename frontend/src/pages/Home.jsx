import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MiniNavigation from "../components/MiniNavigation";

const Home = () => {
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
      <ChatWindow />
    </div>
  );
};

export default Home;