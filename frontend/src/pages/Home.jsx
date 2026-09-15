import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import MiniNavigation from "../components/MiniNavigation";

const Home = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-base-100">
      
      {/* Left Mini Navigation */}
      <MiniNavigation />

      {/* Middle Sidebar */}
      <Sidebar />

      {/* Right Chat Window */}
      <ChatWindow />

    </div>
  );
};

export default Home;