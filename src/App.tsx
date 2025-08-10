import { useState } from "react";
import Button from '@mui/material/Button';

function App() {
  const [status, setStatus] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL;

  const checkHealth = async () => {
    try {
      const res = await fetch(`${apiUrl}/health`);
      const data = await res.json();
      setStatus(data.status);
    } catch (err) {
      setStatus("Error connecting to backend");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Health Check</h1>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={checkHealth}
      >
        Check Health
      </Button>
      {status && <p>Backend status: {status}</p>}
    </div>
  );
}

export default App;
