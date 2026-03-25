"use client";

import { useState } from "react";

export default function Form() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <div style={card}>
      <h1 style={{ fontSize: "40px" }}>YatraAI</h1>

      <p style={{ opacity: 0.7 }}>
        Pick transport-only routes or full vacation plans.
      </p>

      <input
        placeholder="From"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        style={input}
      />

      <input
        placeholder="To"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        style={input}
      />

      <button style={button}>Find transport</button>
    </div>
  );
}

const card = {
  width: "400px",
  background: "rgba(0,0,0,0.6)",
  padding: "20px",
  borderRadius: "10px",
};

const input = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "6px",
  border: "none",
};

const button = {
  marginTop: "15px",
  padding: "12px",
  width: "100%",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
};