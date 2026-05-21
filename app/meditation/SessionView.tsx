"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppView, MeditationSettings } from "./MeditationApp";
import { ArrowLeft, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

type Props = {
  settings: MeditationSettings;
  mode: AppView;
  onBack: () => void;
};

type BreathPhase = "inhale" | "holdIn" | "exhale" | "holdOut" | "idle";

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: "Breathe In",
  holdIn: "Hold",
  exhale: "Breathe Out",
  holdOut: "Hold",
  idle: "Ready",
};

const PHASE_COLORS: Record<BreathPhase, string> = {
  inhale: "#60a5fa",
  holdIn: "#fbbf24",
  exhale: "#34d399",
  holdOut: "#a78bfa",
  idle: "#818cf8",
};

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Web Audio API ambient tones
function createAmbientOscillator(ctx: AudioContext, freq: number, type: OscillatorType = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  return { osc, gain };
}

export default function SessionView({ settings, mode, onBack }: Props) {
  const isPranayam = mode === "pranayam";
  const totalSeconds = isPranayam
    ? settings.pranayamDuration * 60
    : settings.meditationDuration * 60;

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>("idle");
  const [phaseTime, setPhaseTime] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [phaseProgress, setPhaseProgress] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<BreathPhase>("idle");
  const phaseTimeRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const fileAudioRef = useRef<HTMLAudioElement | null>(null);
  const youtubeRef = useRef<HTMLIFrameElement | null>(null);

  const bp = settings.breathingPattern;
  const phaseDurations: Record<Exclude<BreathPhase, "idle">, number> = {
    inhale: bp.inhale,
    holdIn: bp.holdIn,
    exhale: bp.exhale,
    holdOut: bp.holdOut,
  };

  const nextPhase = useCallback(
    (current: BreathPhase): BreathPhase => {
      if (current === "inhale") return bp.holdIn > 0 ? "holdIn" : "exhale";
      if (current === "holdIn") return "exhale";
      if (current === "exhale") return bp.holdOut > 0 ? "holdOut" : "inhale";
      if (current === "holdOut") return "inhale";
      return "inhale";
    },
    [bp]
  );

  // Start / stop ambient audio
  const startAudio = useCallback(() => {
    if (!soundEnabled) return;
    const sound = settings.sound;

    if (sound.type === "file" && sound.fileUrl) {
      const audio = new Audio(sound.fileUrl);
      audio.loop = true;
      audio.volume = 0.6;
      audio.play().catch(() => {});
      fileAudioRef.current = audio;
      return;
    }

    if (sound.type === "youtube") return; // controlled via iframe

    if (sound.type === "builtin" && sound.url !== "silence") {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const nodes: { osc: OscillatorNode; gain: GainNode }[] = [];

        // Different ambient tones per sound type
        const configs: Record<string, { freq: number; type: OscillatorType }[]> = {
          rain: [
            { freq: 200, type: "sawtooth" },
            { freq: 300, type: "sawtooth" },
          ],
          ocean: [{ freq: 80, type: "sine" }, { freq: 120, type: "sine" }],
          forest: [{ freq: 528, type: "sine" }, { freq: 432, type: "sine" }],
          tibetan: [{ freq: 432, type: "sine" }, { freq: 528, type: "triangle" }],
          om: [{ freq: 136.1, type: "sine" }],
        };

        const selected = configs[sound.url ?? ""] ?? configs["tibetan"];
        selected.forEach(({ freq, type }) => {
          const node = createAmbientOscillator(ctx, freq, type);
          nodes.push(node);
        });
        audioNodesRef.current = nodes;
      } catch {
        // audio unavailable
      }
    }
  }, [soundEnabled, settings.sound]);

  const stopAudio = useCallback(() => {
    fileAudioRef.current?.pause();
    fileAudioRef.current = null;
    audioNodesRef.current.forEach(({ osc, gain }) => {
      gain.gain.setValueAtTime(0, audioCtxRef.current?.currentTime ?? 0);
      osc.stop();
    });
    audioNodesRef.current = [];
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }, []);

  const resetSession = useCallback(() => {
    clearInterval(timerRef.current!);
    stopAudio();
    setTimeLeft(totalSeconds);
    setIsRunning(false);
    setPhase("idle");
    phaseRef.current = "idle";
    phaseTimeRef.current = 0;
    setPhaseTime(0);
    setCycleCount(0);
    setIsComplete(false);
    setPhaseProgress(0);
  }, [totalSeconds, stopAudio]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current!);
      stopAudio();
    };
  }, [stopAudio]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setIsComplete(true);
            stopAudio();
            return 0;
          }
          return prev - 1;
        });

        if (isPranayam) {
          // Advance breathing phase
          phaseTimeRef.current -= 1;

          if (phaseRef.current === "idle") {
            phaseRef.current = "inhale";
            phaseTimeRef.current = phaseDurations.inhale - 1;
          } else if (phaseTimeRef.current <= 0) {
            const next = nextPhase(phaseRef.current);
            phaseRef.current = next;
            phaseTimeRef.current = phaseDurations[next as Exclude<BreathPhase, "idle">] - 1;
            if (next === "inhale") {
              setCycleCount((c) => c + 1);
            }
          }

          const currentPhase = phaseRef.current;
          const currentTime = phaseTimeRef.current;
          const duration = phaseDurations[currentPhase as Exclude<BreathPhase, "idle">] || 1;
          setPhase(currentPhase);
          setPhaseTime(currentTime);
          setPhaseProgress(1 - currentTime / duration);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current!);
    }

    return () => clearInterval(timerRef.current!);
  }, [isRunning, isPranayam, phaseDurations, nextPhase, stopAudio]);

  const handleStartPause = () => {
    if (isComplete) return;
    if (!isRunning && !audioCtxRef.current && !fileAudioRef.current) {
      startAudio();
    }
    if (isRunning) stopAudio();
    setIsRunning((r) => !r);
  };

  const progress = 1 - timeLeft / totalSeconds;
  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference * (1 - progress);

  // Breathing circle scale
  const breathScale =
    phase === "inhale"
      ? 1 + 0.35 * phaseProgress
      : phase === "holdIn"
      ? 1.35
      : phase === "exhale"
      ? 1.35 - 0.35 * phaseProgress
      : phase === "holdOut"
      ? 1.0
      : 1.0;

  const phaseColor = PHASE_COLORS[phase];

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* YouTube embed (hidden) */}
      {settings.sound.type === "youtube" && settings.sound.youtubeId && (
        <iframe
          ref={youtubeRef}
          className="pointer-events-none absolute opacity-0"
          width="1"
          height="1"
          src={`https://www.youtube.com/embed/${settings.sound.youtubeId}?autoplay=${isRunning ? 1 : 0}&loop=1&playlist=${settings.sound.youtubeId}&enablejsapi=1`}
          allow="autoplay"
          title="background-music"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8">
        <button
          onClick={() => { resetSession(); onBack(); }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5 text-white/70" />
        </button>
        <div className="text-center">
          <p className="text-xs font-medium tracking-widest text-white/30 uppercase">
            {isPranayam ? "Pranayama" : "Meditation"}
          </p>
        </div>
        <button
          onClick={() => setSoundEnabled((s) => !s)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 transition-colors hover:bg-white/20"
        >
          {soundEnabled ? (
            <Volume2 className="h-5 w-5 text-white/70" />
          ) : (
            <VolumeX className="h-5 w-5 text-white/40" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Outer timer ring */}
        <div className="relative flex items-center justify-center">
          {/* Glow rings */}
          <div
            className="absolute rounded-full opacity-20 blur-3xl transition-all duration-1000"
            style={{
              width: 260,
              height: 260,
              background: phaseColor,
            }}
          />
          <div
            className="absolute rounded-full opacity-10 blur-xl transition-all duration-1000"
            style={{
              width: 240 * breathScale,
              height: 240 * breathScale,
              background: phaseColor,
            }}
          />

          {/* SVG progress ring */}
          <svg width={260} height={260} className="absolute -rotate-90">
            <circle
              cx={130}
              cy={130}
              r={110}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={3}
            />
            <circle
              cx={130}
              cy={130}
              r={110}
              fill="none"
              stroke={phaseColor}
              strokeWidth={3}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
              style={{ opacity: 0.7 }}
            />
          </svg>

          {/* Breathing orb */}
          <motion.div
            animate={{ scale: breathScale }}
            transition={{
              duration:
                phase === "inhale"
                  ? bp.inhale
                  : phase === "exhale"
                  ? bp.exhale
                  : 0.3,
              ease: phase === "inhale" ? "easeIn" : phase === "exhale" ? "easeOut" : "linear",
            }}
            className="relative flex h-48 w-48 flex-col items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle at 40% 40%, ${phaseColor}30, ${phaseColor}08)`,
              border: `1.5px solid ${phaseColor}40`,
              boxShadow: `0 0 40px ${phaseColor}20, inset 0 0 30px ${phaseColor}10`,
            }}
          >
            {/* Inner ripple rings */}
            {isRunning && (
              <>
                <motion.div
                  className="absolute rounded-full border opacity-20"
                  style={{ borderColor: phaseColor }}
                  animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute rounded-full border opacity-20"
                  style={{ borderColor: phaseColor }}
                  animate={{ scale: [1, 1.3], opacity: [0.2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                />
              </>
            )}

            {isPranayam ? (
              <div className="flex flex-col items-center gap-1">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={phase}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg font-semibold text-white"
                  >
                    {PHASE_LABELS[phase]}
                  </motion.p>
                </AnimatePresence>
                {phase !== "idle" && (
                  <motion.p
                    key={phaseTime + phase}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-4xl font-bold"
                    style={{ color: phaseColor }}
                  >
                    {phaseTime + 1}
                  </motion.p>
                )}
                {phase === "idle" && !isRunning && (
                  <p className="text-3xl font-light text-white/30">✦</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-medium text-white/40">
                  {isRunning ? "Meditating" : isComplete ? "Complete" : "Ready"}
                </p>
                <p className="text-3xl font-bold text-white">
                  {formatTime(timeLeft)}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Time remaining */}
        <div className="mt-8 text-center">
          <p className="text-3xl font-thin tabular-nums text-white">
            {formatTime(timeLeft)}
          </p>
          <p className="mt-1 text-xs text-white/30">remaining</p>
        </div>

        {/* Pranayam cycle & phase info */}
        {isPranayam && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center gap-6"
          >
            {(["inhale", "holdIn", "exhale", "holdOut"] as BreathPhase[]).map(
              (p) => {
                const dur = phaseDurations[p as Exclude<BreathPhase, "idle">];
                if (dur === 0) return null;
                return (
                  <div key={p} className="flex flex-col items-center gap-1">
                    <div
                      className="h-1.5 w-1.5 rounded-full transition-all"
                      style={{
                        background: phase === p ? PHASE_COLORS[p] : "rgba(255,255,255,0.15)",
                        boxShadow: phase === p ? `0 0 6px ${PHASE_COLORS[p]}` : "none",
                      }}
                    />
                    <span className="text-[10px] text-white/30">{dur}s</span>
                  </div>
                );
              }
            )}
          </motion.div>
        )}

        {isPranayam && cycleCount > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5">
            <span className="text-xs text-white/40">Cycles completed:</span>
            <span className="text-xs font-semibold text-teal-400">{cycleCount}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 px-6 pb-16">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetSession}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
        >
          <RotateCcw className="h-5 w-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartPause}
          disabled={isComplete}
          className="relative flex h-20 w-20 items-center justify-center rounded-full transition-all disabled:opacity-40"
          style={{
            background: `linear-gradient(135deg, ${phaseColor}60, ${phaseColor}30)`,
            border: `1.5px solid ${phaseColor}50`,
            boxShadow: `0 0 30px ${phaseColor}30`,
          }}
        >
          <AnimatePresence mode="wait">
            {isRunning ? (
              <motion.div
                key="pause"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Pause className="h-8 w-8 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Play className="h-8 w-8 translate-x-0.5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Spacer */}
        <div className="h-12 w-12" />
      </div>

      {/* Completion overlay */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-[#0a0a1a]/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="mx-4 max-w-sm rounded-3xl border border-white/10 bg-[#0f0f2a]/90 p-8 text-center backdrop-blur-xl"
            >
              <div className="mb-4 text-5xl">
                {isPranayam ? "🌬️" : "🧘"}
              </div>
              <h2 className="text-2xl font-semibold text-white">
                Session Complete
              </h2>
              <p className="mt-2 text-sm text-white/50">
                {isPranayam
                  ? `Wonderful! ${cycleCount} breathing cycles completed.`
                  : `You meditated for ${settings.meditationDuration} minutes.`}
              </p>
              {isPranayam && (
                <p className="mt-1 text-xs text-teal-400/70">
                  Pattern: {bp.inhale}-{bp.holdIn}-{bp.exhale}-{bp.holdOut}
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={resetSession}
                  className="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/10"
                >
                  Again
                </button>
                <button
                  onClick={() => { resetSession(); onBack(); }}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
