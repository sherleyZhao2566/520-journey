/**
 * 520 Love Journey — Optimized v2
 * ==================================
 * WHAT'S NEW:
 * ─────────────────────────────────────────────────────────────────
 * [FIX]  Level 3: Two-tap 3D card flip for full mobile compatibility.
 *        Tap 1 = flip reveal (rotateY 0→180). Tap 2 on same card = confirm.
 * [NEW]  Background Music: HTML5 <audio> integrated in App root.
 *        Starts on first user interaction (bypasses browser autoplay policy).
 *        Replace the src placeholder with your music URL.
 * [NEW]  AmbientParticles: Emoji-based (🌸✨💫) with parallax depth layers.
 *        Larger emojis float closer & faster, smaller ones drift slowly.
 * [EGG]  Level 1: Rainbow border pulse when "520" is typed in real-time.
 * [EGG]  Level 2: Pitch rises on each star catch (C5 → E5 → G5 musical scale).
 * [UX]   ChapterCard: Cinematic letterbox bars + blur-in title reveal.
 * [CODE] useMemo for stable particle configs, cleaner canvas teardown.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// ══════════════════════════════════════════════════════════════
// 🎵 SOUND ENGINE — Web Audio API (zero external deps)
// ══════════════════════════════════════════════════════════════
function useSoundEngine() {
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
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
    // [NEW] Rising pitch per star catch: index 0→C5, 1→E5, 2→G5
    playStarCatch: (n) => {
      const notes = [523, 659, 784];
      tone(notes[Math.min(n, notes.length - 1)], "sine", 0.18, 0.22);
    },
    // [NEW] Soft "card primed" chime for Level 3
    playPrimed: () => {
      tone(660, "sine", 0.06, 0.09);
      setTimeout(() => tone(880, "sine", 0.05, 0.07), 60);
    },
  };
}

// ══════════════════════════════════════════════════════════════
// ✨ SPARK BURST — radial dot explosion on success
// ══════════════════════════════════════════════════════════════
function SparkBurst({ x, y, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{ position: "fixed", left: x, top: y, pointerEvents: "none", zIndex: 9999 }}
    >
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * 360;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * 56,
              y: Math.sin((angle * Math.PI) / 180) * 56,
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

// ══════════════════════════════════════════════════════════════
// 🌸 AMBIENT PARTICLES — emoji-based with depth parallax
// [UPGRADED] Large emojis = close layer (fast, vivid)
//            Small emojis = far layer (slow, blurred, subtle)
// ══════════════════════════════════════════════════════════════

// Per-level emoji palette
const EMOJI_SETS = {
  1: ["🌸", "✨", "🌷", "💫", "🌟", "🌺"],
  2: ["⭐", "💫", "✨", "🌙", "🌠", "💎"],
  3: ["💕", "🦋", "🌸", "✨", "🍬", "🌈"],
  4: ["❤️", "💗", "💖", "💕", "🌹", "💓"],
};

function AmbientParticles({ level }) {
  // Stable config per level — useMemo prevents re-randomising on every render
  const particles = useMemo(
    () => {
      const set = EMOJI_SETS[level] || EMOJI_SETS[1];
      return Array.from({ length: 16 }, (_, i) => {
        const size = 10 + Math.random() * 18; // 10–28 px
        const depth = (size - 10) / 18; // 0 (far/small) → 1 (close/large)
        return {
          id: i,
          emoji: set[i % set.length],
          startX: Math.random() * 96, // vw %
          size,
          depth,
          duration: 14 - depth * 7, // far=14s, close=7s
          delay: Math.random() * 10,
          rotate: Math.random() * 36 - 18, // −18° → +18°
          drift: (Math.random() - 0.5) * 9, // lateral vw drift
        };
      });
    },
    [level]
  );

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
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.startX}vw`,
            y: "108vh",
            opacity: 0,
            rotate: 0,
            scale: 0,
          }}
          animate={{
            y: "-10vh",
            x: `${p.startX + p.drift}vw`,
            opacity: [0, p.depth * 0.7 + 0.12, p.depth * 0.7 + 0.12, 0],
            rotate: p.rotate,
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            fontSize: `${p.size}px`,
            filter: `blur(${(1 - p.depth) * 0.9}px)`,
            userSelect: "none",
            lineHeight: 1,
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 🎬 CHAPTER CARD — cinematic letterbox transition
// [UPGRADED] Letterbox bars + blur-fade title + expanding separator
// ══════════════════════════════════════════════════════════════
function ChapterCard({ chapter, title, subtitle, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 5, 18, 0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* ── Cinematic letterbox bars (top & bottom) ── */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.38, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "clamp(40px, 10vh, 80px)",
          background: "rgba(0,0,0,0.85)",
          transformOrigin: "top",
        }}
      />
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.38, ease: "easeOut" }}
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "clamp(40px, 10vh, 80px)",
          background: "rgba(0,0,0,0.85)",
          transformOrigin: "bottom",
        }}
      />

      {/* ── Chapter label ── */}
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.4, y: 0 }}
        transition={{ delay: 0.22, duration: 0.5 }}
        style={{
          color: "#fab1a0",
          letterSpacing: "6px",
          fontSize: "0.72rem",
          textTransform: "uppercase",
          marginBottom: "0.9rem",
        }}
      >
        {chapter}
      </motion.span>

      {/* ── Main title with blur-in effect ── */}
      <motion.h1
        initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.36, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          color: "white",
          fontSize: "clamp(2.6rem, 9vw, 4rem)",
          margin: 0,
          fontWeight: 800,
          letterSpacing: "-1px",
          textShadow: "0 0 50px rgba(250,177,160,0.45)",
        }}
      >
        {title}
      </motion.h1>

      {/* ── Subtitle ── */}
      <motion.p
        initial={{ opacity: 0, letterSpacing: "1px" }}
        animate={{ opacity: 0.5, letterSpacing: "4px" }}
        transition={{ delay: 0.62, duration: 0.55 }}
        style={{ color: "#dfe6e9", marginTop: "0.5rem", fontSize: "0.85rem" }}
      >
        {subtitle}
      </motion.p>

      {/* ── Decorative expanding separator ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "1.8rem",
        }}
      >
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.78, duration: 0.5 }}
          style={{
            width: "44px",
            height: "1px",
            background: "linear-gradient(90deg, transparent, #ff7675)",
            transformOrigin: "right",
          }}
        />
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.9, scale: 1 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 300 }}
          style={{ color: "#fd79a8", fontSize: "0.7rem" }}
        >
          ❤
        </motion.span>
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.78, duration: 0.5 }}
          style={{
            width: "44px",
            height: "1px",
            background: "linear-gradient(90deg, #ff7675, transparent)",
            transformOrigin: "left",
          }}
        />
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// 📖 STORY / THEME CONSTANTS
// ══════════════════════════════════════════════════════════════
const STORY = {
  2: { chapter: "Chapter II",  title: "相识", subtitle: "Getting Close"    },
  3: { chapter: "Chapter III", title: "心动", subtitle: "That Feeling"     },
  4: { chapter: "Chapter IV",  title: "爱你", subtitle: "Falling In Love"  },
  5: { chapter: "Finale",      title: "永远", subtitle: "Forever & Always" },
};

const BG = {
  1: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  2: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  3: "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  4: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  5: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
};

// ══════════════════════════════════════════════════════════════
// LEVEL 1 — 初遇 · Password Unlock
// Easter egg A: type "520" → rainbow input glow + popup
// Easter egg B: hints reveal letter-by-letter after 2+ fails
// ══════════════════════════════════════════════════════════════
const PASSWORD = "loveu";

// Rainbow border @keyframes injected via <style> tag when "520" is typed
const RAINBOW_CSS = `
  @keyframes rainbow-glow {
    0%   { box-shadow: 0 0 14px #ff7675, 0 0 4px #ff7675; border-color: #ff7675; }
    16%  { box-shadow: 0 0 14px #fdcb6e, 0 0 4px #fdcb6e; border-color: #fdcb6e; }
    33%  { box-shadow: 0 0 14px #6c5ce7, 0 0 4px #6c5ce7; border-color: #6c5ce7; }
    50%  { box-shadow: 0 0 14px #00b894, 0 0 4px #00b894; border-color: #00b894; }
    66%  { box-shadow: 0 0 14px #74b9ff, 0 0 4px #74b9ff; border-color: #74b9ff; }
    83%  { box-shadow: 0 0 14px #fd79a8, 0 0 4px #fd79a8; border-color: #fd79a8; }
    100% { box-shadow: 0 0 14px #ff7675, 0 0 4px #ff7675; border-color: #ff7675; }
  }
  .rainbow-input { animation: rainbow-glow 1.6s linear infinite !important; }
`;

function Level1({ onComplete, sfx, onFirstInteraction }) {
  const [val, setVal]             = useState("");
  const [status, setStatus]       = useState("idle"); // idle | error | success
  const [attempts, setAttempts]   = useState(0);
  const [hintLen, setHintLen]     = useState(0);
  const [easteregg, setEasteregg] = useState(false);
  const [sparks, setSparks]       = useState([]);
  // Shake animation is handled via Framer Motion animate prop on the wrapper div

  // Detect "520" easter egg in real-time for rainbow glow
  const isRainbow = val.toLowerCase().includes("520");
  const hint = PASSWORD.slice(0, hintLen);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      onFirstInteraction?.(); // unlock music on first real interaction
      const input = val.trim().toLowerCase();

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
        // Shake handled by Framer Motion animate on the wrapper div below
        if (next >= 2) setHintLen((h) => Math.min(h + 1, PASSWORD.length));
        setTimeout(() => setStatus("idle"), 900);
      }
    },
    [val, attempts, onComplete, onFirstInteraction, sfx]
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
      {/* Inject rainbow CSS only when needed */}
      {isRainbow && <style>{RAINBOW_CSS}</style>}

      {sparks.map((s) => (
        <SparkBurst
          key={s.id}
          x={s.x}
          y={s.y}
          onDone={() => setSparks((p) => p.filter((x) => x.id !== s.id))}
        />
      ))}

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} style={S.chapterLabel}>
        Chapter I · 初遇
      </motion.p>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={S.heading}>
        嘿，是你吗？ 👋
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={S.subtext}>
        每个故事都有一个开始。
        <br />
        输入那个只有你知道的密语 ✨
      </motion.p>

      {/* Easter egg banner */}
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
              可爱的猪宝宝 520快乐 💕 继续输入真正的密语哦~
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} style={{ marginTop: "0.5rem" }}>
        {/* Shake wrapper */}
        <motion.div
          animate={status === "error" ? { x: [0, -10, 10, -7, 7, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/*
            [EASTER EGG] Rainbow border glow fires when user types "520".
            The .rainbow-input CSS class is injected above only when active.
          */}
          <input
            autoFocus
            placeholder="输入密语..."
            value={val}
            className={isRainbow ? "rainbow-input" : ""}
            onChange={(e) => {
              setVal(e.target.value);
              setEasteregg(false);
            }}
            style={{
              width: "78%",
              padding: "13px 18px",
              borderRadius: "16px",
              border: `2.5px solid ${
                status === "error" ? "#ff7675" : status === "success" ? "#00b894" : "#fcb69f"
              }`,
              background: "rgba(255,255,255,0.92)",
              fontSize: "1.1rem",
              textAlign: "center",
              outline: "none",
              display: "block",
              margin: "0 auto",
              boxShadow: status === "success" ? "0 0 18px rgba(0,184,148,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
              transition: "border-color 0.3s, box-shadow 0.3s",
              fontFamily: "inherit",
            }}
          />
        </motion.div>

        {/* Progressive hint reveal */}
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
                  <span style={{ opacity: 0.22 }}>{"_".repeat(PASSWORD.length - hintLen)}</span>
                </b>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error line */}
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
          whileHover={{ scale: 1.06, boxShadow: "0 10px 28px rgba(255,107,107,0.45)" }}
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

// ══════════════════════════════════════════════════════════════
// LEVEL 2 — 相识 · Star Catching (timing-based)
// [NEW] Each catch plays a rising musical note (C5 → E5 → G5)
// ══════════════════════════════════════════════════════════════
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
  const [missed, setMissed]   = useState(0);
  const [sparks, setSparks]   = useState([]);

  // Each star toggles its own glow on an independent interval
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStar = (star, e) => {
    if (star.caught) return;
    if (star.glowing) {
      // ✅ Caught! — [NEW] rising pitch based on how many already caught
      sfx.playStarCatch(caught);
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
      // ❌ Miss — star bounces to new position
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

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} style={S.chapterLabel}>
        Chapter II · 相识
      </motion.p>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={S.heading}>
        捕捉闪光 ✨
      </motion.h2>
      <p style={{ ...S.subtext, marginBottom: "1rem" }}>
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
          background: "linear-gradient(135deg, rgba(162,155,254,0.12), rgba(253,203,110,0.08))",
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
              touchAction: "manipulation",
            }}
          >
            {star.caught ? "💫" : star.glowing ? "⭐" : "✦"}
          </motion.button>
        ))}
      </div>

      {/* Progress dots */}
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

