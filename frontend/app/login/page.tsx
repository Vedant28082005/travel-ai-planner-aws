"use client";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const apiUrl = `http://${window.location.hostname}:8001/login`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok && data.access_token) {
        localStorage.setItem("token", data.access_token);
        alert("Login successful!");
        window.location.href = "/";
      } else {
        alert("Login failed: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      alert("Network Error: The browser blocked the connection to the Auth API on port 8001! Check your console.");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Login</h1>
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} /><br/>
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} /><br/>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
