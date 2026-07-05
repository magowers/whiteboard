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
  const [editor, setEditor] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);

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

  // Save document to backend (debounced)
  const saveDocument = async (editorInstance) => {
    try {
      const data = editorInstance.getSnapshot();
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

  // Handle editor changes with debouncing
  const handleChange = (editorInstance) => {
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Debounce saves to avoid too many requests (save after 1 second of inactivity)
    const timeout = setTimeout(() => {
      saveDocument(editorInstance);
    }, 1000);
    
    setSaveTimeout(timeout);
  };

  // Handle editor mount
  const handleMount = (editorInstance) => {
    setEditor(editorInstance);
    
    // Load backend data into editor
    if (documentData) {
      editorInstance.loadSnapshot(documentData);
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
        onMount={handleMount}
        onChange={handleChange}
      />
    </div>
  );
}

export default App;
