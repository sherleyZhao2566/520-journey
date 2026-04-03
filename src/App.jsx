/**
 * 520 Love Journey — Upgraded Interactive Experience
 * ===================================================
 * MAJOR IMPROVEMENTS:
 * - Narrative arc: 初遇 → 相识 → 心动 → 爱你 → 永远
 * - Diverse interactions: password input, timing-based click, hover-discovery, rhythm game
 * - Both success & failure states for all levels (failure always positive & encouraging)
 * - Ambient floating particles, glassmorphism UI, layered depth
 * - Web Audio API sound effects (no external lib needed)
 * - Chapter transition screens between levels
 * - Easter eggs: type "520", click logo 5x, tap finale screen
 * - Spark burst & confetti on successes
 * - Fully mobile-responsive with 100dvh
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import confetti from "canvas-confetti";

// ─────────────────────────────────────────────
// 🎵 SOUND ENGINE  (Web Audio API — no library)
// ─────────────────────────────────────────────
function useSoundEngine() {
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (autoplay policy)
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };

  const tone = (freq, type = "sine", dur = 0.3, vol = 0.2) => {
    try {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + dur);
    } catch (_) {}
  };

  return {
    playSuccess: () => {
      tone(523, "sine", 0.12, 0.18);
      setTimeout(() => tone(659, "sine", 0.12, 0.18), 110);
      setTimeout(() => tone(784, "sine", 0.22, 0.2), 220);
    },
    playError: () => {
      tone(280, "sawtooth", 0.18, 0.12);
      setTimeout(() => tone(220, "sawtooth", 0.18, 0.12), 140);
    },
    playClick: () => tone(440, "sine", 0.08, 0.12),
    playHover: () => tone(880, "sine", 0.04, 0.07),
    playBeat: () => tone(330, "triangle", 0.1, 0.15),
  };
}

// ─────────────────────────────────────────────
// ✨ SPARK BURST  (radial dots explosion)
// ─────────────────────────────────────────────
function SparkBurst({ x, y, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        left: x,
        top: y,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * 360;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * 55,
              y: Math.sin((angle * Math.PI) / 180) * 55,
              scale: [0, 1.2, 0],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: `hsl(${330 + i * 8}, 90%, 65%)`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// 🫧 AMBIENT FLOATING PARTICLES (background ambiance)
// ─────────────────────────────────────────────
function AmbientParticles({ colors }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: `${Math.random() * 100}vw`,
            y: "108vh",
            scale: 0,
            opacity: 0,
          }}
          animate={{
            y: "-8vh",
            scale: [0, 1, 0.8, 0],
            opacity: [0, 0.7, 0.7, 0],
            x: `${Math.random() * 100}vw`,
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 6,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: 6 + Math.random() * 10,
            height: 6 + Math.random() * 10,
            borderRadius: "50%",
            background: colors[i % colors.length],
            filter: "blur(1px)",
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 🎬 CHAPTER TRANSITION SCREEN
// ─────────────────────────────────────────────
function ChapterCard({ chapter, title, subtitle, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2300);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 8, 20, 0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        backdropFilter: "blur(8px)",
      }}
    >
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.45, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          color: "#fab1a0",
          letterSpacing: "5px",
          fontSize: "0.75rem",
          textTransform: "uppercase",
          marginBottom: "0.6rem",
        }}
      >
        {chapter}
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", damping: 18 }}
        style={{
          color: "white",
          fontSize: "clamp(2.5rem, 8vw, 3.5rem)",
          margin: 0,
          fontWeight: 800,
          letterSpacing: "-1px",
        }}
      >
        {title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ delay: 0.55 }}
        style={{
          color: "#dfe6e9",
          marginTop: "0.5rem",
          letterSpacing: "3px",
          fontSize: "0.9rem",
        }}
      >
        {subtitle}
      </motion.p>

      {/* Decorative line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        style={{
          marginTop: "2rem",
          width: "60px",
          height: "2px",
          background: "linear-gradient(90deg, #ff7675, #fd79a8)",
          borderRadius: "2px",
        }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// 📖 STORY METADATA
// ─────────────────────────────────────────────
const STORY = {
  2: { chapter: "Chapter II", title: "相识", subtitle: "Getting Close" },
  3: { chapter: "Chapter III", title: "心动", subtitle: "That Feeling" },
  4: { chapter: "Chapter IV", title: "爱你", subtitle: "Falling In Love" },
  5: { chapter: "Finale", title: "永远", subtitle: "Forever & Always" },
};

// Background gradient per level
const BG = {
  1: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  2: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  3: "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  4: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  5: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
};

// Ambient particle colors per level
const PARTICLES = {
  1: ["rgba(255,182,193,0.55)", "rgba(255,228,196,0.55)", "rgba(252,182,160,0.4)"],
  2: ["rgba(162,155,254,0.5)", "rgba(142,197,252,0.5)", "rgba(253,203,110,0.4)"],
  3: ["rgba(252,203,144,0.55)", "rgba(213,126,235,0.5)", "rgba(255,182,193,0.5)"],
  4: ["rgba(255,154,158,0.55)", "rgba(254,207,239,0.6)", "rgba(255,182,193,0.5)"],
};

// ═══════════════════════════════════════════════════════════
// LEVEL 1 — 初遇 · First Meeting
// Interaction: Password input with letter-by-letter hint reveal
// Easter egg: type "520" for a special message
// ═══════════════════════════════════════════════════════════
const PASSWORD = "loveu";

function Level1({ onComplete, sfx }) {
  const [val, setVal] = useState("");
  const [status, setStatus] = useState("idle"); // idle | error | success
  const [attempts, setAttempts] = useState(0);
  const [hintLen, setHintLen] = useState(0);
  const [easteregg, setEasteregg] = useState(false);
  const [sparks, setSparks] = useState([]);
  const controls = useAnimation();

  const hint = PASSWORD.slice(0, hintLen);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const input = val.trim().toLowerCase();

      // 🥚 Easter egg: type 520
      if (input === "520") {
        setEasteregg(true);
        sfx.playSuccess();
        setVal("");
        return;
      }

      if (input === PASSWORD) {
        setStatus("success");
        sfx.playSuccess();
        const btn = e.currentTarget.querySelector("button[type=submit]");
        if (btn) {
          const r = btn.getBoundingClientRect();
          setSparks((s) => [
            ...s,
            { id: Date.now(), x: r.left + r.width / 2, y: r.top + r.height / 2 },
          ]);
        }
        setTimeout(onComplete, 1100);
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setStatus("error");
        sfx.playError();
        controls.start({
          x: [0, -10, 10, -7, 7, 0],
          transition: { duration: 0.35 },
        });
        // Reveal one more hint letter after 2 failed attempts
        if (next >= 2) setHintLen((h) => Math.min(h + 1, PASSWORD.length));
        setTimeout(() => setStatus("idle"), 900);
      }
    },
    [val, attempts, controls, onComplete, sfx]
  );

  const errorLines = [
    "哎呀！再想想~ 🐣",
    "不对哦，但你很勇敢！💪",
    "差一点，加油！✨",
    "提示来咯，继续！🌸",
    "你快了！坚持住 💫",
  ];

  return (
    <div>
      {sparks.map((s) => (
        <SparkBurst
          key={s.id}
          x={s.x}
          y={s.y}
          onDone={() => setSparks((p) => p.filter((x) => x.id !== s.id))}
        />
      ))}

      {/* Chapter label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        style={styles.chapterLabel}
      >
        Chapter I · 初遇
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={styles.heading}
      >
        嘿，是你吗？ 👋
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={styles.subtext}
      >
        每个故事都有一个开始。
        <br />
        输入那个只有你知道的密语 ✨
      </motion.p>

      {/* 🥚 Easter egg reveal */}
      <AnimatePresence>
        {easteregg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: "linear-gradient(135deg, #ffeaa7, #fab1a0)",
              borderRadius: "16px",
              padding: "0.8rem 1rem",
              marginBottom: "0.8rem",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: "#2d3436",
            }}
          >
            🎉 <b>发现彩蛋！</b>
            <br />
            <span style={{ fontSize: "0.82rem" }}>
              你真的好细心 💕 继续输入真正的密语哦~
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} style={{ marginTop: "0.5rem" }}>
        <motion.div animate={controls}>
          <input
            autoFocus
            placeholder="输入密语..."
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
              setEasteregg(false);
            }}
            style={{
              width: "78%",
              padding: "13px 18px",
              borderRadius: "16px",
              border: `2.5px solid ${
                status === "error"
                  ? "#ff7675"
                  : status === "success"
                  ? "#00b894"
                  : "#fcb69f"
              }`,
              background: "rgba(255,255,255,0.92)",
              fontSize: "1.1rem",
              textAlign: "center",
              outline: "none",
              display: "block",
              margin: "0 auto",
              boxShadow:
                status === "success"
                  ? "0 0 18px rgba(0,184,148,0.3)"
                  : "0 2px 12px rgba(0,0,0,0.06)",
              transition: "border-color 0.3s, box-shadow 0.3s",
              fontFamily: "inherit",
            }}
          />
        </motion.div>

        {/* Hint letter-by-letter reveal */}
        <AnimatePresence>
          {hintLen > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{ marginTop: "0.6rem" }}
            >
              <p style={{ color: "#a29bfe", fontSize: "0.82rem", margin: 0 }}>
                💡 提示:{" "}
                <b style={{ letterSpacing: "5px", fontSize: "1rem" }}>
                  {hint.split("").map((c, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      {c.toUpperCase()}
                    </motion.span>
                  ))}
                  <span style={{ opacity: 0.25 }}>
                    {"_".repeat(PASSWORD.length - hintLen)}
                  </span>
                </b>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error feedback */}
        <AnimatePresence>
          {status === "error" && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ color: "#e17055", fontSize: "0.88rem", marginTop: "0.5rem" }}
            >
              {errorLines[Math.min(attempts - 1, errorLines.length - 1)]}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          whileHover={{
            scale: 1.06,
            boxShadow: "0 10px 28px rgba(255,107,107,0.45)",
          }}
          whileTap={{ scale: 0.94 }}
          onClick={() => sfx.playClick()}
          style={{
            marginTop: "1.3rem",
            background:
              status === "success"
                ? "linear-gradient(135deg,#00b894,#00cec9)"
                : "linear-gradient(135deg,#ff7675,#fd79a8)",
            color: "white",
            padding: "13px 38px",
            borderRadius: "40px",
            border: "none",
            fontWeight: 700,
            fontSize: "0.98rem",
            cursor: "pointer",
            boxShadow: "0 8px 22px rgba(255,118,117,0.3)",
            fontFamily: "inherit",
          }}
        >
          {status === "success" ? "✨ 已解锁！" : "解开谜语 →"}
        </motion.button>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LEVEL 2 — 相识 · Getting Close
