"use client";

import { useState } from "react";

interface ArticulateResponse {
  response: string;
  bookSources: Array<{ book: string; chapter: string }>;
}

export function ArticulateModule() {
  const [decision, setDecision] = useState("");
  const [userRationale, setUserRationale] = useState("");
  const [bizRationale, setBizRationale] = useState("");
  const [objection, setObjection] = useState("");
  const [audience, setAudience] = useState("PM"); // default
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!decision || !userRationale) return;

    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/articulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          userRationale,
          bizRationale,
          objection: objection || undefined,
          audience: audience || undefined,
        }),
      });

      const data: ArticulateResponse = await res.json();

      if (!res.ok) {
        setOutput(`Error: ${data}`);
        return;
      }

      setOutput(data.response);
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-bold">Articulate a Design Decision</h2>

      <div>
        <label className="block text-sm font-medium">The decision</label>
        <textarea
          value={decision}
          onChange={e => setDecision(e.target.value)}
          placeholder="What did you design or change?"
          rows={2}
          className="w-full border rounded p-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Why (user reason)</label>
          <textarea
            value={userRationale}
            onChange={e => setUserRationale(e.target.value)}
            placeholder="What problem does this solve for users?"
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Why (business reason)</label>
          <textarea
            value={bizRationale}
            onChange={e => setBizRationale(e.target.value)}
            placeholder="How does it serve business goals?"
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Likely objection</label>
        <textarea
          value={objection}
          onChange={e => setObjection(e.target.value)}
          placeholder="What will the skeptic say?"
          rows={2}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Audience</label>
        <select
          value={audience}
          onChange={e => setAudience(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option>PM</option>
          <option>Eng Lead</option>
          <option>VP / Exec</option>
          <option>Design Team</option>
        </select>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !decision || !userRationale}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate rationale →"}
      </button>

      {output && (
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap text-sm">
          {output}
        </div>
      )}
    </div>
  );
}
