import { useApp } from "./context/AppState";
import Auth from "./components/Auth";
import HeaderBar from "./components/HeadBar";
import Sidebar from "./components/Sidebar";
import MessageList from "./components/MessageList";
import Composer from "./components/composer";

export default function Chat() {
  const { user } = useApp();
  if (!user) return <Auth />;

  return (
    <div className="chat" style={{ gridTemplateColumns: "260px 1fr", gridTemplateRows: "auto 1fr auto" }}>
      <Sidebar />
      <HeaderBar />
      <MessageList />
      <Composer />
    </div>
  );
}
