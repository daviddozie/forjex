"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Flame,
  User,
  GitBranch,
  Terminal,
  LayoutDashboard,
  Radio,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { GithubIcon, VercelIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";

interface OrbitNode {
  id: string;
  label: string;
  icon: React.ElementType;
  offsetX: number;
  offsetY: number;
  role: string;
  detail: string;
  status: string;
  duration: number;
  delay: number;
}

const FORJEX_NODES: OrbitNode[] = [
  {
    id: "developer",
    label: "Developer",
    icon: User,
    offsetX: -290,
    offsetY: -120,
    role: "Identity Layer",
    detail: "Multi-tenant auth, workspace & PAT credentials",
    status: "Authenticated",
    duration: 5.4,
    delay: 0,
  },
  {
    id: "dual-cli",
    label: "Dual-Mode CLI",
    icon: Terminal,
    offsetX: -600,
    offsetY: -25,
    role: "Terminal Engine",
    detail: "Local terminal scaffolding with 'forjex forge'",
    status: "Ready",
    duration: 5.8,
    delay: 1.1,
  },
  {
    id: "github-repo",
    label: "GitHub Repo",
    icon: GithubIcon,
    offsetX: -390,
    offsetY: 150,
    role: "Repository Layer",
    detail: "Automated remote repo provisioning & branch tracking",
    status: "Git Synced",
    duration: 5.0,
    delay: 2.2,
  },

  // ── TOP CENTER (Frameworks & Stacks) ──────────────────────────
  {
    id: "fullstack-stacks",
    label: "Fullstack Stacks",
    icon: Layers,
    offsetX: -70,
    offsetY: -210,
    role: "Framework Presets",
    detail: "Production templates: Next.js 15, FastAPI, Go Fiber",
    status: "Verified",
    duration: 4.8,
    delay: 0.8,
  },

  {
    id: "vercel-deploy",
    label: "Vercel Deploy",
    icon: VercelIcon,
    offsetX: 290,
    offsetY: -120,
    role: "Hosting Layer",
    detail: "Zero-config edge deployment, SSL & preview URLs",
    status: "Edge Active",
    duration: 5.6,
    delay: 0.5,
  },
  {
    id: "cloud-dashboard",
    label: "Cloud Dashboard",
    icon: LayoutDashboard,
    offsetX: 400,
    offsetY: -30,
    role: "Control Plane",
    detail: "Real-time web monitoring & repository management",
    status: "Live Console",
    duration: 6.0,
    delay: 1.6,
  },
  {
    id: "cicd-pipeline",
    label: "CI/CD Pipeline",
    icon: GitBranch,
    offsetX: 380,
    offsetY: 150,
    role: "Automation Layer",
    detail: "Automated GitHub Actions lint, test & build checks",
    status: "Passing",
    duration: 4.6,
    delay: 1.9,
  },
];

const CONCENTRIC_RINGS = [150, 300, 480, 700, 960, 1260, 1600, 2000];

export function PipelineAnimation() {
  const [hoveredNode, setHoveredNode] = React.useState<OrbitNode | null>(null);
  const [pulseCount, setPulseCount] = React.useState(0);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setPulseCount((c) => (c + 1) % 100);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <div className="w-full relative overflow-hidden">
      <div className="relative w-full border-y border-neutral-200 dark:border-white/[0.08] bg-neutral-50/80 dark:bg-black shadow-lg dark:shadow-2xl overflow-hidden backdrop-blur-2xl transition-colors duration-300">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-white/25 to-transparent z-40" />

        {/* Section Header Bar */}
        <div className="relative z-30 border-b border-neutral-200 dark:border-white/[0.06] bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight mt-1">
                From Concept to Production in Seconds
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[10px] font-mono border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 bg-neutral-100/80 dark:bg-transparent hidden sm:inline-flex">
                Forjex Cloud Mesh
              </Badge>
            </div>
          </div>
        </div>

        {/* Radar Concentric Orbital Stage with Balanced Spacing */}
        <div className="relative w-full h-[540px] sm:h-[620px] flex items-center justify-center overflow-hidden bg-neutral-100/60 dark:bg-black select-none transition-colors duration-300">
          <div className="absolute inset-y-0 left-0 w-10 sm:w-16 md:w-20 bg-gradient-to-r from-neutral-100 dark:from-black via-neutral-100/60 dark:via-black/60 to-transparent z-30 pointer-events-none backdrop-blur-[1.5px]" />
          <div className="absolute inset-y-0 right-0 w-10 sm:w-16 md:w-20 bg-gradient-to-l from-neutral-100 dark:from-black via-neutral-100/60 dark:via-black/60 to-transparent z-30 pointer-events-none backdrop-blur-[1.5px]" />

          <div className="absolute w-[500px] h-[500px] rounded-full bg-neutral-400/[0.06] dark:bg-white/[0.018] blur-3xl pointer-events-none" />

          <div
            className="absolute w-[900px] h-[900px] rounded-full pointer-events-none opacity-40 animate-[spin_18s_linear_infinite]"
            style={{
              background: isDark
                ? "conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.05) 0deg, rgba(255,255,255,0.01) 25deg, transparent 50deg, transparent 360deg)"
                : "conic-gradient(from 0deg at 50% 50%, rgba(0,0,0,0.04) 0deg, rgba(0,0,0,0.01) 25deg, transparent 50deg, transparent 360deg)",
            }}
          />

          {/* Radiating Sonar Wave Pulses */}
          <motion.div
            key={`pulse-1-${pulseCount}`}
            initial={{ scale: 0.25, opacity: 0.55 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ duration: 4.8, ease: "easeOut" }}
            className="absolute w-72 h-72 rounded-full border border-neutral-300 dark:border-white/[0.08] pointer-events-none"
          />
          <motion.div
            key={`pulse-2-${pulseCount}`}
            initial={{ scale: 0.25, opacity: 0.4 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 5.8, delay: 1.6, ease: "easeOut" }}
            className="absolute w-72 h-72 rounded-full border border-neutral-300/60 dark:border-white/[0.05] pointer-events-none"
          />

          {/* Scalable Container for rings and badges */}
          <div className="relative w-full h-full flex items-center justify-center scale-[0.68] xs:scale-[0.78] sm:scale-[0.90] md:scale-100 transition-transform">
            {/* Concentric Orbital Rings */}
            {CONCENTRIC_RINGS.map((size) => (
              <div
                key={size}
                className="absolute rounded-full border border-neutral-300/70 dark:border-white/[0.06] pointer-events-none transition-colors duration-500"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                }}
              />
            ))}

            {/* SVG Connecting Ray Lines & Flowing Data Packets */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: "visible" }}
            >
              {FORJEX_NODES.map((node) => {
                const isHovered = hoveredNode?.id === node.id;
                return (
                  <g key={`beam-${node.id}`}>
                    {/* Connecting Dotted Beam */}
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`calc(50% + ${node.offsetX}px)`}
                      y2={`calc(50% + ${node.offsetY}px)`}
                      stroke={
                        isHovered
                          ? isDark
                            ? "rgba(255, 255, 255, 0.45)"
                            : "rgba(0, 0, 0, 0.45)"
                          : isDark
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(0, 0, 0, 0.12)"
                      }
                      strokeWidth={isHovered ? "1.5" : "1"}
                      strokeDasharray={isHovered ? "none" : "3 6"}
                      className="transition-all duration-300"
                    />

                    {/* Flowing Animated Energy Particle */}
                    <circle
                      r={isHovered ? 2.5 : 1.5}
                      fill={isDark ? "#ffffff" : "#18181b"}
                      opacity={isHovered ? 0.9 : 0.45}
                    >
                      <animateMotion
                        path={`M 0,0 L ${node.offsetX},${node.offsetY}`}
                        dur={`${3.2 + (node.delay % 2)}s`}
                        repeatCount="indefinite"
                        keyTimes="0;1"
                        keyPoints="0;1"
                      />
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* Central Forjex Core Hub */}
            <div className="absolute z-10 flex items-center justify-center">
              {/* Outer Ring Accent with Subtle Glow */}
              <div className="w-16 h-16 rounded-full border border-neutral-300 dark:border-white/15 bg-white dark:bg-neutral-950/90 backdrop-blur-xl flex items-center justify-center shadow-lg dark:shadow-[0_0_30px_rgba(255,255,255,0.08)] group cursor-pointer transition-all duration-300 hover:border-neutral-400 dark:hover:border-white/40">
                {/* Inner Icon Circle with Forjex Flame */}
                <div className="w-10 h-10 rounded-full border border-neutral-200 dark:border-white/20 bg-neutral-900 dark:bg-zinc-900 flex items-center justify-center text-white transition-transform group-hover:scale-110 shadow-inner">
                  <Flame className="w-5 h-5 text-white fill-current" />
                </div>
              </div>
            </div>

            {/* Symmetrically Distributed Forjex Ecosystem Badges */}
            {FORJEX_NODES.map((node) => {
              const Icon = node.icon;
              const isHovered = hoveredNode?.id === node.id;

              return (
                <motion.div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${node.offsetX}px)`,
                    top: `calc(50% + ${node.offsetY}px)`,
                    transform: "translate(-50%, -50%)",
                  }}
                  animate={{
                    y: [-3.5, 3.5, -3.5],
                    x: [-1.8, 1.8, -1.8],
                  }}
                  transition={{
                    duration: node.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: node.delay,
                  }}
                  className="z-20"
                >
                  <div
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`group relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none backdrop-blur-md shadow-md ${
                      isHovered
                        ? isDark
                          ? "bg-zinc-800/95 border-white/50 text-white shadow-[0_0_24px_rgba(255,255,255,0.18)] scale-105"
                          : "bg-neutral-900 border-neutral-900 text-white shadow-xl scale-105"
                        : isDark
                        ? "bg-zinc-950/90 border-zinc-800/90 text-neutral-300 hover:border-zinc-500 hover:text-white hover:bg-zinc-900/90"
                        : "bg-white/95 border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:text-neutral-950 hover:bg-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 text-neutral-500 dark:text-neutral-400 group-hover:text-inherit transition-colors" />
                    <span className="text-xs font-medium tracking-tight whitespace-nowrap">
                      {node.label}
                    </span>

                    {/* Small Status Indicator Dot */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        isHovered
                          ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                          : "bg-neutral-400 dark:bg-neutral-600"
                      }`}
                    />

                    {/* Interactive Telemetry Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
                        >
                          <div className="bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-700/90 text-neutral-900 dark:text-white px-3.5 py-2.5 rounded-xl shadow-2xl min-w-[200px] text-center backdrop-blur-xl">
                            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{node.status}</span>
                            </div>
                            <div className="text-xs font-medium text-neutral-700 dark:text-neutral-200 mt-1 leading-snug">
                              {node.detail}
                            </div>
                            <div className="text-[9px] font-mono text-neutral-500 mt-1.5 border-t border-neutral-100 dark:border-zinc-800/80 pt-1">
                              {node.role}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer Info Strip */}
        <div className="relative z-30 border-t border-neutral-200 dark:border-white/[0.06] bg-white/70 dark:bg-neutral-950/60 backdrop-blur-md transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-neutral-500" />
              <span>Fullstack Automation &amp; Instant Deployment</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span>Dual-Mode CLI + Cloud</span>
              </span>
              <span>•</span>
              <span>Zero-Config Orchestration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PipelineAnimation;
