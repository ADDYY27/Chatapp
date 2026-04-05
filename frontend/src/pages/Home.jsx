import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import useChatStore from "../store/useChatStore";

const Home = () => {
  const { selectedUser, setSelectedUser, onlineUsers } = useChatStore();

  return (
    <div className="flex h-screen overflow-hidden bg-base-100">
      <Sidebar
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        onlineUsers={onlineUsers}
      />
      <ChatWindow
        selectedUser={selectedUser}
        onlineUsers={onlineUsers}
      />
    </div>
  );
};

export default Home;