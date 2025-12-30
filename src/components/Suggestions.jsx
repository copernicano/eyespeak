export function Suggestions({ suggestions, onSelect, isLoading, gazePosition, isTracking, dwellTime = 600 }) {
  if (isLoading) {
    return (
      <div className="flex gap-3 p-3 overflow-x-auto">
        {[1,2,3,4].map(i => (
          <div key={i} className="py-4 px-6 rounded-2xl animate-pulse min-w-[100px] h-14"
            style={{background:"rgba(51,65,85,0.5)"}} />
        ))}
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="p-4 text-center" style={{color:"rgba(148,163,184,0.5)"}}>
        <span className="text-sm">Inizia a scrivere per suggerimenti...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 p-3 overflow-x-auto">
      {suggestions.map((word, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(word)}
          className="py-4 px-6 rounded-2xl font-bold text-lg whitespace-nowrap transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, rgba(71,85,105,0.6) 0%, rgba(51,65,85,0.8) 100%)",
            color: "#fff",
            border: "2px solid rgba(100,116,139,0.3)",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            minWidth: "100px"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
            e.target.style.boxShadow = "0 8px 25px rgba(59,130,246,0.4)";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "linear-gradient(135deg, rgba(71,85,105,0.6) 0%, rgba(51,65,85,0.8) 100%)";
            e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
            e.target.style.transform = "scale(1)";
          }}
        >
          {word}
        </button>
      ))}
    </div>
  );
}
