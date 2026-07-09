import { AIAssistant } from "./components/AIAssistant.jsx";
import { InteractionForm } from "./components/InteractionForm.jsx";

export default function App() {
  return (
    <main className="app-shell">
      <InteractionForm />
      <AIAssistant />
    </main>
  );
}
