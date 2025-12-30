import { useState, useEffect, useCallback } from "react";
import { Camera } from "./components/Camera";
import { ZoneKeyboard } from "./components/ZoneKeyboard";
import { TextOutput } from "./components/TextOutput";
import { Suggestions } from "./components/Suggestions";
import { Settings } from "./components/Settings";
import { useEyeTracker } from "./hooks/useEyeTracker";
import { useGroq } from "./hooks/useGroq";

function App() {
  const [text, setText] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ dwellTime: 600, speakLetters: true, speakWords: true });
  
  const { isReady, isTracking, gazePosition, landmarks, error, initialize, startTracking, stopTracking } = useEyeTracker();
  const { suggestions, isLoading, getSuggestions } = useGroq();

  useEffect(() => {
    const saved = localStorage.getItem("eyespeak_settings");
    if (saved) { try { setSettings(prev => ({ ...prev, ...JSON.parse(saved) })); } catch {} }
  }, []);

  useEffect(() => {
    const words = text.trim().split(" ");
    const lastWord = words[words.length - 1] || "";
    if (text.length > 2) {
      const timer = setTimeout(() => getSuggestions(text, lastWord), 500);
      return () => clearTimeout(timer);
    }
  }, [text, getSuggestions]);

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
    <div className="h-full flex flex-col" style={{background:"linear-gradient(180deg, #0f172a 0%, #020617 100%)"}}>
      {/* Header compatto */}
      <header className="flex items-center justify-between p-3" style={{borderBottom:"1px solid rgba(71,85,105,0.3)"}}>
        <button onClick={() => setSettingsOpen(true)}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all"
          style={{background:"rgba(51,65,85,0.5)"}}>??</button>
        
        <div className="flex items-center gap-3">
          <button onClick={toggleTracking} disabled={!isReady}
            className="px-5 py-3 rounded-xl font-bold text-lg transition-all duration-200"
            style={{
              background: isTracking 
                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" 
                : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "#fff",
              opacity: isReady ? 1 : 0.5,
              boxShadow: isTracking ? "0 0 25px rgba(34,197,94,0.4)" : "0 4px 15px rgba(59,130,246,0.3)"
            }}>
            {isTracking ? "? Stop" : "? Avvia"}
          </button>
          <Camera onInit={initialize} landmarks={landmarks} isTracking={isTracking} />
        </div>
      </header>

      {/* Errore */}
      {error && (
        <div className="mx-3 mt-2 p-4 rounded-xl" style={{
          background:"rgba(239,68,68,0.15)",
          border:"1px solid rgba(239,68,68,0.3)",
          color:"#fca5a5"
        }}>{error}</div>
      )}

      {/* Messaggio */}
      <div className="p-3">
        <TextOutput text={text} onClear={() => setText("")} />
      </div>

      {/* Suggerimenti */}
      <div style={{borderTop:"1px solid rgba(71,85,105,0.2)",borderBottom:"1px solid rgba(71,85,105,0.2)"}}>
        <Suggestions suggestions={suggestions} onSelect={handleSuggestionSelect} isLoading={isLoading} />
      </div>

      {/* Tastiera - occupa tutto lo spazio rimanente */}
      <ZoneKeyboard gazePosition={gazePosition} onLetterSelect={handleLetterSelect} dwellTime={settings.dwellTime} isTracking={isTracking} />

      {/* Settings */}
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onSettingsChange={setSettings} />
    </div>
  );
}

export default App;
