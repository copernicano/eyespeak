import { useState } from "react";

export function TextOutput({ text, onClear }) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Errore copia:", err);
    }
  };

  const handleSpeak = () => {
    if (!text || speaking) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "it-IT";
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  const handleClear = () => {
    speechSynthesis.cancel();
    setSpeaking(false);
    onClear();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Area messaggio - stile speech bubble */}
      <div className="relative rounded-3xl p-5 min-h-[90px] flex items-center"
        style={{
          background: "linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)",
          border: "2px solid rgba(71,85,105,0.3)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
        }}>
        {/* Indicatore di stato */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {text && (
            <span className="text-xs text-white/30 font-medium">{text.length} caratteri</span>
          )}
        </div>
        <p className="text-2xl text-white break-words w-full leading-relaxed" style={{fontFamily:"Atkinson Hyperlegible, sans-serif"}}>
          {text || <span className="text-white/30 italic">Componi il tuo messaggio...</span>}
        </p>
      </div>

      {/* Pulsanti azione - molto grandi per facilita di uso */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleCopy}
          disabled={!text}
          className="py-5 px-3 rounded-2xl font-bold text-xl flex flex-col items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: text 
              ? (copied ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)")
              : "rgba(51,65,85,0.5)",
            color: text ? "#fff" : "rgba(148,163,184,0.5)",
            boxShadow: text ? "0 8px 24px rgba(59,130,246,0.3)" : "none",
            transform: copied ? "scale(1.02)" : "scale(1)"
          }}>
          <span className="text-3xl">{copied ? "?" : "??"}</span>
          <span>{copied ? "Copiato!" : "Copia"}</span>
        </button>

        <button
          onClick={handleSpeak}
          disabled={!text || speaking}
          className="py-5 px-3 rounded-2xl font-bold text-xl flex flex-col items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: text && !speaking 
              ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
              : "rgba(51,65,85,0.5)",
            color: text ? "#fff" : "rgba(148,163,184,0.5)",
            boxShadow: text && !speaking ? "0 8px 24px rgba(34,197,94,0.3)" : "none",
            animation: speaking ? "pulse 1s infinite" : "none"
          }}>
          <span className="text-3xl">{speaking ? "??" : "??"}</span>
          <span>{speaking ? "..." : "Leggi"}</span>
        </button>

        <button
          onClick={handleClear}
          disabled={!text}
          className="py-5 px-3 rounded-2xl font-bold text-xl flex flex-col items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: text 
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              : "rgba(51,65,85,0.5)",
            color: text ? "#fff" : "rgba(148,163,184,0.5)",
            boxShadow: text ? "0 8px 24px rgba(239,68,68,0.3)" : "none"
          }}>
          <span className="text-3xl">???</span>
          <span>Cancella</span>
        </button>
      </div>
    </div>
  );
}
