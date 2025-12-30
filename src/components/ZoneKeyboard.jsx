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

// Tempo di stabilità richiesto prima di iniziare il dwell (ms)
const STABILITY_TIME = 150;
// Tolleranza jitter per evitare switch tra celle adiacenti (0-1, percentuale della cella)
const JITTER_TOLERANCE = 0.15;

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

// Calcola indice lettera con tolleranza jitter (hysteresis)
function getLetterIndexWithJitter(gazeX, gazeY, currentIdx, cols, totalLetters) {
  const col = Math.floor(gazeX * cols);
  const row = gazeY < 0.5 ? 0 : 1;
  let newIdx = Math.max(0, Math.min(totalLetters - 1, row * cols + col));

  // Se abbiamo già una lettera attiva, applichiamo hysteresis
  if (currentIdx !== null) {
    const currentCol = currentIdx % cols;
    const currentRow = Math.floor(currentIdx / cols);

    // Calcola la posizione relativa nella cella corrente
    const cellX = (gazeX * cols) - currentCol;
    const cellY = gazeY < 0.5 ? gazeY * 2 : (gazeY - 0.5) * 2;

    // Se siamo ancora nella zona centrale della cella corrente, mantieni la selezione
    if (cellX > JITTER_TOLERANCE && cellX < (1 - JITTER_TOLERANCE) &&
        cellY > JITTER_TOLERANCE && cellY < (1 - JITTER_TOLERANCE)) {
      return currentIdx;
    }

    // Se siamo nel bordo ma non abbastanza lontani, mantieni la selezione
    const distFromCenter = Math.sqrt(Math.pow(cellX - 0.5, 2) + Math.pow(cellY - 0.5, 2));
    if (distFromCenter < 0.4) {
      return currentIdx;
    }
  }

  return newIdx;
}

