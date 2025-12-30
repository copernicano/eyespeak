import { useState, useCallback } from 'react';

export function useGroq() {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = useCallback(async (text, partialWord = '') => {
    const apiKey = import.meta.env.VITE_GROQ_KEY;
    if (!apiKey || text.length < 2) {
      setSuggestions([]);
      return [];
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{
            role: 'system',
            content: 'Suggerisci 4 parole in italiano. Rispondi SOLO con JSON array: ["parola1","parola2","parola3","parola4"]'
          }, {
            role: 'user',
            content: 'Frase: "' + text + '" ' + (partialWord ? 'Parziale: "' + partialWord + '"' : '')
          }],
          temperature: 0.3,
          max_tokens: 50
        })
      });
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '[]';
      const match = content.match(/[.*]/s);
      const parsed = match ? JSON.parse(match[0]) : [];
      setSuggestions(parsed.slice(0, 4));
      return parsed.slice(0, 4);
    } catch {
      setSuggestions([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { suggestions, isLoading, getSuggestions, clearSuggestions: () => setSuggestions([]) };
}
