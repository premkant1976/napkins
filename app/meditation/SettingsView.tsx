"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { MeditationSettings, SoundSource } from "./MeditationApp";
import { ArrowLeft, Music, Youtube, Upload, VolumeX, Clock, Wind, Check } from "lucide-react";

type Props = {
  settings: MeditationSettings;
  setSettings: (s: MeditationSettings) => void;
  onBack: () => void;
};

const PRESETS = [
  { name: "Box Breathing", pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 }, desc: "Calm & focus" },
  { name: "4-7-8 Relax", pattern: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 }, desc: "Deep relaxation" },
  { name: "Nadi Shodhana", pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 }, desc: "Alternate nostril" },
  { name: "Bhramari", pattern: { inhale: 6, holdIn: 2, exhale: 8, holdOut: 0 }, desc: "Humming bee breath" },
  { name: "Kapalbhati", pattern: { inhale: 1, holdIn: 0, exhale: 1, holdOut: 0 }, desc: "Rapid breathing" },
  { name: "Custom", pattern: null, desc: "Set your own" },
];

const BUILTIN_SOUNDS = [
  { id: "rain", label: "Gentle Rain" },
  { id: "ocean", label: "Ocean Waves" },
  { id: "forest", label: "Forest Birds" },
  { id: "tibetan", label: "Tibetan Bowls" },
  { id: "om", label: "Om Chanting" },
  { id: "silence", label: "Silence" },
];

