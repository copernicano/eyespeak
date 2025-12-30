import { useState, useEffect, useRef } from "react";
import { getZoneFromGaze } from "../utils/gazeUtils";

const ZONE_LETTERS = [
  ["A", "B", "C", "D", "E", "F", "G"],
  ["H", "I", "J", "K", "L", "M", "N"],
  ["O", "P", "Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z", " ", "?"]
];

const ZONE_CONFIG = [
  { label: "A-G", color: "#f59e0b", bg: "rgba(245,158,11,0.2)" },
  { label: "H-N", color: "#14b8a6", bg: "rgba(20,184,166,0.2)" },
  { label: "O-U", color: "#a78bfa", bg: "rgba(167,139,250,0.2)" },
  { label: "V-Z", color: "#34d399", bg: "rgba(52,211,153,0.2)" }
];

function DwellRing({ progress, color, size }) {
  const sz = size || 100;
  const r = (sz - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  if (progress < 5) return null;
  return (
    <svg width={sz} height={sz} className="absolute pointer-events-none" style={{transform:"rotate(-90deg)"}}>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{filter:"drop-shadow(0 0 12px "+color+")"}} />
    </svg>
  );
}

export function ZoneKeyboard({ gazePosition, onLetterSelect, dwellTime = 600, isTracking }) {
  const [activeZone, setActiveZone] = useState(null);
  const [expandedZone, setExpandedZone] = useState(null);
  const [dwellProgress, setDwellProgress] = useState(0);
  const [activeLetter, setActiveLetter] = useState(null);
  const dwellTimerRef = useRef(null);
  const progressRef = useRef(null);
  const lastZone = useRef(null);

  useEffect(() => {
    if (!isTracking) {
      setActiveZone(null); setExpandedZone(null); setDwellProgress(0); setActiveLetter(null);
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    }
  }, [isTracking]);

  useEffect(() => {
    if (!isTracking || expandedZone !== null) return;
    const zone = getZoneFromGaze(gazePosition.x, gazePosition.y, 4);
    if (zone !== lastZone.current) {
      lastZone.current = zone; setActiveZone(zone); setDwellProgress(0);
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      const start = Date.now();
      progressRef.current = setInterval(() => {
        setDwellProgress(Math.min(100, ((Date.now() - start) / dwellTime) * 100));
      }, 30);
      dwellTimerRef.current = setTimeout(() => {
        clearInterval(progressRef.current); setDwellProgress(0);
        setExpandedZone(zone); lastZone.current = null;
      }, dwellTime);
    }
  }, [gazePosition, isTracking, expandedZone, dwellTime]);

  useEffect(() => {
    if (expandedZone === null || !isTracking) return;
    const letters = ZONE_LETTERS[expandedZone];
    const cols = 4, col = Math.floor(gazePosition.x * cols), row = gazePosition.y < 0.5 ? 0 : 1;
    let idx = Math.max(0, Math.min(letters.length - 1, row * cols + col));
    if (idx !== activeLetter) {
      setActiveLetter(idx); setDwellProgress(0);
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      const start = Date.now();
      progressRef.current = setInterval(() => {
        setDwellProgress(Math.min(100, ((Date.now() - start) / dwellTime) * 100));
      }, 30);
      dwellTimerRef.current = setTimeout(() => {
        clearInterval(progressRef.current);
        onLetterSelect(letters[idx]);
        setExpandedZone(null); setActiveLetter(null); setDwellProgress(0);
      }, dwellTime);
    }
  }, [gazePosition, expandedZone, isTracking, activeLetter, dwellTime, onLetterSelect]);

  useEffect(() => () => {
    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const goBack = () => { setExpandedZone(null); setActiveLetter(null); setDwellProgress(0); lastZone.current = null; };

  if (expandedZone !== null) {
    const letters = ZONE_LETTERS[expandedZone];
    const cfg = ZONE_CONFIG[expandedZone];
    return (
      <div className="flex-1 flex flex-col p-3" style={{animation:"fade-in 0.2s"}}>
        <button onClick={goBack} className="mb-3 py-4 px-6 rounded-2xl font-bold text-xl flex items-center gap-3"
          style={{background:"rgba(30,41,59,0.95)",color:"#fff",borderLeft:"4px solid "+cfg.color}}>
          ? Indietro
        </button>
        <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-3">
          {letters.map((letter, idx) => {
            const isActive = idx === activeLetter;
            return (
              <div key={idx} className="relative flex items-center justify-center rounded-2xl font-bold transition-all duration-150"
                style={{
                  fontSize: "clamp(36px, 12vw, 64px)",
                  background: isActive ? cfg.bg : "rgba(30,41,59,0.85)",
                  border: "4px solid " + (isActive ? cfg.color : "rgba(71,85,105,0.3)"),
                  color: isActive ? "#fff" : "rgba(255,255,255,0.75)",
                  boxShadow: isActive ? "0 0 50px " + cfg.color + "60" : "0 4px 15px rgba(0,0,0,0.3)",
                  transform: isActive ? "scale(1.08)" : "scale(1)"
                }}>
                {isActive && <div className="absolute inset-0 flex items-center justify-center">
                  <DwellRing progress={dwellProgress} color={cfg.color} size={90} />
                </div>}
                <span className="relative z-10">{letter === " " ? "SPC" : letter}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 p-4">
      {ZONE_CONFIG.map((cfg, idx) => {
        const isActive = idx === activeZone && isTracking;
        return (
          <div key={idx} onClick={() => setExpandedZone(idx)}
            className="relative flex flex-col items-center justify-center rounded-3xl cursor-pointer transition-all duration-200 overflow-hidden"
            style={{
              background: isActive 
                ? "linear-gradient(145deg, " + cfg.color + "35 0%, " + cfg.color + "12 100%)"
                : "linear-gradient(145deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)",
              border: "4px solid " + (isActive ? cfg.color : "rgba(71,85,105,0.35)"),
              boxShadow: isActive ? "0 0 70px " + cfg.color + "50" : "0 8px 40px rgba(0,0,0,0.5)",
              transform: isActive ? "scale(1.04)" : "scale(1)"
            }}>
            {isActive && (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <DwellRing progress={dwellProgress} color={cfg.color} size={130} />
                </div>
                <div className="absolute inset-8 rounded-2xl pointer-events-none"
                  style={{background:"radial-gradient(circle, "+cfg.color+"50 0%, transparent 65%)",opacity:dwellProgress/100}} />
              </>
            )}
            <div className="absolute top-5 left-5 w-4 h-4 rounded-full" style={{background:cfg.color,boxShadow:"0 0 15px "+cfg.color}} />
            <span className="relative z-10 font-bold text-white tracking-wide" style={{fontSize:"clamp(34px, 11vw, 56px)"}}>{cfg.label}</span>
            <span className="relative z-10 text-white/45 text-base mt-2 tracking-widest">{ZONE_LETTERS[idx].slice(0,4).join(" ")}</span>
          </div>
        );
      })}
    </div>
  );
}