// ══════════════════════════════════════════════════════════════
// LEVEL 3 — 心动 · Card Discovery (TWO-TAP 3D FLIP)
//
// [MOBILE FIX] Replaces hover-based reveal with a two-tap interaction:
//   Tap 1 on any card  → 3D rotateY flip reveals the word (primes the card)
//   Tap 2 on primed card → confirms the selection
//   Tap a different card → re-primes that card instead (no deselect penalty)
//
// FlipCard renders two faces with backface-visibility hidden:
//   Face A (front): emoji + "TAP" hint      — visible at rotateY 0°
//   Face B (back) : emoji + word + confirm  — visible at rotateY 180°
// ══════════════════════════════════════════════════════════════
const CARDS = [
  { id: "a", emoji: "🌸", word: "喜欢", right: false, wrongMsg: "喜欢是开始，但还不够深 🌸" },
  { id: "b", emoji: "🌙", word: "迷恋", right: false, wrongMsg: "迷恋有些短暂，我想要更久的 🌙" },
  { id: "c", emoji: "💫", word: "心动", right: false, wrongMsg: "心动只是一瞬，我们已经超越了 💫" },
  { id: "d", emoji: "❤️", word: "爱你", right: true,  wrongMsg: "" },
  { id: "e", emoji: "🌊", word: "想你", right: false, wrongMsg: "想你是因为... 你有答案了吗？ 🌊" },
  { id: "f", emoji: "🦋", word: "永远", right: false, wrongMsg: "永远么... 先找到那颗最重要的 🦋" },
];