const YOUTUBE_PRESETS = [
  {
    id: "Veziy5HKVQ8",
    label: "Deep Meditation",
    desc: "Relaxing music",
    featured: true,
  },
  {
    id: "1ZYbU82GVz4",
    label: "Tibetan Healing",
    desc: "Singing bowls",
    featured: false,
  },
  {
    id: "77ZozI0rw7w",
    label: "Nature & Rain",
    desc: "Ambient sounds",
    featured: false,
  },
];

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  color,
  unit = "s",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  color: string;
  unit?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">{label}</span>
        <span className={`text-sm font-bold ${color}`}>
          {value}{unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-white/10">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all`}
          style={{
            width: `${((value - min) / (max - min)) * 100}%`,
            background: `var(--slider-color)`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-white shadow-lg transition-all"
          style={{
            left: `calc(${((value - min) / (max - min)) * 100}% - 8px)`,
            background: `var(--slider-color)`,
          }}
        />
      </div>
    </div>
  );
}

export default function SettingsView({ settings, setSettings, onBack }: Props) {
  const [local, setLocal] = useState(settings);
  const [activeTab, setActiveTab] = useState<"session" | "breath" | "sound">("session");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<MeditationSettings>) =>
    setLocal((prev) => ({ ...prev, ...partial }));

  const updateBreath = (partial: Partial<typeof local.breathingPattern>) =>
    setLocal((prev) => ({
      ...prev,
      breathingPattern: { ...prev.breathingPattern, ...partial },
    }));

  const handlePreset = (preset: (typeof PRESETS)[0]) => {
    setSelectedPreset(preset.name);
    if (preset.pattern) {
      updateBreath(preset.pattern);
    }
  };

  const extractYoutubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
    );
    return match ? match[1] : null;
  };

  const handleYoutube = () => {
    const id = extractYoutubeId(youtubeInput);
    if (id) {
      update({
        sound: { type: "youtube", label: "YouTube Music", youtubeId: id },
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      update({
        sound: { type: "file", label: file.name, fileUrl: url },
      });
    }
  };

  const handleSave = () => {
    setSettings(local);
    onBack();
  };

  const bp = local.breathingPattern;
  const totalCycle = bp.inhale + bp.holdIn + bp.exhale + bp.holdOut;

  return (
    <div className="min-h-screen px-4 pb-24 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5 text-white/70" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">Customize Session</h1>
          <p className="text-xs text-white/40">Tailor your practice</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 grid grid-cols-3 gap-1 rounded-2xl bg-white/5 p-1">
        {(["session", "breath", "sound"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl py-2.5 text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {tab === "session" ? (
              <span className="flex items-center justify-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Time
              </span>
            ) : tab === "breath" ? (
              <span className="flex items-center justify-center gap-1.5">
                <Wind className="h-3.5 w-3.5" /> Breath
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Music className="h-3.5 w-3.5" /> Sound
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-lg">
        {/* SESSION TAB */}
        {activeTab === "session" && (
          <motion.div
            key="session"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="mb-4 text-sm font-medium text-white/60">Meditation Duration</h3>
              <div
                style={{ "--slider-color": "#818cf8" } as React.CSSProperties}
              >
                <Slider
                  label="Session length"
                  value={local.meditationDuration}
                  min={1}
                  max={60}
                  unit=" min"
                  color="text-indigo-400"
                  onChange={(v) => update({ meditationDuration: v })}
                />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[5, 10, 15, 20, 30, 45, 60].slice(0, 4).map((m) => (
                  <button
                    key={m}
                    onClick={() => update({ meditationDuration: m })}
                    className={`rounded-xl py-2 text-sm font-medium transition-all ${
                      local.meditationDuration === m
                        ? "bg-indigo-600 text-white"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[30, 45, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => update({ meditationDuration: m })}
                    className={`rounded-xl py-2 text-sm font-medium transition-all ${
                      local.meditationDuration === m
                        ? "bg-indigo-600 text-white"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="mb-4 text-sm font-medium text-white/60">Pranayama Duration</h3>
              <div
                style={{ "--slider-color": "#2dd4bf" } as React.CSSProperties}
              >
                <Slider
                  label="Session length"
                  value={local.pranayamDuration}
                  min={1}
                  max={30}
                  unit=" min"
                  color="text-teal-400"
                  onChange={(v) => update({ pranayamDuration: v })}
                />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[3, 5, 10, 15, 20].slice(0, 4).map((m) => (
                  <button
                    key={m}
                    onClick={() => update({ pranayamDuration: m })}
                    className={`rounded-xl py-2 text-sm font-medium transition-all ${
                      local.pranayamDuration === m
                        ? "bg-teal-600 text-white"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* BREATH TAB */}
        {activeTab === "breath" && (
          <motion.div
            key="breath"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* Presets */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="mb-4 text-sm font-medium text-white/60">Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePreset(preset)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      selectedPreset === preset.name
                        ? "border-teal-500/50 bg-teal-500/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="text-sm font-medium">{preset.name}</span>
                    <span className="mt-0.5 text-xs text-white/40">{preset.desc}</span>
                    {preset.pattern && (
                      <span className="mt-2 text-xs font-mono text-teal-400/70">
                        {preset.pattern.inhale}-{preset.pattern.holdIn}-{preset.pattern.exhale}-{preset.pattern.holdOut}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom sliders */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="mb-4 text-sm font-medium text-white/60">Custom Pattern (seconds)</h3>
              <div className="space-y-5">
                <div style={{ "--slider-color": "#60a5fa" } as React.CSSProperties}>
                  <Slider label="Inhale (Puraka)" value={bp.inhale} min={1} max={20} color="text-blue-400" onChange={(v) => updateBreath({ inhale: v })} />
                </div>
                <div style={{ "--slider-color": "#fbbf24" } as React.CSSProperties}>
                  <Slider label="Hold after Inhale (Kumbhaka)" value={bp.holdIn} min={0} max={30} color="text-amber-400" onChange={(v) => updateBreath({ holdIn: v })} />
                </div>
                <div style={{ "--slider-color": "#34d399" } as React.CSSProperties}>
                  <Slider label="Exhale (Rechaka)" value={bp.exhale} min={1} max={20} color="text-emerald-400" onChange={(v) => updateBreath({ exhale: v })} />
                </div>
                <div style={{ "--slider-color": "#a78bfa" } as React.CSSProperties}>
                  <Slider label="Hold after Exhale (Bahya)" value={bp.holdOut} min={0} max={20} color="text-violet-400" onChange={(v) => updateBreath({ holdOut: v })} />
                </div>
              </div>

              {/* Cycle preview */}
              <div className="mt-5 rounded-xl bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-white/40">Cycle preview</span>
                  <span className="text-xs font-medium text-white/60">{totalCycle}s total</span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full">
                  {[
                    { val: bp.inhale, color: "#60a5fa" },
                    { val: bp.holdIn, color: "#fbbf24" },
                    { val: bp.exhale, color: "#34d399" },
                    { val: bp.holdOut, color: "#a78bfa" },
                  ].map((seg, i) =>
                    seg.val > 0 ? (
                      <div
                        key={i}
                        style={{
                          width: `${(seg.val / totalCycle) * 100}%`,
                          background: seg.color,
                        }}
                      />
                    ) : null
                  )}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-white/30">
                  <span>Inhale {bp.inhale}s</span>
                  {bp.holdIn > 0 && <span>Hold {bp.holdIn}s</span>}
                  <span>Exhale {bp.exhale}s</span>
                  {bp.holdOut > 0 && <span>Hold {bp.holdOut}s</span>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SOUND TAB */}
        {activeTab === "sound" && (
          <motion.div
            key="sound"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* No sound */}
            <button
              onClick={() => update({ sound: { type: "none", label: "No Sound" } })}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 transition-all ${
                local.sound.type === "none"
                  ? "border-white/30 bg-white/10"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <VolumeX className="h-5 w-5 text-white/50" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">Silent</p>
                <p className="text-xs text-white/40">No background sound</p>
              </div>
              {local.sound.type === "none" && (
                <Check className="h-4 w-4 text-indigo-400" />
              )}
            </button>

            {/* Built-in sounds */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Music className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-medium text-white/60">Ambient Sounds</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {BUILTIN_SOUNDS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() =>
                      update({
                        sound: { type: "builtin", label: s.label, url: s.id },
                      })
                    }
                    className={`rounded-xl border p-3 text-sm transition-all ${
                      local.sound.type === "builtin" && local.sound.url === s.id
                        ? "border-indigo-500/50 bg-indigo-500/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* YouTube */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-400" />
                <h3 className="text-sm font-medium text-white/60">YouTube Music</h3>
              </div>

              {/* Preset tracks */}
              <div className="mb-3 space-y-2">
                {YOUTUBE_PRESETS.map((track) => {
                  const isActive =
                    local.sound.type === "youtube" &&
                    local.sound.youtubeId === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() =>
                        update({
                          sound: {
                            type: "youtube",
                            label: track.label,
                            youtubeId: track.id,
                          },
                        })
                      }
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        isActive
                          ? "border-red-500/50 bg-red-500/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isActive ? "bg-red-500/20" : "bg-white/10"
                        }`}
                      >
                        {isActive ? (
                          <Check className="h-4 w-4 text-red-400" />
                        ) : (
                          <Youtube className="h-4 w-4 text-white/40" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isActive ? "text-white" : "text-white/70"}`}>
                            {track.label}
                          </span>
                          {track.featured && (
                            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
                              Featured
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-white/30">{track.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom URL input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  placeholder="Or paste any YouTube URL..."
                  className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-red-500/50"
                />
                <button
                  onClick={handleYoutube}
                  className="rounded-xl bg-red-600/80 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                  Add
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Upload className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-medium text-white/60">From Your Device</h3>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-5 text-sm text-white/40 transition-all hover:border-purple-400/40 hover:text-white/60"
              >
                <Upload className="h-4 w-4" />
                <span>Upload audio file</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {local.sound.type === "file" && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-purple-500/10 px-3 py-2">
                  <Check className="h-4 w-4 text-purple-400" />
                  <span className="truncate text-xs text-white/60">{local.sound.label}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-6 left-0 right-0 mx-auto max-w-lg px-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-sm font-semibold text-white shadow-2xl shadow-indigo-900/50 transition-all hover:shadow-indigo-700/40"
        >
          Save & Continue
        </motion.button>
      </div>
    </div>
  );
}
