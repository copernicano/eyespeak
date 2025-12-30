import { useState, useEffect } from "react";

const ONBOARDING_KEY = "eyespeak_onboarding_completed";
const DISCLAIMER_KEY = "eyespeak_disclaimer_accepted";

export function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0); // 0 = disclaimer, 1+ = instructions
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    const disclaimerDone = localStorage.getItem(DISCLAIMER_KEY);

    if (!completed || !disclaimerDone) {
      setShowOnboarding(true);
      setStep(disclaimerDone ? 1 : 0);
    }
  }, []);

  const acceptDisclaimer = () => {
    if (!disclaimerAccepted) return;
    localStorage.setItem(DISCLAIMER_KEY, "true");
    setStep(1);
  };

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
    onComplete?.();
  };

  if (!showOnboarding) return null;

  // Step 0: Disclaimer
  if (step === 0) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(2, 6, 23, 0.98)" }}
      >
        <div
          className="w-full max-w-lg rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)",
            border: "2px solid rgba(239, 68, 68, 0.3)",
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.8)"
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">⚠️</span>
            <h2 className="text-2xl font-bold text-white">Avviso Importante</h2>
          </div>

          {/* Disclaimer text */}
          <div
            className="p-4 rounded-xl mb-6 text-white/80 text-sm leading-relaxed"
            style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
          >
            <p className="mb-4">
              <strong>EyeSpeak</strong> è uno <strong>strumento sperimentale</strong> di comunicazione assistita.
            </p>
            <p className="mb-4">
              <strong>NON</strong> è un dispositivo medico certificato. L'accuratezza del rilevamento oculare dipende da:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-1">
              <li>Condizioni di illuminazione</li>
              <li>Posizionamento del dispositivo</li>
              <li>Caratteristiche individuali dell'utente</li>
            </ul>
            <p>
              <strong>Consultare sempre professionisti sanitari</strong> per le esigenze di comunicazione assistita.
            </p>
          </div>

          {/* Checkbox */}
          <label className="flex items-center gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              className="w-6 h-6 rounded accent-amber-500"
            />
            <span className="text-white text-lg">Ho letto e compreso</span>
          </label>

          {/* Accept button */}
          <button
            onClick={acceptDisclaimer}
            disabled={!disclaimerAccepted}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all"
            style={{
              background: disclaimerAccepted
                ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                : "rgba(71, 85, 105, 0.5)",
              color: disclaimerAccepted ? "#fff" : "rgba(148, 163, 184, 0.5)",
              boxShadow: disclaimerAccepted ? "0 8px 25px rgba(245, 158, 11, 0.3)" : "none"
            }}
          >
            Accetto e Continuo
          </button>
        </div>
      </div>
    );
  }

  // Instructions steps
  const instructions = [
    {
      icon: "📱",
      title: "Posizionamento",
      content: "Posiziona il dispositivo a 30-50cm dal viso dell'utente, con la fotocamera frontale rivolta verso di lui."
    },
    {
      icon: "💡",
      title: "Illuminazione",
      content: "Assicurati di avere una buona illuminazione FRONTALE. Evita controluce e fonti di luce dietro l'utente."
    },
    {
      icon: "👁️",
      title: "Come Funziona",
      content: "L'utente guarda una delle 4 zone colorate. Dopo poco la zona si espande mostrando le lettere. Guardando una lettera per il tempo necessario, viene selezionata."
    },
    {
      icon: "⏱️",
      title: "Tempo di Selezione",
      content: "Il tempo di attesa (dwell time) è regolabile nelle impostazioni. Se l'utente fa fatica, aumentalo. Il default è 1.2 secondi."
    },
    {
      icon: "🔧",
      title: "Se Non Funziona",
      content: "Controlla l'illuminazione, avvicina/allontana il dispositivo, prova a regolare il tempo di selezione nelle impostazioni (icona ⚙️)."
    }
  ];

  const currentInstruction = instructions[step - 1];
  const isLastStep = step >= instructions.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(2, 6, 23, 0.98)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)",
          border: "2px solid rgba(71, 85, 105, 0.4)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.8)"
        }}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {instructions.map((_, idx) => (
            <div
              key={idx}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: idx < step ? "#f59e0b" : idx === step - 1 ? "#f59e0b" : "rgba(71, 85, 105, 0.5)",
                transform: idx === step - 1 ? "scale(1.5)" : "scale(1)"
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="text-center mb-4">
          <span className="text-6xl">{currentInstruction?.icon || "✅"}</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          {isLastStep ? "Tutto Pronto!" : currentInstruction?.title}
        </h2>

        {/* Content */}
        <p className="text-white/80 text-center text-lg leading-relaxed mb-8">
          {isLastStep
            ? "Ora puoi iniziare a usare EyeSpeak. Premi il pulsante Avvia per attivare il tracciamento oculare."
            : currentInstruction?.content}
        </p>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 rounded-xl font-bold text-lg"
              style={{ background: "rgba(71, 85, 105, 0.4)", color: "#fff" }}
            >
              ← Indietro
            </button>
          )}
          <button
            onClick={() => (isLastStep ? completeOnboarding() : setStep(step + 1))}
            className="flex-1 py-4 rounded-xl font-bold text-lg transition-all"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "#fff",
              boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)"
            }}
          >
            {isLastStep ? "Inizia!" : "Avanti →"}
          </button>
        </div>

        {/* Skip */}
        {!isLastStep && (
          <button
            onClick={completeOnboarding}
            className="w-full mt-4 py-2 text-white/40 text-sm"
          >
            Salta introduzione
          </button>
        )}
      </div>
    </div>
  );
}
