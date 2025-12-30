import { useState } from "react";

export function TextOutput({ text, onClear }) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  // Versione compatta - mostra solo testo e icone minime
  if (!expanded) {
    return (
      <div
        className="flex items-center gap-2 rounded-2xl px-4 py-3 cursor-pointer"
        style={{
          background: "rgba(15, 23, 42, 0.9)",
          border: "2px solid rgba(71, 85, 105, 0.3)",
          backdropFilter: "blur(8px)",
          minHeight: "56px"
        }}
        onClick={() => text && setExpanded(true)}
      >
        {/* Testo - una riga con ellipsis */}
        <div className="flex-1 min-w-0">
          <p
            className="text-xl text-white truncate"
            style={{ fontFamily: "Atkinson Hyperlegible, sans-serif" }}
          >
            {text || <span className="text-white/30">Componi il messaggio...</span>}
          </p>
        </div>

        {/* Azioni compatte */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {text && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all"
                style={{
                  background: copied ? "#22c55e" : "rgba(59, 130, 246, 0.2)",
                  color: copied ? "#fff" : "#60a5fa"
                }}
              >
                {copied ? "✓" : "📋"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
                disabled={speaking}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all"
                style={{
                  background: speaking ? "#22c55e" : "rgba(34, 197, 94, 0.2)",
                  color: speaking ? "#fff" : "#4ade80",
                  animation: speaking ? "pulse 1s infinite" : "none"
                }}
              >
                {speaking ? "🔊" : "▶"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all"
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  color: "#f87171"
                }}
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Versione espansa - overlay per vedere tutto il testo
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.9)", backdropFilter: "blur(12px)" }}
      onClick={() => setExpanded(false)}
    >
      <div
        className="w-full max-w-2xl rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)",
          border: "2px solid rgba(71, 85, 105, 0.4)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.6)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Testo completo */}
        <p
          className="text-2xl text-white leading-relaxed mb-6 min-h-[100px]"
          style={{ fontFamily: "Atkinson Hyperlegible, sans-serif" }}
        >
          {text || <span className="text-white/30">Nessun messaggio</span>}
        </p>

        {/* Contatore caratteri */}
        {text && (
          <p className="text-sm text-white/40 mb-6">{text.length} caratteri</p>
        )}

        {/* Pulsanti grandi */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleCopy}
            disabled={!text}
            className="py-4 rounded-2xl font-bold text-lg flex flex-col items-center gap-2 transition-all"
            style={{
              background: text
                ? (copied ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #3b82f6, #2563eb)")
                : "rgba(51, 65, 85, 0.5)",
              color: text ? "#fff" : "rgba(148, 163, 184, 0.5)"
            }}
          >
            <span className="text-2xl">{copied ? "✓" : "📋"}</span>
            <span>{copied ? "Copiato!" : "Copia"}</span>
          </button>

          <button
            onClick={handleSpeak}
            disabled={!text || speaking}
            className="py-4 rounded-2xl font-bold text-lg flex flex-col items-center gap-2 transition-all"
            style={{
              background: text && !speaking
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : "rgba(51, 65, 85, 0.5)",
              color: text ? "#fff" : "rgba(148, 163, 184, 0.5)"
            }}
          >
            <span className="text-2xl">{speaking ? "🔊" : "▶"}</span>
            <span>{speaking ? "..." : "Leggi"}</span>
          </button>

          <button
            onClick={handleClear}
            disabled={!text}
            className="py-4 rounded-2xl font-bold text-lg flex flex-col items-center gap-2 transition-all"
            style={{
              background: text
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "rgba(51, 65, 85, 0.5)",
              color: text ? "#fff" : "rgba(148, 163, 184, 0.5)"
            }}
          >
            <span className="text-2xl">🗑</span>
            <span>Cancella</span>
          </button>
        </div>

        {/* Chiudi */}
        <button
          onClick={() => setExpanded(false)}
          className="mt-4 w-full py-3 rounded-xl text-white/60 text-lg"
          style={{ background: "rgba(71, 85, 105, 0.3)" }}
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}
