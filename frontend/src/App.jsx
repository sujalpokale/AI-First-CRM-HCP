import { AIAssistant } from "./components/AIAssistant.jsx";
import { InteractionForm } from "./components/InteractionForm.jsx";
import { InteractionList } from "./components/InteractionList.jsx";

export default function App() {
  return (
    <main className="app-shell">
      <InteractionList />
      <InteractionForm />
      <AIAssistant />
    </main>
  );
}