/** Single 3D flip card. Uses CSS preserve-3d so it works on all touch devices. */
function FlipCard({ card, isFlipped, isPending, isChosen, status, onTap }) {
  const isWrong = isChosen && status === "error";
  const isRight = isChosen && status === "success";

  return (
    /*
     * Perspective must live on a *parent* element (not the rotating element itself)
     * for the 3D effect to render correctly in all browsers, including iOS Safari.
     */
    <div
      onClick={onTap}
      style={{
        perspective: "700px",
        cursor: "pointer",
        userSelect: "none",
        touchAction: "manipulation", // prevents 300ms delay on mobile
        height: "84px",
      }}
    >
      <motion.div
        animate={{
          rotateY: isFlipped ? 180 : 0,
          scale:   isPending && !isChosen ? 1.04 : 1,
          x:       isWrong ? [0, -9, 9, -6, 6, 0] : 0,
        }}
        transition={{
          rotateY: { duration: 0.52, ease: [0.645, 0.045, 0.355, 1.0] }, // easeInOutCubic
          scale:   { duration: 0.2 },
          x:       { duration: 0.36 },
        }}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
      >
        {/* ── FACE A: emoji + "TAP" hint (shown before flip) ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            background:
              "linear-gradient(135deg, rgba(162,155,254,0.18), rgba(253,121,168,0.18))",
            borderRadius: "15px",
            border: "2px solid rgba(255,255,255,0.4)",
          }}
        >
          <span style={{ fontSize: "1.6rem" }}>{card.emoji}</span>
          <span
            style={{
              fontSize: "0.56rem",
              color: "rgba(178,190,195,0.8)",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Tap
          </span>
        </div>

        {/* ── FACE B: word + confirm cue (shown after flip) ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            /* Pre-rotate so it faces viewer when the card is at 180° */
            transform: "rotateY(180deg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
            background: isRight
              ? "linear-gradient(135deg, #ff7675, #fd79a8)"
              : "rgba(255,255,255,0.92)",
            borderRadius: "15px",
            border: isPending && !isChosen
              ? "2px solid #ff7675"
              : isRight
              ? "2px solid transparent"
              : isWrong
              ? "2px solid rgba(255,118,117,0.5)"
              : "2px solid rgba(255,255,255,0.5)",
            boxShadow:
              isPending && !isChosen
                ? "0 0 18px rgba(255,118,117,0.38), inset 0 0 0 1px rgba(255,118,117,0.18)"
                : isRight
                ? "0 0 28px rgba(255,118,117,0.55)"
                : "none",
            transition: "box-shadow 0.2s, border-color 0.2s, background 0.2s",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>{card.emoji}</span>
          <span
            style={{
              fontSize: "0.88rem",
              fontWeight: 700,
              color: isRight ? "white" : "#2d3436",
            }}
          >
            {card.word}
          </span>

          {/* Pulsing "TAP AGAIN" cue when this card is primed */}
          {isPending && !isChosen && (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.1 }}
              style={{ fontSize: "0.56rem", color: "#ff7675", letterSpacing: "0.8px", textTransform: "uppercase" }}
            >
              Tap again ✓
            </motion.span>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Level3({ onComplete, sfx }) {
  const [flipped, setFlipped]       = useState(new Set()); // card IDs that have been flipped
  const [pendingCard, setPending]   = useState(null);       // card primed for confirm
  const [chosen, setChosen]         = useState(null);
  const [status, setStatus]         = useState("idle");     // idle | error | success
  const [sparks, setSparks]         = useState([]);
  const [errorMsg, setErrorMsg]     = useState("");

  const handleTap = useCallback((card, e) => {
    if (status !== "idle") return;

    if (!flipped.has(card.id)) {
      // ── FIRST TAP: flip card + prime it ──────────────────────
      setFlipped((prev) => new Set([...prev, card.id]));
      setPending(card.id);
      sfx.playPrimed();
    } else if (pendingCard === card.id) {
      // ── SECOND TAP on the same card: CONFIRM selection ───────
      setChosen(card.id);

      if (card.right) {
        setStatus("success");
        sfx.playSuccess();
        const r = e.currentTarget.closest("[data-card]")?.getBoundingClientRect()
          ?? e.currentTarget.getBoundingClientRect();
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
          setPending(null);
        }, 1400);
      }
    } else {
      // ── TAP on a different already-flipped card: re-prime it ─
      setPending(card.id);
      sfx.playPrimed();
    }
  }, [flipped, pendingCard, status, onComplete, sfx]);

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

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} style={S.chapterLabel}>
        Chapter III · 心动
      </motion.p>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={S.heading}>
        寻找那个词 💝
      </motion.h2>
      <p style={{ ...S.subtext, marginBottom: "1.1rem" }}>
        翻开卡片 → 再次点击确认
        <br />
        <span style={{ color: "#a29bfe", fontSize: "0.8rem" }}>
          找到最能代表我们的那一个
        </span>
      </p>

      {/* Card grid — each cell wraps a FlipCard */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "9px" }}>
        {CARDS.map((card) => (
          <div key={card.id} data-card>
            <FlipCard
              card={card}
              isFlipped={flipped.has(card.id)}
              isPending={pendingCard === card.id}
              isChosen={chosen === card.id}
              status={status}
              onTap={(e) => handleTap(card, e)}
            />
          </div>
        ))}
      </div>

      {/* Feedback messages */}
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

      {/* Contextual hints */}
      {!pendingCard && flipped.size === 0 && (
        <motion.p
          animate={{ opacity: [0.3, 0.65, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          style={{ color: "#b2bec3", fontSize: "0.78rem", marginTop: "0.75rem" }}
        >
          💡 点击卡片翻开...
        </motion.p>
      )}
      {pendingCard && status === "idle" && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: "#ff7675", fontSize: "0.82rem", marginTop: "0.75rem" }}
        >
          ✨ 再次点击发光的卡片确认选择
        </motion.p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LEVEL 4 — 爱你 · Heartbeat Rhythm Game
// Click the heart exactly when it glows bright (580ms window)
// ══════════════════════════════════════════════════════════════
function Level4({ onComplete, sfx }) {
  const [phase, setPhase]     = useState("idle"); // idle | beating | success
  const [glow, setGlow]       = useState(false);
  const [msg, setMsg]         = useState("");
  const [attempts, setAttempts] = useState(0);
  const glowOpen              = useRef(false);
  const timerRef              = useRef(null);

  const doBeat = useCallback(() => {
    timerRef.current = setTimeout(
      () => {
        setGlow(true);
        glowOpen.current = true;
        sfx.playBeat();
        setTimeout(() => {
          setGlow(false);
          glowOpen.current = false;
          doBeat();
        }, 580);
      },
      750 + Math.random() * 650
    );
  }, [sfx]); // eslint-disable-line react-hooks/exhaustive-deps

  const startBeat = useCallback(() => {
    setPhase("beating");
    doBeat();
  }, [doBeat]);

  // Clean up timers when unmounting
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleClick = () => {
    if (phase === "idle") { startBeat(); return; }
    if (phase !== "beating") return;

    if (glowOpen.current) {
      clearTimeout(timerRef.current);
      setPhase("success");
      setMsg("💗 完美同步！我们的心跳一致~");
      sfx.playSuccess();
      setTimeout(onComplete, 1400);
    } else {
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
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} style={S.chapterLabel}>
        Chapter IV · 爱你
      </motion.p>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={S.heading}>
        与心跳同频 💓
      </motion.h2>
      <p style={{ ...S.subtext, marginBottom: "1.4rem" }}>
        {phase === "idle"
          ? "点击心脏，感受它的跳动节奏"
          : phase === "beating"
          ? "等心脏发光的瞬间，与它同步！"
          : "💗 心跳已同步，我们频率相同"}
      </p>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.4rem" }}>
        <motion.button
          onClick={handleClick}
          animate={
            phase === "beating"
              ? { scale: glow ? [1, 1.38, 1.1] : [1, 1.06, 1] }
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
            touchAction: "manipulation",
          }}
        >
          {phase === "success" ? "💗" : "❤️"}
        </motion.button>
      </div>

      {/* Rhythm wave */}
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

// ══════════════════════════════════════════════════════════════
// FINAL LEVEL — 永远 · Spectacular Finale
// Sequence: [0] init → [1] heart forms → [2] text reveals → [3] ambient loop
// Easter egg: tap anywhere to burst confetti at cursor position
// ══════════════════════════════════════════════════════════════
function FinalLevel() {
  const canvasRef = useRef(null);
  const [seq, setSeq] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setSeq(1), 700);
    const t2 = setTimeout(() => setSeq(2), 2000);
    const t3 = setTimeout(() => setSeq(3), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 220 }, (_, i) => ({
      t:     (i / 220) * Math.PI * 2,
      size:  Math.random() * 2.5 + 0.8,
      speed: 0.004 + Math.random() * 0.012,
      hue:   325 + Math.random() * 40,
      alpha: Math.random() * 0.5 + 0.5,
    }));

    const floaters = Array.from({ length: 28 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     window.innerHeight + Math.random() * 150,
      size:  10 + Math.random() * 14,
      speed: 0.45 + Math.random() * 0.9,
      drift: (Math.random() - 0.5) * 0.4,
    }));

    const startTime = Date.now();
    let raf;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx      = canvas.width / 2;
      const cy      = canvas.height / 2 + 30;
      const elapsed = (Date.now() - startTime) / 1000;
      const scale   = seq >= 1 ? Math.min(1, elapsed * 0.55) : 0;
      const pulse   = 1 + Math.sin(elapsed * 1.8) * 0.04;

      // Heart particle cloud
      particles.forEach((p, idx) => {
        p.t += p.speed;
        const hx =  16 * Math.pow(Math.sin(p.t), 3) * 14 * scale * pulse;
        const hy = -(
          13 * Math.cos(p.t) -
           5 * Math.cos(2 * p.t) -
           2 * Math.cos(3 * p.t) -
               Math.cos(4 * p.t)
        ) * 14 * scale * pulse;
        const alpha = seq >= 1 ? Math.min(p.alpha, elapsed * 0.65) : 0;

        ctx.fillStyle = `hsla(${p.hue},82%,72%,${alpha})`;
        ctx.beginPath();
        ctx.arc(
          cx + hx + Math.sin(elapsed * 0.8 + idx) * 1.8,
          cy + hy,
          p.size, 0, Math.PI * 2
        );
        ctx.fill();
      });

      // Ambient floating hearts (seq ≥ 3)
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

    // Confetti bursts — staggered for drama
    const c1 = setTimeout(
      () => confetti({
        particleCount: 140, spread: 80, origin: { y: 0.62 },
        colors: ["#ff7675", "#fd79a8", "#fab1a0", "#ffeaa7"],
      }),
      600
    );
    const c2 = setTimeout(() => {
      confetti({ particleCount: 70, spread: 120, angle:  60, origin: { x: 0, y: 0.68 }, colors: ["#a29bfe", "#fd79a8"] });
      confetti({ particleCount: 70, spread: 120, angle: 120, origin: { x: 1, y: 0.68 }, colors: ["#a29bfe", "#fd79a8"] });
    }, 1600);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(c1);
      clearTimeout(c2);
      window.removeEventListener("resize", resize);
    };
  }, [seq]);

  const handleTap = (e) => {
    if (seq < 3) return;
    confetti({
      particleCount: 55,
      spread: 65,
      origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
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

// ══════════════════════════════════════════════════════════════
// SHARED STYLE CONSTANTS
// ══════════════════════════════════════════════════════════════
const S = {
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
  // Glassmorphism card — shared across levels 1–4
  glassCard: (level) => ({
    background:      level === 5 ? "transparent" : "rgba(255,255,255,0.76)",
    backdropFilter:  level === 5 ? "none"        : "blur(24px)",
    WebkitBackdropFilter: level === 5 ? "none"   : "blur(24px)",
    padding:         level === 5 ? 0 : "clamp(1.6rem, 5vw, 2.5rem) clamp(1.4rem, 5vw, 2.2rem)",
    borderRadius:    level === 5 ? 0 : "36px",
    boxShadow:       level === 5 ? "none" : "0 28px 72px rgba(0,0,0,0.13), 0 1px 0 rgba(255,255,255,0.8) inset",
    border:          level === 5 ? "none" : "1.5px solid rgba(255,255,255,0.52)",
    textAlign:       "center",
    maxWidth:        level === 5 ? "100vw" : "min(420px, 92vw)",
    width:           level === 5 ? "100vw" : "92vw",
    maxHeight:       level === 5 ? "100dvh" : "88dvh",
    overflowY:       level === 5 ? "visible" : "auto",
    zIndex:          10,
    position:        "relative",
  }),
};

// ══════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [level, setLevel]           = useState(1);
  const [showChapter, setShowChapter] = useState(false);
  const [soundOn, setSoundOn]       = useState(false);
  const [logoTaps, setLogoTaps]     = useState(0);

  const sfx      = useSoundEngine();
  const audioRef = useRef(null); // HTML5 background music player

  // ── Sound-gated SFX wrapper ────────────────────────────────
  // All sfx calls pass through here; music is also controlled here.
  const gated = {
    playSuccess:   () => soundOn && sfx.playSuccess(),
    playError:     () => soundOn && sfx.playError(),
    playClick:     () => soundOn && sfx.playClick(),
    playHover:     () => soundOn && sfx.playHover(),
    playBeat:      () => soundOn && sfx.playBeat(),
    playStarCatch: (n) => soundOn && sfx.playStarCatch(n),
    playPrimed:    () => soundOn && sfx.playPrimed(),
  };

  // ── Background music: starts on the click that turns sound ON ──
  // Browsers allow audio.play() only inside a direct user gesture.
  // Clicking the toggle IS that gesture, so we can call play() right here.
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (audioRef.current) {
      if (next) {
        audioRef.current.play().catch(() => {
          // Autoplay blocked — user will need to interact again.
          // This rarely happens since the button click IS the interaction.
        });
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleComplete = () => {
    if (level < 5) setShowChapter(true);
  };

  const handleChapterDone = () => {
    setShowChapter(false);
    setLevel((l) => l + 1);
  };

  // 🥚 Logo easter egg — tap 5× for confetti shower
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
        height: "100dvh", // dvh accounts for iOS Safari / Android Chrome toolbars
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
      {/*
        ════════════════════════════════════════════════════════
        🎵 BACKGROUND MUSIC
        ────────────────────────────────────────────────────────
        Replace the empty src below with a direct link to your
        preferred music file. Supported formats: mp3, ogg, wav.

        Recommended: a soft, romantic instrumental track.

        Examples:
          src="https://your-cdn.com/love-theme.mp3"
          src="/music/520-theme.mp3"   ← place file in /public/music/

        The track starts playing automatically when the user
        turns on sound via the 🔊 button (top-right corner).
        It loops infinitely and pauses when muted.
        ════════════════════════════════════════════════════════
      */}
      <audio
        ref={audioRef}
        loop
        preload="none"
        src="" /* ← REPLACE WITH YOUR MUSIC URL */
      />

      {/* ── Ambient emoji particles (levels 1–4 only) ── */}
      {level < 5 && <AmbientParticles level={level} />}

      {/* ── Progress dots (levels 1–4) ── */}
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

      {/* ── Sound / Music toggle (top-right) ── */}
      <motion.button
        onClick={toggleSound}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.88 }}
        title={soundOn ? "关闭音效和音乐" : "开启音效和音乐"}
        style={{
          position: "absolute",
          top: 18, right: 18,
          background: "rgba(255,255,255,0.22)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "50%",
          width: 44, height: 44,
          cursor: "pointer",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.15rem",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          fontFamily: "inherit",
          touchAction: "manipulation",
        }}
      >
        {soundOn ? "🔊" : "🔇"}
      </motion.button>

      {/* ── Logo easter egg: tap 5× (top-left) ── */}
      {level < 5 && (
        <motion.button
          onClick={handleLogoTap}
          whileHover={{ scale: 1.2, rotate: 10 }}
          style={{
            position: "absolute",
            top: 18, left: 18,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.2rem",
            opacity: 0.45,
            zIndex: 100,
            userSelect: "none",
            fontFamily: "inherit",
            padding: 4,
            touchAction: "manipulation",
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
            style={S.glassCard(level)}
          >
            {level === 1 && (
              <Level1
                onComplete={handleComplete}
                sfx={gated}
                onFirstInteraction={() => {
                  // If user already enabled sound before reaching this point
                  if (soundOn && audioRef.current?.paused) {
                    audioRef.current.play().catch(() => {});
                  }
                }}
              />
            )}
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