// Interaction: Stars float and randomly glow — click 3 while they shine
// Failure: miss → star escapes to new spot + cute message
// ═══════════════════════════════════════════════════════════
const NEEDED_STARS = 3;

function Level2({ onComplete, sfx }) {
  const [stars, setStars] = useState(() =>
    Array.from({ length: 7 }, (_, i) => ({
      id: i,
      x: 8 + Math.random() * 84,
      y: 12 + Math.random() * 76,
      glowing: false,
      caught: false,
    }))
  );
  const [caught, setCaught] = useState(0);
  const [missed, setMissed] = useState(0);
  const [sparks, setSparks] = useState([]);

  // Randomly toggle glow on each star independently
  useEffect(() => {
    const timers = stars.map((_, i) =>
      setInterval(
        () =>
          setStars((prev) =>
            prev.map((s, j) =>
              j === i && !s.caught ? { ...s, glowing: !s.glowing } : s
            )
          ),
        1400 + i * 280
      )
    );
    return () => timers.forEach(clearInterval);
  }, []); // eslint-disable-line

  const handleStar = (star, e) => {
    if (star.caught) return;
    if (star.glowing) {
      // ✅ Caught!
      sfx.playClick();
      const r = e.currentTarget.getBoundingClientRect();
      setSparks((s) => [
        ...s,
        { id: Date.now(), x: r.left + r.width / 2, y: r.top + r.height / 2 },
      ]);
      setStars((p) =>
        p.map((s) => (s.id === star.id ? { ...s, caught: true, glowing: false } : s))
      );
      const next = caught + 1;
      setCaught(next);
      if (next >= NEEDED_STARS) {
        sfx.playSuccess();
        setTimeout(onComplete, 900);
      }
    } else {
      // ❌ Missed — star bounces to new position
      sfx.playError();
      setMissed((m) => m + 1);
      setStars((p) =>
        p.map((s) =>
          s.id === star.id
            ? { ...s, x: 8 + Math.random() * 84, y: 12 + Math.random() * 76 }
            : s
        )
      );
    }
  };

  const missNotes = [
    "差一点！等它发光时再点 🌟",
    "哈哈，它跑啦！再试试 😄",
    "再快一点！感受它的节奏 💫",
  ];

  return (
    <div>
      {sparks.map((s) => (
        <SparkBurst
          key={s.id}
          x={s.x}
          y={s.y}
          onDone={() => setSparks((p) => p.filter((x) => x.id !== s.id))}
        />
      ))}

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} style={styles.chapterLabel}>
        Chapter II · 相识
      </motion.p>

      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={styles.heading}>
        捕捉闪光 ✨
      </motion.h2>

      <p style={{ ...styles.subtext, marginBottom: "1rem" }}>
        等星星发光的瞬间，点击抓住它！
        <br />
        <span style={{ color: "#a29bfe", fontWeight: 600 }}>
          还需要 {Math.max(0, NEEDED_STARS - caught)} 颗 ⭐
        </span>
      </p>

      {/* Star field */}
      <div
        style={{
          position: "relative",
          height: "155px",
          background:
            "linear-gradient(135deg, rgba(162,155,254,0.12), rgba(253,203,110,0.08))",
          borderRadius: "20px",
          overflow: "hidden",
          border: "1.5px solid rgba(162,155,254,0.18)",
        }}
      >
        {stars.map((star) => (
          <motion.button
            key={star.id}
            onClick={(e) => handleStar(star, e)}
            animate={
              star.caught
                ? { scale: [1, 1.6, 0], opacity: [1, 1, 0] }
                : star.glowing
                ? { scale: [1, 1.3, 1], rotate: [0, 8, -8, 0] }
                : { scale: 1 }
            }
            transition={
              star.caught
                ? { duration: 0.45 }
                : { duration: 0.55, repeat: star.glowing ? Infinity : 0 }
            }
            onHoverStart={() => star.glowing && !star.caught && sfx.playHover()}
            style={{
              position: "absolute",
              left: `${star.x}%`,
              top: `${star.y}%`,
              transform: "translate(-50%, -50%)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: star.caught ? "default" : "pointer",
              fontSize: "26px",
              filter: star.glowing
                ? "drop-shadow(0 0 12px gold) drop-shadow(0 0 5px gold)"
                : star.caught
                ? "grayscale(1) opacity(0.3)"
                : "none",
              transition: "filter 0.3s",
              userSelect: "none",
            }}
          >
            {star.caught ? "💫" : star.glowing ? "⭐" : "✦"}
          </motion.button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "1rem" }}>
        {Array.from({ length: NEEDED_STARS }).map((_, i) => (
          <motion.div
            key={i}
            animate={i < caught ? { scale: [1, 1.5, 1] } : {}}
            transition={{ duration: 0.4 }}
            style={{
              width: 13,
              height: 13,
              borderRadius: "50%",
              background: i < caught ? "#f9ca24" : "rgba(0,0,0,0.08)",
              border: "2px solid rgba(249,202,36,0.35)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      {/* Miss feedback */}
      <AnimatePresence>
        {missed > 0 && caught < NEEDED_STARS && (
          <motion.p
            key={missed}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ color: "#fdcb6e", fontSize: "0.85rem", marginTop: "0.7rem" }}
          >
            {missNotes[Math.min(missed - 1, missNotes.length - 1)]}
          </motion.p>
        )}
      </AnimatePresence>

      {caught >= NEEDED_STARS && (
        <motion.p
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ color: "#00b894", fontWeight: 700, marginTop: "0.7rem" }}
        >
          ✨ 全抓住了！你和星星有缘分～
        </motion.p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LEVEL 3 — 心动 · That Feeling
// Interaction: Hover to reveal hidden cards, then choose the right word
// Failure: wrong card → bounces + contextual message
// ═══════════════════════════════════════════════════════════
const CARDS = [
  { id: "a", emoji: "🌸", word: "喜欢", right: false, wrongMsg: "喜欢是开始，但还不够深 🌸" },
  { id: "b", emoji: "🌙", word: "迷恋", right: false, wrongMsg: "迷恋有些短暂，我想要更久的 🌙" },
  { id: "c", emoji: "💫", word: "心动", right: false, wrongMsg: "心动只是一瞬，我们已经超越了 💫" },
  { id: "d", emoji: "❤️", word: "爱你", right: true, wrongMsg: "" },
  { id: "e", emoji: "🌊", word: "想你", right: false, wrongMsg: "想你是因为... 你有答案了吗？ 🌊" },
  { id: "f", emoji: "🦋", word: "永远", right: false, wrongMsg: "永远么... 先找到那颗最重要的 🦋" },
];

function Level3({ onComplete, sfx }) {
  const [revealed, setRevealed] = useState(new Set());
  const [chosen, setChosen] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | error | success
  const [sparks, setSparks] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleHover = (id) => {
    if (!revealed.has(id)) {
      setRevealed((prev) => new Set([...prev, id]));
      sfx.playHover();
    }
  };

  const handleChoose = (card, e) => {
    if (status !== "idle") return;
    setChosen(card.id);

    if (card.right) {
      setStatus("success");
      sfx.playSuccess();
      const r = e.currentTarget.getBoundingClientRect();
      setSparks((s) => [
        ...s,
        { id: Date.now(), x: r.left + r.width / 2, y: r.top + r.height / 2 },
      ]);
      setTimeout(onComplete, 1100);
    } else {
      setStatus("error");
      setErrorMsg(card.wrongMsg);
      sfx.playError();
      setTimeout(() => {
        setStatus("idle");
        setChosen(null);
        setErrorMsg("");
      }, 1300);
    }
  };

  return (
    <div>
      {sparks.map((s) => (
        <SparkBurst
          key={s.id}
          x={s.x}
          y={s.y}
          onDone={() => setSparks((p) => p.filter((x) => x.id !== s.id))}
        />
      ))}

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} style={styles.chapterLabel}>
        Chapter III · 心动
      </motion.p>

      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={styles.heading}>
        寻找那个词 💝
      </motion.h2>

      <p style={{ ...styles.subtext, marginBottom: "1.1rem" }}>
        悬停揭开卡片，找到最能代表我们的那一个
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "9px" }}>
        {CARDS.map((card) => {
          const isRev = revealed.has(card.id);
          const isChosen = chosen === card.id;
          const isWrong = isChosen && status === "error";
          const isRight = isChosen && status === "success";

          return (
            <motion.button
              key={card.id}
              onHoverStart={() => handleHover(card.id)}
              onClick={(e) => handleChoose(card, e)}
              whileHover={{ scale: 1.07, y: -3 }}
              whileTap={{ scale: 0.93 }}
              animate={
                isWrong
                  ? { x: [0, -9, 9, -6, 6, 0], transition: { duration: 0.38 } }
                  : isRight
                  ? {
                      scale: [1, 1.15, 1],
                      boxShadow: [
                        "0 0 0 rgba(255,107,107,0)",
                        "0 0 30px rgba(255,107,107,0.6)",
                        "0 0 20px rgba(255,107,107,0.4)",
                      ],
                    }
                  : {}
              }
              style={{
                background: isRight
                  ? "linear-gradient(135deg,#ff7675,#fd79a8)"
                  : isWrong
                  ? "rgba(255,118,117,0.12)"
                  : isRev
                  ? "rgba(255,255,255,0.92)"
                  : "linear-gradient(135deg,rgba(162,155,254,0.2),rgba(253,121,168,0.2))",
                borderRadius: "15px",
                padding: "14px 6px",
                border: isRight
                  ? "2px solid #ff7675"
                  : isWrong
                  ? "2px solid rgba(255,118,117,0.5)"
                  : "2px solid rgba(255,255,255,0.45)",
                backdropFilter: "blur(5px)",
                cursor: "pointer",
                minHeight: "70px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>{card.emoji}</span>
              <AnimatePresence>
                {isRev && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: isRight ? "white" : "#2d3436",
                    }}
                  >
                    {card.word}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {status === "error" && errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ color: "#e17055", fontSize: "0.85rem", marginTop: "0.75rem" }}
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>

      {revealed.size < 3 && (
        <motion.p
          animate={{ opacity: [0.3, 0.65, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          style={{ color: "#b2bec3", fontSize: "0.78rem", marginTop: "0.75rem" }}
        >
          💡 先悬停卡片揭开它们...
        </motion.p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LEVEL 4 — 爱你 · Falling In Love
// Interaction: Rhythm-based timing game — click heart exactly when it glows
// Failure: early/late click → encouraging message + retry
// ═══════════════════════════════════════════════════════════
function Level4({ onComplete, sfx }) {
  const [phase, setPhase] = useState("idle"); // idle | beating | success
  const [glow, setGlow] = useState(false);
  const [msg, setMsg] = useState("");
  const [attempts, setAttempts] = useState(0);
  const glowOpen = useRef(false);
  const timerRef = useRef(null);

  // ── Start / beat loop ──────────────────────────────────
  const startBeat = useCallback(() => {
    setPhase("beating");
    doBeat();
  }, []); // eslint-disable-line

  const doBeat = () => {
    timerRef.current = setTimeout(
      () => {
        setGlow(true);
        glowOpen.current = true;
        sfx.playBeat();

        setTimeout(() => {
          setGlow(false);
          glowOpen.current = false;
          doBeat(); // recurse
        }, 580);
      },
      750 + Math.random() * 650
    );
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleClick = () => {
    if (phase === "idle") {
      startBeat();
      return;
    }
    if (phase !== "beating") return;

    if (glowOpen.current) {
      // 🎉 Perfect sync
      clearTimeout(timerRef.current);
      setPhase("success");
      setMsg("💗 完美同步！我们的心跳一致~");
      sfx.playSuccess();
      setTimeout(onComplete, 1400);
    } else {
      // ❌ Off-beat
      const n = attempts + 1;
      setAttempts(n);
      sfx.playError();
      const msgs = [
        "早了一点！等心脏发光再点 ⏰",
        "晚了！感受它的节奏 🎵",
        "加油！你快同步了 💓",
        "再来一次，专注感受 🌊",
      ];
      setMsg(msgs[n % msgs.length]);
    }
  };

  return (
    <div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} style={styles.chapterLabel}>
        Chapter IV · 爱你
      </motion.p>

      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={styles.heading}>
        与心跳同频 💓
      </motion.h2>

      <p style={{ ...styles.subtext, marginBottom: "1.4rem" }}>
        {phase === "idle"
          ? "点击心脏，感受它的跳动节奏"
          : phase === "beating"
          ? "等心脏发光的瞬间，与它同步！"
          : "💗 心跳已同步，我们频率相同"}
      </p>

      {/* Heart */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.4rem" }}>
        <motion.button
          onClick={handleClick}
          animate={
            phase === "beating"
              ? {
                  scale: glow ? [1, 1.38, 1.1] : [1, 1.06, 1],
                }
              : phase === "success"
              ? { scale: [1, 1.5, 1.2] }
              : { scale: [1, 1.06, 1] }
          }
          transition={{
            duration: phase === "beating" && glow ? 0.28 : 1.1,
            repeat: phase === "success" ? 0 : Infinity,
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "88px",
            lineHeight: 1,
            filter: glow
              ? "drop-shadow(0 0 22px #ff7675) drop-shadow(0 0 44px #ff7675)"
              : phase === "success"
              ? "drop-shadow(0 0 30px #ff7675)"
              : "drop-shadow(0 0 6px rgba(255,118,117,0.25))",
            transition: "filter 0.14s ease",
            userSelect: "none",
            padding: 0,
          }}
        >
          {phase === "success" ? "💗" : "❤️"}
        </motion.button>
      </div>

      {/* Rhythm wave indicator */}
      {phase === "beating" && (
        <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginBottom: "0.9rem" }}>
          {[0.5, 1.2, 2.5, 1.2, 0.5].map((h, i) => (
            <motion.div
              key={i}
              animate={{ scaleY: [1, h, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.1 }}
              style={{
                width: 4,
                height: 18,
                background: glow ? "#ff7675" : "rgba(255,118,117,0.25)",
                borderRadius: 4,
                transformOrigin: "center",
                transition: "background 0.12s",
              }}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {msg && (
          <motion.p
            key={msg}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              color: phase === "success" ? "#00b894" : "#e17055",
              fontSize: "0.9rem",
              fontWeight: phase === "success" ? 700 : 400,
            }}
          >
            {msg}
          </motion.p>
        )}
      </AnimatePresence>

      {phase === "idle" && (
        <motion.p
          animate={{ opacity: [0.35, 0.75, 0.35] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          style={{ color: "#b2bec3", fontSize: "0.82rem", marginTop: "0.4rem" }}
        >
          ↑ 点击开始感受
        </motion.p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FINAL LEVEL — 永远 · Spectacular Finale
// Sequence: particles rise → heart forms → text reveal → ambient loop
// Easter egg: tap anywhere to burst confetti
// ═══════════════════════════════════════════════════════════
function FinalLevel() {
  const canvasRef = useRef(null);
  const [seq, setSeq] = useState(0); // 0=init 1=heart 2=text 3=ambient

  useEffect(() => {
    const t1 = setTimeout(() => setSeq(1), 700);
    const t2 = setTimeout(() => setSeq(2), 2000);
    const t3 = setTimeout(() => setSeq(3), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Canvas heart particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 220 }, (_, i) => ({
      t: (i / 220) * Math.PI * 2,
      size: Math.random() * 2.5 + 0.8,
      speed: 0.004 + Math.random() * 0.012,
      hue: 325 + Math.random() * 40,
      alpha: Math.random() * 0.5 + 0.5,
    }));

    const floaters = Array.from({ length: 25 }, () => ({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + Math.random() * 150,
      size: 10 + Math.random() * 14,
      speed: 0.45 + Math.random() * 0.9,
      drift: (Math.random() - 0.5) * 0.4,
    }));

    let startTime = Date.now();
    let raf;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 30;
      const elapsed = (Date.now() - startTime) / 1000;

      // Scale in heart over 2 seconds
      const scale = seq >= 1 ? Math.min(1, elapsed * 0.55) : 0;
      const pulse = 1 + Math.sin(elapsed * 1.8) * 0.04;

      particles.forEach((p, idx) => {
        p.t += p.speed;
        const hx = 16 * Math.pow(Math.sin(p.t), 3) * 14 * scale * pulse;
        const hy =
          -(
            13 * Math.cos(p.t) -
            5 * Math.cos(2 * p.t) -
            2 * Math.cos(3 * p.t) -
            Math.cos(4 * p.t)
          ) *
          14 *
          scale *
          pulse;
        const alpha = seq >= 1 ? Math.min(p.alpha, elapsed * 0.65) : 0;
        ctx.fillStyle = `hsla(${p.hue},82%,72%,${alpha})`;
        ctx.beginPath();
        ctx.arc(
          cx + hx + Math.sin(elapsed * 0.8 + idx) * 1.8,
          cy + hy,
          p.size,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // Ambient rising hearts (seq 3)
      if (seq >= 3) {
        floaters.forEach((h) => {
          h.y -= h.speed;
          h.x += h.drift;
          if (h.y < -40) {
            h.y = canvas.height + 20;
            h.x = Math.random() * canvas.width;
          }
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.font = `${h.size}px serif`;
          ctx.fillText("❤", h.x, h.y);
          ctx.restore();
        });
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    // Confetti bursts
    setTimeout(
      () =>
        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.62 },
          colors: ["#ff7675", "#fd79a8", "#fab1a0", "#ffeaa7"],
        }),
      600
    );
    setTimeout(() => {
      confetti({ particleCount: 70, spread: 120, angle: 60, origin: { x: 0, y: 0.68 }, colors: ["#a29bfe", "#fd79a8"] });
      confetti({ particleCount: 70, spread: 120, angle: 120, origin: { x: 1, y: 0.68 }, colors: ["#a29bfe", "#fd79a8"] });
    }, 1600);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [seq]);

  const handleTap = (e) => {
    if (seq < 3) return;
    confetti({
      particleCount: 55,
      spread: 65,
      origin: {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      },
      colors: ["#ff7675", "#fd79a8", "#ffeaa7", "#a29bfe"],
    });
  };

  return (
    <div
      onClick={handleTap}
      style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

      <div style={{ zIndex: 10, textAlign: "center", pointerEvents: "none", padding: "0 20px" }}>

        {/* Names — appears at seq 2 */}
        <AnimatePresence>
          {seq >= 2 && (
            <motion.h1
              initial={{ opacity: 0, scale: 0.45, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.85, type: "spring", damping: 14 }}
              style={{
                fontSize: "clamp(3rem, 11vw, 5.5rem)",
                margin: 0,
                fontWeight: 800,
                letterSpacing: "-2px",
                background: "linear-gradient(135deg, #fff 0%, #ffeaa7 45%, #fab1a0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 24px rgba(255,118,117,0.75))",
              }}
            >
              PF & ZY
            </motion.h1>
          )}
        </AnimatePresence>

        {/* 520 label */}
        <AnimatePresence>
          {seq >= 2 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{
                letterSpacing: "8px",
                color: "#fab1a0",
                fontSize: "clamp(0.85rem, 3vw, 1.15rem)",
                marginTop: "6px",
                fontWeight: 600,
              }}
            >
              HAPPY 520 ✨
            </motion.p>
          )}
        </AnimatePresence>

        {/* Message + ambient hint — seq 3 */}
        <AnimatePresence>
          {seq >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.p
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 3.2 }}
                style={{
                  color: "rgba(255,255,255,0.88)",
                  fontSize: "clamp(0.82rem, 2.8vw, 1rem)",
                  marginTop: "1.8rem",
                  fontStyle: "italic",
                  letterSpacing: "0.5px",
                  lineHeight: 1.85,
                  maxWidth: "300px",
                  margin: "1.8rem auto 0",
                }}
              >
                "愿你所有的快乐，
                <br />
                都有我参与其中。"
              </motion.p>

              {/* Tap easter-egg hint — fades in and out subtly */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.28, 0] }}
                transition={{ delay: 3, duration: 2.5, repeat: Infinity, repeatDelay: 6 }}
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "0.65rem",
                  marginTop: "2.2rem",
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                }}
              >
                · · · tap anywhere for magic · · ·
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════
const styles = {
  chapterLabel: {
    fontSize: "0.72rem",
    letterSpacing: "3.5px",
    color: "#b2bec3",
    marginBottom: "0.45rem",
    textTransform: "uppercase",
  },
  heading: {
    fontSize: "clamp(1.5rem, 5vw, 1.85rem)",
    color: "#2d3436",
    marginBottom: "0.35rem",
    fontWeight: 800,
    lineHeight: 1.2,
  },
  subtext: {
    color: "#636e72",
    lineHeight: 1.75,
    fontSize: "clamp(0.82rem, 2.5vw, 0.94rem)",
    marginBottom: "1.3rem",
  },
};

// ═══════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [level, setLevel] = useState(1);
  const [showChapter, setShowChapter] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [logoTaps, setLogoTaps] = useState(0);
  const sfx = useSoundEngine();

  // Wrap sfx so it only fires when soundOn
  const gated = {
    playSuccess: () => soundOn && sfx.playSuccess(),
    playError: () => soundOn && sfx.playError(),
    playClick: () => soundOn && sfx.playClick(),
    playHover: () => soundOn && sfx.playHover(),
    playBeat: () => soundOn && sfx.playBeat(),
  };

  const handleComplete = () => {
    if (level < 5) setShowChapter(true);
  };

  const handleChapterDone = () => {
    setShowChapter(false);
    setLevel((l) => l + 1);
  };

  // 🥚 Logo tap easter egg — 5 taps = confetti
  const handleLogoTap = () => {
    const n = logoTaps + 1;
    setLogoTaps(n);
    if (n >= 5) {
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.25 } });
      setLogoTaps(0);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 2s ease",
        background: BG[level],
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* ── Ambient floating particles (levels 1–4) ── */}
      {level < 5 && <AmbientParticles colors={PARTICLES[level]} />}

      {/* ── Progress dots ── */}
      {level < 5 && (
        <div
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "7px",
            zIndex: 50,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: level === i ? [1, 1.25, 1] : 1 }}
              transition={{ repeat: level === i ? Infinity : 0, duration: 1.6 }}
              style={{
                width: level === i ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: level >= i ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.28)",
                transition: "all 0.4s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Sound toggle ── */}
      <motion.button
        onClick={() => setSoundOn((s) => !s)}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.88 }}
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          background: "rgba(255,255,255,0.22)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "50%",
          width: 44,
          height: 44,
          cursor: "pointer",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.15rem",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          fontFamily: "inherit",
        }}
      >
        {soundOn ? "🔊" : "🔇"}
      </motion.button>

      {/* ── Logo easter egg (top-left, 5 taps) ── */}
      {level < 5 && (
        <motion.button
          onClick={handleLogoTap}
          whileHover={{ scale: 1.2, rotate: 10 }}
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.2rem",
            opacity: 0.45,
            zIndex: 100,
            userSelect: "none",
            fontFamily: "inherit",
            padding: 4,
          }}
        >
          💕
        </motion.button>
      )}

      {/* ── Chapter transition overlay ── */}
      <AnimatePresence>
        {showChapter && STORY[level + 1] && (
          <ChapterCard
            chapter={STORY[level + 1].chapter}
            title={STORY[level + 1].title}
            subtitle={STORY[level + 1].subtitle}
            onDone={handleChapterDone}
          />
        )}
      </AnimatePresence>

      {/* ── Level cards ── */}
      <AnimatePresence mode="wait">
        {!showChapter && (
          <motion.div
            key={level}
            initial={{ opacity: 0, scale: 0.84, y: 42 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.04, y: -42 }}
            transition={{ type: "spring", damping: 22, stiffness: 210 }}
            style={{
              background:
                level === 5 ? "transparent" : "rgba(255,255,255,0.76)",
              backdropFilter: level === 5 ? "none" : "blur(22px)",
              padding: level === 5 ? 0 : "clamp(1.6rem, 5vw, 2.5rem) clamp(1.4rem, 5vw, 2.2rem)",
              borderRadius: level === 5 ? 0 : "36px",
              boxShadow:
                level === 5
                  ? "none"
                  : "0 28px 72px rgba(0,0,0,0.13), 0 1px 0 rgba(255,255,255,0.8) inset",
              border: level === 5 ? "none" : "1.5px solid rgba(255,255,255,0.52)",
              textAlign: "center",
              maxWidth: level === 5 ? "100vw" : "min(420px, 92vw)",
              width: level === 5 ? "100vw" : "92vw",
              maxHeight: level === 5 ? "100dvh" : "88dvh",
              overflowY: level === 5 ? "visible" : "auto",
              zIndex: 10,
              position: "relative",
            }}
          >
            {level === 1 && <Level1 onComplete={handleComplete} sfx={gated} />}
            {level === 2 && <Level2 onComplete={handleComplete} sfx={gated} />}
            {level === 3 && <Level3 onComplete={handleComplete} sfx={gated} />}
            {level === 4 && <Level4 onComplete={handleComplete} sfx={gated} />}
            {level === 5 && <FinalLevel />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
