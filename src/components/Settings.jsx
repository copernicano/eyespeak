import { useState, useEffect } from "react";

const DEFAULT_SETTINGS = {
  dwellTime: 600,
  speakLetters: true,
  speakWords: true,
  smoothing: 0.3
};

export function Settings({ isOpen, onClose, onSettingsChange }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem("eyespeak_settings");
    if (saved) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }); } catch {}
    }
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("eyespeak_settings", JSON.stringify(newSettings));
    onSettingsChange(newSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)"}}>
      <div className="w-full max-w-md rounded-3xl p-6" style={{
        background:"linear-gradient(135deg, rgba(30,41,59,0.98) 0%, rgba(15,23,42,0.99) 100%)",
        border:"2px solid rgba(71,85,105,0.4)",
        boxShadow:"0 25px 80px rgba(0,0,0,0.6)"
      }}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Impostazioni</h2>
          <button onClick={onClose} className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors"
            style={{background:"rgba(71,85,105,0.3)",color:"#fff"}}>?</button>
        </div>
        
        <div className="space-y-8">
          <div>
            <label className="text-white text-xl block mb-4 font-medium">
              Tempo selezione: <span style={{color:"#f59e0b"}}>{settings.dwellTime}ms</span>
            </label>
            <input type="range" min="400" max="1200" step="100" value={settings.dwellTime}
              onChange={(e) => updateSetting("dwellTime", Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{background:"linear-gradient(90deg, #f59e0b 0%, #334155 100%)"}} />
            <div className="flex justify-between text-sm text-white/40 mt-2">
              <span>Veloce (400ms)</span><span>Lento (1200ms)</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-4" style={{borderTop:"1px solid rgba(71,85,105,0.3)"}}>
            <label className="text-white text-xl font-medium">Pronuncia lettere</label>
            <button onClick={() => updateSetting("speakLetters", !settings.speakLetters)}
              className="w-16 h-9 rounded-full transition-all duration-200 relative"
              style={{background: settings.speakLetters ? "#22c55e" : "rgba(71,85,105,0.5)"}}>
              <div className="w-7 h-7 bg-white rounded-full absolute top-1 transition-all duration-200"
                style={{left: settings.speakLetters ? "calc(100% - 32px)" : "4px"}} />
            </button>
          </div>

          <div className="flex items-center justify-between py-4" style={{borderTop:"1px solid rgba(71,85,105,0.3)"}}>
            <label className="text-white text-xl font-medium">Pronuncia parole</label>
            <button onClick={() => updateSetting("speakWords", !settings.speakWords)}
              className="w-16 h-9 rounded-full transition-all duration-200 relative"
              style={{background: settings.speakWords ? "#22c55e" : "rgba(71,85,105,0.5)"}}>
              <div className="w-7 h-7 bg-white rounded-full absolute top-1 transition-all duration-200"
                style={{left: settings.speakWords ? "calc(100% - 32px)" : "4px"}} />
            </button>
          </div>
        </div>

        <button onClick={onClose}
          className="mt-10 w-full py-5 rounded-2xl text-xl font-bold transition-all duration-200"
          style={{background:"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",color:"#fff",boxShadow:"0 8px 25px rgba(59,130,246,0.4)"}}>
          Chiudi
        </button>
      </div>
    </div>
  );
}
