"use client";

import { motion } from "framer-motion";
import { AppView, MeditationSettings } from "./MeditationApp";
import { Wind, Brain, Settings, Clock, Zap } from "lucide-react";

type Props = {
  settings: MeditationSettings;
  setView: (v: AppView) => void;
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 + 0.2, duration: 0.5, ease: "easeOut" },
  }),
};

export default function HomeView({ settings, setView }: Props) {
  const bp = settings.breathingPattern;
  const totalCycleTime = bp.inhale + bp.holdIn + bp.exhale + bp.holdOut;
  const cyclesInSession =
    settings.pranayamDuration > 0
      ? Math.floor((settings.pranayamDuration * 60) / totalCycleTime)
      : 0;

  return (
    <div className="relative min-h-screen px-4 pb-12 pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
          <span className="text-xs font-medium tracking-widest text-indigo-300 uppercase">
            Inner Peace
          </span>
        </div>
        <h1 className="bg-gradient-to-br from-white via-indigo-100 to-purple-300 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
          ZenBreath
        </h1>
        <p className="mt-3 text-sm text-white/40">
          Meditation & Pranayama — your daily sanctuary
        </p>
      </motion.div>

      <div className="mx-auto max-w-lg space-y-4">
        {/* Meditation Card */}
        <motion.button
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={() => setView("meditation")}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group relative w-full overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 to-purple-950/60 p-6 text-left backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/40 hover:shadow-2xl hover:shadow-indigo-900/40"
        >
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-indigo-600/10 blur-2xl transition-all duration-500 group-hover:bg-indigo-500/20" />
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-500/30">
              <Brain className="h-6 w-6 text-indigo-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Meditation</h2>
              <p className="mt-0.5 text-sm text-white/50">
                Mindful awareness &amp; deep focus
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
                  <Clock className="h-3 w-3 text-indigo-400" />
                  <span className="text-xs text-white/60">
                    {settings.meditationDuration} min
                  </span>
                </div>
                {settings.sound.type !== "none" && (
                  <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
                    <Zap className="h-3 w-3 text-purple-400" />
                    <span className="text-xs text-white/60">
                      {settings.sound.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 transition-all group-hover:bg-indigo-500/40">
              <svg className="h-4 w-4 text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </motion.button>

        {/* Pranayam Card */}
        <motion.button
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={() => setView("pranayam")}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group relative w-full overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-950/80 to-cyan-950/60 p-6 text-left backdrop-blur-xl transition-all duration-300 hover:border-teal-400/40 hover:shadow-2xl hover:shadow-teal-900/40"
        >
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-teal-600/10 blur-2xl transition-all duration-500 group-hover:bg-teal-500/20" />
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500/20 ring-1 ring-teal-500/30">
              <Wind className="h-6 w-6 text-teal-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Pranayama</h2>
              <p className="mt-0.5 text-sm text-white/50">
                Breathwork &amp; vital energy
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
                  <Clock className="h-3 w-3 text-teal-400" />
                  <span className="text-xs text-white/60">
                    {settings.pranayamDuration} min
                  </span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                  <span className="text-xs text-teal-400">
                    {bp.inhale}-{bp.holdIn}-{bp.exhale}-{bp.holdOut}
                  </span>
                  <span className="text-xs text-white/40">pattern</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                  <span className="text-xs text-white/60">
                    ~{cyclesInSession} cycles
                  </span>
                </div>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 transition-all group-hover:bg-teal-500/40">
              <svg className="h-4 w-4 text-teal-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </motion.button>

        {/* Breathing Pattern Summary */}
        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-xl"
        >
          <p className="mb-4 text-xs font-medium tracking-wider text-white/30 uppercase">
            Current Breathing Pattern
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Inhale", value: bp.inhale, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
              { label: "Hold", value: bp.holdIn, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
              { label: "Exhale", value: bp.exhale, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
              { label: "Hold", value: bp.holdOut, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
            ].map((item) => (
              <div
                key={item.label + item.color}
                className={`flex flex-col items-center rounded-xl border p-3 ${item.bg}`}
              >
                <span className={`text-2xl font-bold ${item.color}`}>{item.value}s</span>
                <span className="mt-1 text-[10px] text-white/40">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Settings Button */}
        <motion.button
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={() => setView("settings")}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-xl transition-all hover:bg-white/[0.06] hover:border-white/20"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Settings className="h-4 w-4 text-white/60" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white/80">Customize Session</p>
              <p className="text-xs text-white/30">Timings, sounds &amp; patterns</p>
            </div>
          </div>
          <svg className="h-4 w-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>

      {/* Bottom quote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="mt-12 text-center text-xs italic text-white/20"
      >
        &ldquo;Breath is the bridge between mind and body.&rdquo;
      </motion.p>
    </div>
  );
}
