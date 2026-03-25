"use client";

import { useState } from "react";

export default function Login() {   // ✅ removed extra 'n'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await fetch("http://127.0.0.1:8001/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.access_token) {
      // ✅ Store ONLY JWT
      localStorage.setItem("token", data.access_token);

      console.log("TOKEN SAVED:", data.access_token);

      alert("Login successful");
      window.location.href = "/";
    } else {
      alert("Login failed");
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Login</h1>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}