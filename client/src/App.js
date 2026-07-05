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

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
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
