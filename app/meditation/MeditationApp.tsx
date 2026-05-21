"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SessionView from "./SessionView";
import SettingsView from "./SettingsView";
import HomeView from "./HomeView";

export type BreathingPattern = {
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
};

export type SoundSource = {
  type: "none" | "builtin" | "file" | "youtube";
  label: string;
  url?: string;
  youtubeId?: string;
  fileUrl?: string;
};

export type MeditationSettings = {
  meditationDuration: number; // minutes
  pranayamDuration: number; // minutes
  breathingPattern: BreathingPattern;
  pranayamCycles: number;
  sound: SoundSource;
  ambientSound: string;
};

const defaultSettings: MeditationSettings = {
  meditationDuration: 10,
  pranayamDuration: 5,
  breathingPattern: { inhale: 4, holdIn: 4, exhale: 6, holdOut: 2 },
  pranayamCycles: 0,
  ambientSound: "none",
  sound: { type: "none", label: "No Sound" },
};

export type AppView = "home" | "settings" | "meditation" | "pranayam";

export default function MeditationApp() {
  const [settings, setSettings] = useState<MeditationSettings>(defaultSettings);
  const [view, setView] = useState<AppView>("home");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a1a]">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-900/20 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-teal-900/15 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(168,85,247,0.08) 0%, transparent 40%)`,
          }}
        />
        {/* Star field */}
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <HomeView settings={settings} setView={setView} />
          </motion.div>
        )}
        {view === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
          >
            <SettingsView
              settings={settings}
              setSettings={setSettings}
              onBack={() => setView("home")}
            />
          </motion.div>
        )}
        {(view === "meditation" || view === "pranayam") && (
          <motion.div
            key="session"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5 }}
          >
            <SessionView
              settings={settings}
              mode={view}
              onBack={() => setView("home")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
