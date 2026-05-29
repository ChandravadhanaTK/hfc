import { useState, useEffect } from "react";

const HABITS = [
  { id: 1, emoji: "🥗", label: "Did you eat healthy today?", color: "#8BC000" },
  { id: 2, emoji: "💧", label: "Did you drink enough water?", color: "#00BFFF" },
  { id: 3, emoji: "🧘", label: "Did you meditate today?", color: "#B48EFF" },
  { id: 4, emoji: "😴", label: "Did you sleep 8 hours?", color: "#FFD700" },
  { id: 5, emoji: "🏋️", label: "Did you exercise today?", color: "#FF6B6B" },
  { id: 6, emoji: "📖", label: "Did you read today?", color: "#FF9F43" },
];

const LEVELS = [
  { min: 0, max: 6, name: "Rookie", icon: "🌱", color: "#888" },
  { min: 7, max: 13, name: "Warrior", icon: "⚔️", color: "#8BC000" },
  { min: 14, max: 20, name: "Champion", icon: "🏆", color: "#FFD700" },
  { min: 21, max: 29, name: "Legend", icon: "👑", color: "#FF6B35" },
  { min: 30, max: 999, name: "UNSTOPPABLE", icon: "🔥", color: "#FF3366" },
];

const STARS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: `${6 + Math.random() * 10}px`,
  delay: `${Math.random() * 4}s`,
  duration: `${2 + Math.random() * 3}s`,
}));

export default function KidsPage() {
  const [checked, setChecked] = useState<number[]>([]);
  const [burst, setBurst] = useState<number | null>(null);
  const [streak] = useState(11);
  const [celebrated, setCelebrated] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const level =
    LEVELS.find((l) => streak >= l.min && streak <= l.max) ?? LEVELS[0];

  const xpPercent = Math.min(((streak % 7) / 7) * 100, 100);
  const allDone = checked.length === HABITS.length;

  const toggle = (id: number) => {
    setBurst(id);
    setTimeout(() => setBurst(null), 600);

    setChecked((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  useEffect(() => {
    if (allDone && !celebrated) {
      setCelebrated(true);
      setShowCelebration(true);

      setTimeout(() => setShowCelebration(false), 3000);
    }

    if (!allDone) setCelebrated(false);
  }, [allDone]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #050A1A 0%, #0A0F1E 50%, #050A14 100%)",
        fontFamily: "'Nunito', 'Montserrat', sans-serif",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');

        @keyframes twinkle {
          0%,100% { opacity:0.2; transform:scale(1); }
          50% { opacity:1; transform:scale(1.5); }
        }

        @keyframes floatBounce {
          0%,100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }

        @keyframes starShoot {
          0% { transform: translate(0,0) scale(1); opacity:1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity:0; }
        }

        @keyframes xpFill {
          from { width: 0%; }
          to { width: ${xpPercent}%; }
        }

        @keyframes celebrationBounce {
          0% { transform: scale(0) rotate(-10deg); opacity:0; }
          60% { transform: scale(1.15) rotate(3deg); opacity:1; }
          100% { transform: scale(1) rotate(0deg); opacity:1; }
        }

        @keyframes fadeInUp {
          from { opacity:0; transform:translateY(20px); }
          to { opacity:1; transform:translateY(0); }
        }

        .habit-card:hover {
          transform: translateY(-4px) scale(1.02) !important;
          box-shadow: 0 12px 40px rgba(139,192,0,0.25) !important;
        }

        .habit-card {
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
      `}</style>

      {showCelebration && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              fontSize: "6rem",
            }}
          >
            ⭐
          </div>

          <div
            style={{
              fontSize: "3rem",
              fontWeight: 900,
              color: "#8BC000",
              textShadow: "0 0 40px rgba(139,192,0,0.8)",
            }}
          >
            CHAMPION DAY!
          </div>

          <div
            style={{
              color: "#fff",
              fontSize: "1.2rem",
              marginTop: "0.5rem",
              opacity: 0.7,
            }}
          >
            You completed all 6 habits! 🔥
          </div>
        </div>
      )}

      <div
        style={{
          textAlign: "center",
          marginBottom: "2.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: "clamp(2.2rem, 6vw, 3.5rem)",
            fontWeight: 900,
            color: "#8BC000",
            textShadow: "0 0 30px rgba(139,192,0,0.5)",
          }}
        >
          ⭐ JUNIOR WARRIORS ⭐
        </div>

        <div
          style={{
            color: "#888",
            fontSize: "1rem",
            marginTop: "0.4rem",
            fontWeight: 700,
          }}
        >
          Complete your daily missions!
        </div>
      </div>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0D1A0D, #1A2A0D)",
            borderRadius: "24px",
            padding: "1.75rem",
            border: "2px solid rgba(139,192,0,0.3)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "4.5rem",
            }}
          >
            {level.icon}
          </div>

          <div
            style={{
              color: level.color,
              fontWeight: 900,
              fontSize: "1.6rem",
            }}
          >
            {level.name}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                fontSize: "2rem",
              }}
            >
              🔥
            </span>

            <span
              style={{
                fontSize: "2.5rem",
                fontWeight: 900,
                color: "#8BC000",
                textShadow: "0 0 20px rgba(139,192,0,0.6)",
              }}
            >
              {streak}
            </span>
          </div>

          <div style={{ marginTop: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#888",
                fontSize: "0.75rem",
                marginBottom: "0.4rem",
              }}
            >
              <span>XP Progress</span>

              <span style={{ color: "#8BC000" }}>
                {Math.round(xpPercent)}%
              </span>
            </div>

            <div
              style={{
                height: "14px",
                background: "#1A1A1A",
                borderRadius: "999px",
                overflow: "hidden",
                border: "1px solid rgba(139,192,0,0.2)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${xpPercent}%`,
                  background:
                    "linear-gradient(90deg, #8BC000, #A4D900, #8BC000)",
                  borderRadius: "999px",
                  boxShadow: "0 0 10px rgba(139,192,0,0.7)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
