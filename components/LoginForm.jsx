"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F9F4EF", fontFamily: "'Inter', system-ui, sans-serif", padding: 20,
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%", maxWidth: 360, background: "#FFFFFF", borderRadius: 16,
          padding: 28, display: "flex", flexDirection: "column", gap: 14,
          boxShadow: "0 4px 20px rgba(28,26,46,0.08)",
        }}
      >
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#8B4F6B",
        }}>
          care p<span style={{ color: "#D4922A" }}>AI</span>r admin
        </div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#1C1A2E" }}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              display: "block", width: "100%", marginTop: 6, padding: "10px 12px",
              borderRadius: 10, border: "1px solid #EDE8EA", fontSize: 14,
            }}
          />
        </label>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#1C1A2E" }}>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: "block", width: "100%", marginTop: 6, padding: "10px 12px",
              borderRadius: 10, border: "1px solid #EDE8EA", fontSize: 14,
            }}
          />
        </label>
        {error && <p style={{ margin: 0, fontSize: 12, color: "#B0473F" }}>{error}</p>}
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "10px 18px", borderRadius: 11, cursor: busy ? "default" : "pointer",
            background: "#8B4F6B", color: "#fff", border: "none",
            fontSize: 13, fontWeight: 700, opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
