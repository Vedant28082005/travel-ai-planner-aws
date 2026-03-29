"use client";
import { useState } from "react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      const apiUrl = `http://${window.location.hostname}:8001/register`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Signup successful! Please login.");
        window.location.href = "/login";
      } else {
        alert("Signup failed: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      alert("Network Error: The browser blocked the connection to the Auth API on port 8001! Check your console.");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Sign Up</h1>
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} /><br/>
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} /><br/>
      <button onClick={handleSignup}>Sign Up</button>
    </div>
  );
}
