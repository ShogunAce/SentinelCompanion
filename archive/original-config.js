// Sentinel configuration.
// Put your Google Gemini API key here (get one at https://aistudio.google.com/apikey).
// If left empty, people using Sentinel can paste a key in "AI settings" for their
// current visit only. Without any key, Sentinel still scans and grades, and uses its
// built-in plain-English explanations instead of AI-written ones.
window.SENTINEL_CONFIG = {
  geminiApiKey: "",
  // Tried in order; the first model your key can use is kept for the session.
  geminiModels: ["gemini-3-pro", "gemini-3-pro-preview", "gemini-2.5-pro"],
  // Public relays used by the "Scan URL" tab, tried in order. {url} is the encoded
  // address, {raw} the plain one. Free relays come and go; leave empty for the defaults.
  corsProxies: [],
};
