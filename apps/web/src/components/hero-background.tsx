"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  isGlint?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 650);

    // Dark mode tracking via MutationObserver
    let isDark = document.documentElement.classList.contains("dark");
    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // 1. Create static & twinkling stars
    const starCount = Math.min(Math.floor((width * height) / 8000), 120);
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      const isGlint = Math.random() < 0.15; // 15% are sparkling glint stars
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.9,
        size: isGlint ? Math.random() * 1.5 + 1.2 : Math.random() * 1.2 + 0.5,
        baseAlpha: Math.random() * 0.5 + 0.3,
        alpha: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
        isGlint,
      });
    }

    // 2. Create interactive floating particles
    const particleCount = Math.min(Math.floor((width * height) / 22000), 38);
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const baseAlpha = Math.random() * 0.4 + 0.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.85,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.8 + 1,
        baseAlpha,
        alpha: baseAlpha,
      });
    }

    // 3. Shooting stars / Beams
    const shootingStars: ShootingStar[] = [];
    const maxShootingStars = 3;

    const spawnShootingStar = (): ShootingStar => ({
      x: Math.random() * (width * 0.8),
      y: Math.random() * (height * 0.4),
      length: Math.random() * 80 + 50,
      speed: Math.random() * 6 + 4,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, // ~45 deg downward
      opacity: Math.random() * 0.6 + 0.3,
      active: true,
    });

    for (let i = 0; i < maxShootingStars; i++) {
      const s = spawnShootingStar();
      s.active = false;
      shootingStars.push(s);
    }

    let nextShootTimer = 60; // frames until next shooting star

    // Mouse tracking for interactive effect
    const mouse = { x: -1000, y: -1000, radius: 160 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Render loop
    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Subtle Grid Dots in background
      const gridSize = 32;
      ctx.fillStyle = isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.04)";
      for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
          const edgeFade = 1 - y / height;
          if (edgeFade > 0.1) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // Draw Twinkling Stars
      for (const star of stars) {
        const twinkle = Math.sin(tick * star.twinkleSpeed + star.twinkleOffset);
        const currentAlpha = Math.max(0.1, Math.min(1, star.baseAlpha + twinkle * 0.3));

        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${currentAlpha})`
          : `rgba(15, 23, 42, ${currentAlpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // 4-point cross sparkle for glint stars
        if (star.isGlint && currentAlpha > 0.5) {
          ctx.strokeStyle = isDark
            ? `rgba(255, 255, 255, ${currentAlpha * 0.4})`
            : `rgba(15, 23, 42, ${currentAlpha * 0.25})`;
          ctx.lineWidth = 0.8;
          const glintLen = star.size * 3;

          ctx.beginPath();
          ctx.moveTo(star.x - glintLen, star.y);
          ctx.lineTo(star.x + glintLen, star.y);
          ctx.moveTo(star.x, star.y - glintLen);
          ctx.lineTo(star.x + glintLen, star.y);
          ctx.stroke();
        }
      }

      // Shooting stars
      nextShootTimer--;
      if (nextShootTimer <= 0) {
        const inactive = shootingStars.find((s) => !s.active);
        if (inactive) {
          Object.assign(inactive, spawnShootingStar());
        }
        nextShootTimer = Math.floor(Math.random() * 180 + 120);
      }

      for (const s of shootingStars) {
        if (!s.active) continue;

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.008;

        if (s.opacity <= 0 || s.x > width || s.y > height) {
          s.active = false;
          continue;
        }

        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        if (isDark) {
          grad.addColorStop(0, "rgba(255, 255, 255, 0)");
          grad.addColorStop(1, `rgba(255, 255, 255, ${s.opacity})`);
        } else {
          grad.addColorStop(0, "rgba(15, 23, 42, 0)");
          grad.addColorStop(1, `rgba(15, 23, 42, ${s.opacity * 0.35})`);
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Star head
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${s.opacity})`
          : `rgba(15, 23, 42, ${s.opacity * 0.5})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connect nearby particles with subtle lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 130;

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * (isDark ? 0.12 : 0.06);
            ctx.strokeStyle = isDark
              ? `rgba(255, 255, 255, ${lineAlpha})`
              : `rgba(15, 23, 42, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw floating particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse interaction
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

        let currentAlpha = p.baseAlpha;
        if (mDist < mouse.radius) {
          currentAlpha = Math.min(1, p.baseAlpha + (1 - mDist / mouse.radius) * 0.6);
          p.x += (mdx / mDist) * 0.6;
          p.y += (mdy / mDist) * 0.6;
        }

        // Particle core
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${currentAlpha})`
          : `rgba(15, 23, 42, ${currentAlpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow around larger particles
        if (p.radius > 1.6) {
          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${currentAlpha * 0.25})`
            : `rgba(15, 23, 42, ${currentAlpha * 0.1})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Soft mouse spotlight
      if (mouse.x > 0 && mouse.y > 0) {
        const mouseGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius
        );
        if (isDark) {
          mouseGlow.addColorStop(0, "rgba(255, 255, 255, 0.05)");
        } else {
          mouseGlow.addColorStop(0, "rgba(0, 0, 0, 0.03)");
        }
        mouseGlow.addColorStop(1, "transparent");
        ctx.fillStyle = mouseGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-white dark:bg-black transition-colors duration-300">
      {/* 60fps Canvas with theme-aware twinkling stars, shooting stars, and floating particles */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Gentle bottom gradient fade into page background */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none transition-colors duration-300" />
    </div>
  );
}
