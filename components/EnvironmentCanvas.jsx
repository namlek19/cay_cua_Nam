"use client";

import React, { useEffect, useRef } from "react";

export default function EnvironmentCanvas({ totalCount = 0, isWatering = false }) {
  const canvasRef = useRef(null);
  const showPetals = totalCount >= 271;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // 1. Golden Dust Particles floating around the tree
    const dustCount = 42;
    const dusts = Array.from({ length: dustCount }, () => ({
      x: width * 0.18 + Math.random() * (width * 0.64),
      y: height * 0.25 + Math.random() * (height * 0.68),
      radius: 1.3 + Math.random() * 2.6,
      vx: (Math.random() - 0.5) * 0.38,
      vy: -0.25 - Math.random() * 0.45,
      alpha: 0.2 + Math.random() * 0.75,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.02 + Math.random() * 0.03,
    }));

    // 2. Crimson-Red Phoenix Flower Petals (when totalCount >= 271)
    const petalCount = 30;
    const petals = Array.from({ length: petalCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 6 + Math.random() * 7,
      vx: -0.65 - Math.random() * 0.85,
      vy: 0.75 + Math.random() * 1.1,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.035,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.018 + Math.random() * 0.022,
      hueShift: Math.random() > 0.35 ? "#ef4444" : "#f97316",
    }));

    // 3. Water splash sparkles when watering
    const splashes = Array.from({ length: 24 }, () => ({
      x: width * 0.5 + (Math.random() - 0.5) * 90,
      y: height * 0.78 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 2.6,
      vy: -1.5 - Math.random() * 2.5,
      radius: 2 + Math.random() * 2.5,
      life: Math.random(),
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Golden Dusts
      for (let i = 0; i < dusts.length; i++) {
        const d = dusts[i];
        d.phase += d.phaseSpeed;
        d.x += d.vx + Math.sin(d.phase) * 0.22;
        d.y += d.vy;

        if (d.y < height * 0.15) {
          d.y = height * 0.92;
          d.x = width * 0.22 + Math.random() * (width * 0.56);
        }
        if (d.x < width * 0.1) d.x = width * 0.88;
        if (d.x > width * 0.9) d.x = width * 0.12;

        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(d.phase));

        ctx.save();
        ctx.beginPath();
        const grad = ctx.createRadialGradient(
          d.x,
          d.y,
          0,
          d.x,
          d.y,
          d.radius * 3.2
        );
        grad.addColorStop(0, `rgba(255, 248, 190, ${twinkle})`);
        grad.addColorStop(0.45, `rgba(255, 215, 0, ${twinkle * 0.65})`);
        grad.addColorStop(1, "rgba(255, 180, 0, 0)");
        ctx.fillStyle = grad;
        ctx.arc(d.x, d.y, d.radius * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Falling Red Phoenix Petals (Stage 6+, totalCount >= 271)
      if (showPetals) {
        for (let i = 0; i < petals.length; i++) {
          const p = petals[i];
          p.swayPhase += p.swaySpeed;
          p.angle += p.spin;
          p.x += p.vx + Math.sin(p.swayPhase) * 0.55;
          p.y += p.vy + Math.cos(p.swayPhase) * 0.18;

          if (p.y > height + 20 || p.x < -30) {
            if (Math.random() > 0.35) {
              p.x = Math.random() * (width * 1.15);
              p.y = -15 - Math.random() * 40;
            } else {
              p.x = width + 15;
              p.y = Math.random() * (height * 0.65);
            }
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.beginPath();
          // Draw delicate petal shape
          ctx.moveTo(0, -p.size);
          ctx.bezierCurveTo(
            p.size * 0.85,
            -p.size * 0.5,
            p.size * 0.75,
            p.size * 0.7,
            0,
            p.size
          );
          ctx.bezierCurveTo(
            -p.size * 0.75,
            p.size * 0.7,
            -p.size * 0.85,
            -p.size * 0.5,
            0,
            -p.size
          );
          ctx.fillStyle = p.hueShift;
          ctx.shadowColor = "rgba(239, 68, 68, 0.55)";
          ctx.shadowBlur = 6;
          ctx.fill();

          // Subtle inner petal highlight
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(254, 240, 138, 0.6)";
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw Water Mist & Droplet Sparkles around the tree roots when watering
      if (isWatering) {
        for (let i = 0; i < splashes.length; i++) {
          const s = splashes[i];
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.12;
          s.life -= 0.025;

          if (s.life <= 0) {
            s.x = width * 0.5 + (Math.random() - 0.5) * 110;
            s.y = height * 0.82 + (Math.random() - 0.5) * 35;
            s.vx = (Math.random() - 0.5) * 2.8;
            s.vy = -1.8 - Math.random() * 2.8;
            s.life = 0.8 + Math.random() * 0.2;
          }

          ctx.save();
          ctx.beginPath();
          ctx.fillStyle = `rgba(125, 211, 252, ${Math.max(0, s.life)})`;
          ctx.shadowColor = "rgba(56, 189, 248, 0.85)";
          ctx.shadowBlur = 8;
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [showPetals, isWatering]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-20 h-full w-full"
    />
  );
}

