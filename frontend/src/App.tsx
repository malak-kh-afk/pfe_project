import { AppProvider } from "./context/AppState";
import Chat from "./chat";

export default function App() {
  return (
    <AppProvider>
      <Chat />
    </AppProvider>
  );
}
