

import { useState } from 'react';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setOutput('');

    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: input })
      });

      const data = await res.json();
      setOutput(data.result || 'No result returned from AI.');
    } catch (err) {
      console.error(err);
      setOutput('⚠️ Error: Could not connect to AI backend.');
    }

    setLoading(false);
    setInput('');
  };

  return (
    <div className="app-container">
      <h1>🌐 LLM Translator</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          className="input-box"
          placeholder="Enter your text here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Translate & Explain'}
        </button>
      </form>

      <div className="output-box">
        {output || (loading ? "⏳ Waiting for AI..." : "Your AI-powered translation and context will appear here...")}
      </div>
    </div>
  );
}

export default App;