export function ZoneKeyboard({ gazePosition, onLetterSelect, dwellTime = 1200, isTracking }) {
  const [activeZone, setActiveZone] = useState(null);
  const [expandedZone, setExpandedZone] = useState(null);
  const [dwellProgress, setDwellProgress] = useState(0);
  const [activeLetter, setActiveLetter] = useState(null);
  const [isStable, setIsStable] = useState(false);

  const dwellTimerRef = useRef(null);
  const progressRef = useRef(null);
  const stabilityTimerRef = useRef(null);
  const lastZone = useRef(null);
  const lastLetter = useRef(null);
  const stableZoneRef = useRef(null);

  // Pulizia quando tracking si ferma
  useEffect(() => {
    if (!isTracking) {
      setActiveZone(null); setExpandedZone(null); setDwellProgress(0);
      setActiveLetter(null); setIsStable(false);
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      if (stabilityTimerRef.current) clearTimeout(stabilityTimerRef.current);
      lastZone.current = null;
      lastLetter.current = null;
      stableZoneRef.current = null;
    }
  }, [isTracking]);

  // Gestione selezione ZONA con stabilità
  useEffect(() => {
    if (!isTracking || expandedZone !== null) return;
    const zone = getZoneFromGaze(gazePosition.x, gazePosition.y, 4);

    // Se la zona è cambiata
    if (zone !== lastZone.current) {
      lastZone.current = zone;
      setActiveZone(zone);
      setDwellProgress(0);
      setIsStable(false);

      // Cancella timer precedenti
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      if (stabilityTimerRef.current) clearTimeout(stabilityTimerRef.current);

      // Avvia timer di stabilità - dwell parte solo dopo STABILITY_TIME ms nella stessa zona
      stableZoneRef.current = zone;
      stabilityTimerRef.current = setTimeout(() => {
        // Verifica che siamo ancora nella stessa zona
        if (stableZoneRef.current === zone) {
          setIsStable(true);
          const start = Date.now();
          progressRef.current = setInterval(() => {
            setDwellProgress(Math.min(100, ((Date.now() - start) / dwellTime) * 100));
          }, 30);
          dwellTimerRef.current = setTimeout(() => {
            clearInterval(progressRef.current);
            setDwellProgress(0);
            setExpandedZone(zone);
            lastZone.current = null;
            stableZoneRef.current = null;
            setIsStable(false);
          }, dwellTime);
        }
      }, STABILITY_TIME);
    }
  }, [gazePosition, isTracking, expandedZone, dwellTime]);

  // Gestione selezione LETTERA con jitter tolerance
  useEffect(() => {
    if (expandedZone === null || !isTracking) return;
    const letters = ZONE_LETTERS[expandedZone];
    const cols = 4;

    // Usa funzione con jitter tolerance
    const idx = getLetterIndexWithJitter(gazePosition.x, gazePosition.y, lastLetter.current, cols, letters.length);

    if (idx !== lastLetter.current) {
      lastLetter.current = idx;
      setActiveLetter(idx);
      setDwellProgress(0);
      setIsStable(false);

      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      if (stabilityTimerRef.current) clearTimeout(stabilityTimerRef.current);

      // Stabilità anche per le lettere
      stabilityTimerRef.current = setTimeout(() => {
        if (lastLetter.current === idx) {
          setIsStable(true);
          const start = Date.now();
          progressRef.current = setInterval(() => {
            setDwellProgress(Math.min(100, ((Date.now() - start) / dwellTime) * 100));
          }, 30);
          dwellTimerRef.current = setTimeout(() => {
            clearInterval(progressRef.current);
            onLetterSelect(letters[idx]);
            setExpandedZone(null);
            setActiveLetter(null);
            setDwellProgress(0);
            lastLetter.current = null;
            setIsStable(false);
          }, dwellTime);
        }
      }, STABILITY_TIME);
    }
  }, [gazePosition, expandedZone, isTracking, dwellTime, onLetterSelect]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    if (stabilityTimerRef.current) clearTimeout(stabilityTimerRef.current);
  }, []);

  const goBack = () => { setExpandedZone(null); setActiveLetter(null); setDwellProgress(0); lastZone.current = null; lastLetter.current = null; };

  // Expanded zone - show letters
  if (expandedZone !== null) {
    const letters = ZONE_LETTERS[expandedZone];
    const cfg = ZONE_CONFIG[expandedZone];
    return (
      <div className="h-full flex flex-col p-2 gap-2" style={{ animation: "fade-in 0.2s" }}>
        {/* Back button - compact */}
        <button
          onClick={goBack}
          className="py-3 px-4 rounded-xl font-bold text-lg flex items-center gap-2 flex-shrink-0"
          style={{
            background: "rgba(30, 41, 59, 0.95)",
            color: "#fff",
            borderLeft: `4px solid ${cfg.color}`
          }}
        >
          ← Indietro
        </button>

        {/* Letters grid - maximized */}
        <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-2 min-h-0">
          {letters.map((letter, idx) => {
            const isActive = idx === activeLetter;
            return (
              <div
                key={idx}
                className="relative flex items-center justify-center rounded-xl font-bold transition-all duration-150"
                style={{
                  fontSize: "clamp(28px, 10vw, 56px)",
                  background: isActive ? cfg.bg : "rgba(30, 41, 59, 0.9)",
                  border: `3px solid ${isActive ? cfg.color : "rgba(71, 85, 105, 0.3)"}`,
                  color: isActive ? "#fff" : "rgba(255, 255, 255, 0.8)",
                  boxShadow: isActive ? `0 0 40px ${cfg.color}60` : "0 4px 12px rgba(0, 0, 0, 0.3)",
                  transform: isActive ? "scale(1.05)" : "scale(1)"
                }}
              >
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <DwellRing progress={dwellProgress} color={cfg.color} size={70} />
                  </div>
                )}
                <span className="relative z-10">{letter === " " ? "␣" : letter}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Main zone selection - 2x2 grid maximized
  return (
    <div className="h-full grid grid-cols-2 grid-rows-2 gap-2 p-2">
      {ZONE_CONFIG.map((cfg, idx) => {
        const isActive = idx === activeZone && isTracking;
        return (
          <div
            key={idx}
            onClick={() => setExpandedZone(idx)}
            className="relative flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden"
            style={{
              minHeight: "120px",
              background: isActive
                ? `linear-gradient(145deg, ${cfg.color}35 0%, ${cfg.color}12 100%)`
                : "linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
              border: `4px solid ${isActive ? cfg.color : "rgba(71, 85, 105, 0.35)"}`,
              boxShadow: isActive ? `0 0 60px ${cfg.color}50` : "0 8px 30px rgba(0, 0, 0, 0.4)",
              transform: isActive ? "scale(1.02)" : "scale(1)"
            }}
          >
            {/* Dwell progress overlay */}
            {isActive && (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <DwellRing progress={dwellProgress} color={cfg.color} size={Math.min(120, 100)} />
                </div>
                <div
                  className="absolute inset-4 rounded-xl pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${cfg.color}50 0%, transparent 70%)`,
                    opacity: dwellProgress / 100
                  }}
                />
              </>
            )}

            {/* Color indicator dot */}
            <div
              className="absolute top-3 left-3 w-3 h-3 rounded-full"
              style={{ background: cfg.color, boxShadow: `0 0 12px ${cfg.color}` }}
            />

            {/* Zone label */}
            <span
              className="relative z-10 font-bold text-white tracking-wide"
              style={{ fontSize: "clamp(28px, 9vw, 48px)" }}
            >
              {cfg.label}
            </span>

            {/* Letter preview */}
            <span className="relative z-10 text-white/50 text-sm mt-1 tracking-widest">
              {ZONE_LETTERS[idx].slice(0, 4).join(" ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
