import { useState } from "react";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://whiteboard-backend-production-5924.up.railway.app";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");

async function login(e) {
  e.preventDefault(); // <— STOP the page reload

  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  if (res.ok) {
    setLoggedIn(true);
  } else {
    alert("Wrong password");
  }
}

  if (!loggedIn) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Login</h2>
        <input
          type="password"
          placeholder="Enter shared password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={(e) => login(e)}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Tldraw />
    </div>
  );
}

export default App;
