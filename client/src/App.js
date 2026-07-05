import { useState } from "react";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://whiteboard-backend-production-5924.up.railway.app";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load document from backend
  const loadDocument = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/document`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        const { data } = await res.json();
        setDocumentData(data);
      } else {
        console.error("Failed to load document");
      }
    } catch (err) {
      console.error("Error loading document:", err);
    } finally {
      setLoading(false);
    }
  };

  // Save document to backend
  const saveDocument = async (data) => {
    try {
      await fetch(`${API_BASE}/api/document`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data })
      });
    } catch (err) {
      console.error("Error saving document:", err);
    }
  };

  async function login(e) {
    e.preventDefault();

    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (res.ok) {
      setLoggedIn(true);
      await loadDocument();
    } else {
      alert("Wrong password");
      setPassword("");
    }
  }

  if (!loggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>Shared Whiteboard</h2>
          <form onSubmit={login}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading whiteboard...</h2>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Tldraw
        persistenceKey="whiteboard"
        initialData={documentData}
        onSave={(editor) => {
          const data = editor.getSnapshot();
          saveDocument(data);
        }}
      />
    </div>
  );
}

export default App;
