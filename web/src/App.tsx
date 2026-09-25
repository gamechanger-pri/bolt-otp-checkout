import { useState } from "react";
import Register from "./Register";
import Checkout from "./Checkout";

export default function App() {
  const [view, setView] = useState<"checkout" | "register">("checkout");
  return (
    <div className="shell">
      <nav className="tabs" aria-label="Pages">
        <button aria-current={view === "checkout"} onClick={() => setView("checkout")}>Checkout</button>
        <button aria-current={view === "register"} onClick={() => setView("register")}>Register</button>
      </nav>
      {view === "register" ? <Register onDone={() => setView("checkout")} /> : <Checkout />}
    </div>
  );
}
