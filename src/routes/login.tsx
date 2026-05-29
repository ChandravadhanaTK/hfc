import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 8}s`,
  duration: `${6 + Math.random() * 6}s`,
  size: `${2 + Math.random() * 4}px`,
}));

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/app" });
    }, 1500);
  };

  const quotes = [
    "Discipline is the bridge between goals and accomplishment.",
    "Forge yourself in the fires of consistency.",
    "The warrior is not defined by strength. It's defined by will.",
  ];
  const quote = quotes[Math.floor(Date.now() / 86400000) % quotes.length];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#000000",
      display: "flex",
      fontFamily: "'Montserrat', sans-serif",
      overflow: "hidden",
    }}>
      {/* ── LEFT PANEL ───────────────────────── */}
      <div style={{
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem",
        borderRight: "1px solid rgba(139,192,0,0.12)",
        overflow: "hidden",
      }}>
        {/* Particles */}
        {PARTICLES.map(p => (
          <span key={p.id} style={{
            position: "absolute",
            left: p.left,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: "#8BC000",
            opacity: 0.4,
            animation: `floatUp ${p.duration} ${p.delay} infinite ease-in`,
          }} />
        ))}

        {/* Logo */}
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <div style={{
            fontSize: "5rem",
            fontWeight: "900",
            color: "#8BC000",
            lineHeight: 1,
            textShadow: "0 0 40px rgba(139,192,0,0.6), 0 0 80px rgba(139,192,0,0.3)",
            letterSpacing: "-2px",
            animation: "logoPulse 3s ease-in-out infinite",
          }}>
            HFC
          </div>
          <div style={{
            color: "#ffffff",
            fontSize: "0.85rem",
            letterSpacing: "6px",
            marginTop: "0.5rem",
            opacity: 0.7,
          }}>
            HOLISTIC FITNESS CLUB
          </div>

          {/* Divider */}
          <div style={{
            width: "60px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #8BC000, transparent)",
            margin: "2rem auto",
          }} />

          {/* Quote */}
          <p style={{
            color: "#8BC000",
            fontStyle: "italic",
            fontSize: "1.05rem",
            maxWidth: "320px",
            lineHeight: 1.6,
            opacity: 0.9,
            fontWeight: 500,
          }}>
            "{quote}"
          </p>

          {/* Stat badges */}
          <div style={{
            display: "flex",
            gap: "1.5rem",
            marginTop: "3rem",
            justifyContent: "center",
          }}>
            {[["1.2K+", "Warriors"], ["98%", "Retention"], ["365", "Days Active"]].map(([num, label]) => (
              <div key={label} style={{
                textAlign: "center",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                border: "1px solid rgba(139,192,0,0.2)",
                background: "rgba(139,192,0,0.05)",
              }}>
                <div style={{ color: "#8BC000", fontWeight: 900, fontSize: "1.4rem" }}>{num}</div>
                <div style={{ color: "#888", fontSize: "0.7rem", letterSpacing: "1px" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (FORM) ───────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "420px",
          background: "#0D0D0D",
          borderRadius: "24px",
          padding: "2.5rem",
          border: "1px solid rgba(139,192,0,0.15)",
          boxShadow: "0 0 80px rgba(139,192,0,0.08)",
          animation: "pageFadeIn 0.5s ease-out forwards",
        }}>
          <h2 style={{
            color: "#ffffff",
            fontSize: "1.8rem",
            fontWeight: 800,
            marginBottom: "0.4rem",
          }}>
            Welcome back, Warrior
          </h2>
          <p style={{ color: "#555", fontSize: "0.9rem", marginBottom: "2rem" }}>
            Your tribe is waiting. Sign in.
          </p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ color: "#888", fontSize: "0.78rem", letterSpacing: "1px", display: "block", marginBottom: "0.4rem" }}>
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="warrior@hfc.com"
                style={{
                  width: "100%",
                  background: "#1A1A1A",
                  border: "1px solid #2a2a2a",
                  borderRadius: "12px",
                  padding: "0.85rem 1rem",
                  color: "#fff",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={e => {
                  e.target.style.borderColor = "#8BC000";
                  e.target.style.boxShadow = "0 0 0 3px rgba(139,192,0,0.15)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "#2a2a2a";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "1.75rem" }}>
              <label style={{ color: "#888", fontSize: "0.78rem", letterSpacing: "1px", display: "block", marginBottom: "0.4rem" }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  background: "#1A1A1A",
                  border: "1px solid #2a2a2a",
                  borderRadius: "12px",
                  padding: "0.85rem 1rem",
                  color: "#fff",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={e => {
                  e.target.style.borderColor = "#8BC000";
                  e.target.style.boxShadow = "0 0 0 3px rgba(139,192,0,0.15)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "#2a2a2a";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#1a4a2e" : "#8BC000",
                color: "#000",
                fontWeight: 800,
                fontSize: "1rem",
                padding: "0.95rem",
                borderRadius: "12px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "2px",
                transition: "all 0.2s ease-out",
                boxShadow: loading ? "none" : "0 0 24px rgba(139,192,0,0.4)",
              }}
              onMouseEnter={e => {
                if (!loading) {
                  (e.target as HTMLButtonElement).style.boxShadow = "0 0 40px rgba(139,192,0,0.7), 0 0 80px rgba(139,192,0,0.3)";
                  (e.target as HTMLButtonElement).style.transform = "scale(1.02)";
                }
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(139,192,0,0.4)";
                (e.target as HTMLButtonElement).style.transform = "scale(1)";
              }}
            >
              {loading ? "ENTERING THE ARENA..." : "ENTER THE ARENA →"}
            </button>
          </form>

          <p style={{ color: "#444", fontSize: "0.82rem", textAlign: "center", marginTop: "1.5rem" }}>
            New warrior?{" "}
            <a href="/signup" style={{ color: "#8BC000", textDecoration: "none", fontWeight: 700 }}>
              Join HFC
            </a>
          </p>
        </div>
      </div>

      {/* ── ANIMATION STYLES ─────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap');
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0.4; }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }
        @keyframes logoPulse {
          0%,100% { text-shadow: 0 0 40px rgba(139,192,0,0.6); }
          50%      { text-shadow: 0 0 80px rgba(139,192,0,1), 0 0 120px rgba(139,192,0,0.5); }
        }
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
