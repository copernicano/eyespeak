import { useState, useEffect, useCallback } from "react";
import { Camera } from "./components/Camera";
import { ZoneKeyboard } from "./components/ZoneKeyboard";
import { TextOutput } from "./components/TextOutput";
import { Suggestions } from "./components/Suggestions";
import { Settings } from "./components/Settings";
import { GazeIndicator } from "./components/GazeIndicator";
import { Onboarding } from "./components/Onboarding";
import { useEyeTracker } from "./hooks/useEyeTracker";
import { useGroq } from "./hooks/useGroq";

function App() {
  const [text, setText] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ dwellTime: 1200, speakLetters: true, speakWords: true, showGazeIndicator: true });

  const { isReady, isTracking, gazePosition, landmarks, error, initialize, startTracking, stopTracking } = useEyeTracker();
  const { suggestions, isLoading, getSuggestions } = useGroq();

  // Check if Groq API is configured
  const hasGroqKey = !!import.meta.env.VITE_GROQ_KEY;

  useEffect(() => {
    const saved = localStorage.getItem("eyespeak_settings");
    if (saved) { try { setSettings(prev => ({ ...prev, ...JSON.parse(saved) })); } catch {} }
  }, []);

  useEffect(() => {
    if (!hasGroqKey) return;
    const words = text.trim().split(" ");
    const lastWord = words[words.length - 1] || "";
    if (text.length > 2) {
      const timer = setTimeout(() => getSuggestions(text, lastWord), 500);
      return () => clearTimeout(timer);
    }
  }, [text, getSuggestions, hasGroqKey]);

  const speakLetter = useCallback((letter) => {
    if (!settings.speakLetters) return;
    const u = new SpeechSynthesisUtterance(letter === " " ? "spazio" : letter);
    u.lang = "it-IT"; u.rate = 1.5;
    speechSynthesis.speak(u);
  }, [settings.speakLetters]);

  const speakWord = useCallback((word) => {
    if (!settings.speakWords) return;
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "it-IT";
    speechSynthesis.speak(u);
  }, [settings.speakWords]);

  const handleLetterSelect = useCallback((letter) => {
    if (letter === "?") {
      setText(prev => prev.slice(0, -1));
      speakLetter("cancella");
    } else {
      setText(prev => prev + letter);
      speakLetter(letter);
      if (letter === " ") {
        const words = text.trim().split(" ");
        const lastWord = words[words.length - 1];
        if (lastWord) speakWord(lastWord);
      }
    }
  }, [text, speakLetter, speakWord]);

  const handleSuggestionSelect = useCallback((word) => {
    const words = text.trim().split(" ");
    words.pop();
    const newText = words.length > 0 ? words.join(" ") + " " + word + " " : word + " ";
    setText(newText);
    speakWord(word);
  }, [text, speakWord]);

  const toggleTracking = useCallback(() => {
    if (isTracking) stopTracking();
    else startTracking();
  }, [isTracking, startTracking, stopTracking]);

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)" }}
    >
      {/* Gaze Indicator */}
      <GazeIndicator gazePosition={gazePosition} isTracking={isTracking} isVisible={settings.showGazeIndicator} />

      {/* Ultra-compact header */}
      <header
        className="flex items-center gap-2 px-2 py-2 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(71, 85, 105, 0.2)" }}
      >
        {/* Settings button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "rgba(51, 65, 85, 0.4)" }}
        >
          ⚙
        </button>

        {/* Text output - takes remaining space */}
        <div className="flex-1 min-w-0">
          <TextOutput text={text} onClear={() => setText("")} />
        </div>

        {/* Start/Stop + Camera */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleTracking}
            disabled={!isReady}
            className="h-10 px-4 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
            style={{
              background: isTracking
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "#fff",
              opacity: isReady ? 1 : 0.5,
              boxShadow: isTracking ? "0 0 15px rgba(34, 197, 94, 0.4)" : "0 2px 10px rgba(59, 130, 246, 0.3)"
            }}
          >
            <span>{isTracking ? "■" : "▶"}</span>
            <span className="hidden sm:inline">{isTracking ? "Stop" : "Avvia"}</span>
          </button>
          <Camera onInit={initialize} landmarks={landmarks} isTracking={isTracking} />
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div
          className="mx-2 mt-1 p-3 rounded-lg text-sm flex-shrink-0"
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5"
          }}
        >
          {error}
        </div>
      )}

      {/* Suggestions - only show if Groq configured and has suggestions */}
      {hasGroqKey && suggestions.length > 0 && (
        <div className="px-2 py-1 flex-shrink-0">
          <Suggestions suggestions={suggestions} onSelect={handleSuggestionSelect} isLoading={isLoading} />
        </div>
      )}

      {/* Zone Keyboard - takes all remaining space */}
      <div className="flex-1 min-h-0">
        <ZoneKeyboard
          gazePosition={gazePosition}
          onLetterSelect={handleLetterSelect}
          dwellTime={settings.dwellTime}
          isTracking={isTracking}
        />
      </div>

      {/* Settings Modal */}
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onSettingsChange={setSettings} />

      {/* Onboarding (first launch) */}
      <Onboarding />
    </div>
  );
}

export default App;
