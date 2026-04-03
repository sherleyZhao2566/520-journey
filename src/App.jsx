import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Sparkles,
  ArrowRight,
  Gift,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function App() {
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const next = () => setLevel((l) => l + 1);

  // 音乐播放控制
  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 动态背景样式
  const bgStyles = {
    1: "linear-gradient(135deg, #fdf6f0 0%, #ffeaa7 100%)",
    2: "linear-gradient(135deg, #fdf6f0 0%, #fab1a0 100%)",
    3: "linear-gradient(135deg, #fdf6f0 0%, #81ecec 100%)",
    4: "linear-gradient(135deg, #fdf6f0 0%, #a29bfe 100%)",
    5: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 1.5s ease",
        background: bgStyles[level],
        margin: 0,
        padding: 0,
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
      }}
    >
      {/* 隐藏的音频标签 - 换成你喜欢的直链音乐地址 */}
      <audio
        ref={audioRef}
        loop
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      />

      {/* 右上角音乐按钮 */}
      <button
        onClick={toggleMusic}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "white",
          border: "none",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isPlaying ? <Volume2 color="#ff7675" /> : <VolumeX color="#ccc" />}
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={level}
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -30 }}
          transition={{ type: "spring", damping: 20 }}
          style={{
            background:
              level === 5 ? "transparent" : "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(10px)",
            padding: "3rem",
            borderRadius: "40px",
            boxShadow: level === 5 ? "none" : "0 30px 60px rgba(0,0,0,0.12)",
            textAlign: "center",
            maxWidth: "400px",
            width: "85%",
            zIndex: 10,
          }}
        >
          {level === 1 && <Level1 onComplete={next} />}
          {level === 2 && <Level2 onComplete={next} />}
          {level === 3 && <Level3 onComplete={next} />}
          {level === 4 && <Level4 onComplete={next} />}
          {level === 5 && <FinalLevel />}
        </motion.div>
      </AnimatePresence>

      {/* 装饰性浮动气泡 */}
      {level < 5 &&
        [1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3 + i, repeat: Infinity }}
            style={{
              position: "absolute",
              width: 100 * i,
              height: 100 * i,
              borderRadius: "50%",
              background: "white",
              left: `${10 * i}%`,
              bottom: "10%",
              filter: "blur(40px)",
              zIndex: 1,
            }}
          />
        ))}
    </div>
  );
}

// --- 以下组件内容保持基本一致，但细节优化 ---

function Level1({ onComplete }) {
  const [val, setVal] = useState("");
  return (
    <>
      <h2 style={{ fontSize: "2rem", color: "#2d3436", marginBottom: "1rem" }}>
        👋 嘿，准备好了吗？
      </h2>
      <p style={{ color: "#636e72", lineHeight: 1.6 }}>
        这是一场专属你的旅程。
        <br />
        请输入暗号 <b>Adventure</b> 开启
      </p>
      <input
        placeholder="..."
        style={{
          marginTop: "2rem",
          padding: "15px",
          borderRadius: "15px",
          border: "2px solid #fab1a0",
          width: "80%",
          textAlign: "center",
          outline: "none",
          fontSize: "1.2rem",
        }}
        onChange={(e) =>
          e.target.value.toLowerCase() === "LOVEU2" && onComplete()
        }
      />
    </>
  );
}

function Level2({ onComplete }) {
  return (
    <>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "2rem" }}>⭐ 捕获好运</h2>
      <div
        style={{
          position: "relative",
          height: "120px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "50px",
        }}
      >
        <div style={{ color: "#ff7675", opacity: 0.5 }}>
          <Gift size={60} />
        </div>
        <motion.div
          drag
          dragConstraints={{ left: -150, right: 0, top: 0, bottom: 0 }}
          onDragEnd={(_, info) => info.offset.x < -80 && onComplete()}
          style={{ cursor: "grab", color: "#fbc531", zIndex: 20 }}
          whileItem={{ scale: 1.2 }}
        >
          <Star size={64} fill="currentColor" />
        </motion.div>
      </div>
      <p style={{ color: "#b2bec3", fontSize: "0.9rem", marginTop: "1rem" }}>
        把星星拖进左边的盒子
      </p>
    </>
  );
}

function Level3({ onComplete }) {
  return (
    <>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "2rem" }}>🍰 甜度测试</h2>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}
      >
        {["50% 甜", "75% 甜", "100% 甜", "溢出来了"].map((t) => (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={t}
            onClick={onComplete}
            style={{
              padding: "20px 10px",
              border: "none",
              borderRadius: "20px",
              background: "#ffeaa7",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#636e72",
            }}
          >
            {t}
          </motion.button>
        ))}
      </div>
    </>
  );
}

function Level4({ onComplete }) {
  return (
    <>
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        <Heart size={80} color="#ff7675" fill="#ff7675" />
      </motion.div>
      <h2 style={{ fontSize: "1.8rem", margin: "2rem 0" }}>最后一步</h2>
      <p
        style={{ color: "#636e72", marginBottom: "2rem", fontStyle: "italic" }}
      >
        “愿你所得皆所愿，所遇皆良善。”
      </p>
      <button
        onClick={onComplete}
        style={{
          background: "#6c5ce7",
          color: "white",
          padding: "15px 40px",
          borderRadius: "40px",
          border: "none",
          fontWeight: "bold",
          fontSize: "1.1rem",
          cursor: "pointer",
          boxShadow: "0 10px 20px rgba(108, 92, 231, 0.3)",
        }}
      >
        查看惊喜 ✨
      </button>
    </>
  );
}

function FinalLevel() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let frame;

    const particles = Array.from({ length: 150 }, () => ({
      t: Math.random() * Math.PI * 2,
      size: Math.random() * 3 + 1,
      speed: 0.01 + Math.random() * 0.02,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      particles.forEach((p) => {
        p.t += p.speed;
        const x = 16 * Math.pow(Math.sin(p.t), 3) * 15;
        const y =
          -(
            13 * Math.cos(p.t) -
            5 * Math.cos(2 * p.t) -
            2 * Math.cos(3 * p.t) -
            Math.cos(4 * p.t)
          ) * 15;
        ctx.fillStyle = `hsla(${340 + Math.sin(p.t) * 20}, 80%, 70%, 0.8)`;
        ctx.beginPath();
        ctx.arc(
          cx + x + Math.sin(Date.now() * 0.001) * 5,
          cy + y,
          p.size,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
      frame = requestAnimationFrame(draw);
    };

    draw();
    confetti({ particleCount: 200, spread: 80, origin: { y: 0.7 } });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        style={{
          zIndex: 10,
          color: "white",
          textShadow: "0 0 20px rgba(255,118,117,0.5)",
        }}
      >
        <h1
          style={{
            fontSize: "5rem",
            margin: 0,
            fontWeight: "800",
            letterSpacing: "-2px",
          }}
        >
          PF & ZY
        </h1>
        <p
          style={{
            letterSpacing: "8px",
            color: "#fab1a0",
            fontSize: "1.2rem",
            marginTop: "10px",
          }}
        >
          HAPPY 520!
        </p>
      </motion.div>
    </div>
  );
}
