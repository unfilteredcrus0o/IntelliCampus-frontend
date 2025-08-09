import { useState } from "react";

function App() {
  const [status, setStatus] = useState("");

  const checkHealth = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/health");
      const data = await res.json();
      setStatus(data.status);
    } catch (err) {
      setStatus("Error connecting to backend");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Health Check</h1>
      <button 
        onClick={checkHealth} 
        style={{ padding: "10px", fontSize: "16px" }}
      >
        Check Health
      </button>
      {status && <p>Backend status: {status}</p>}
    </div>
  );
}

export default App;
