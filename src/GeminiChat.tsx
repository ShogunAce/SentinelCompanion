import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { logUserActivity } from './firebase';
import { Icon } from './components';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface GeminiChatProps {
  initialPrompt?: string;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export function GeminiChat({ initialPrompt = '', onClose, isEmbedded = false }: GeminiChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello ${user?.displayName || 'Builder'}! I'm Sentinel, your AI digital security companion. How can I help audit or harden your vibecoded app today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    if (!user) {
      setError('You must be signed in to talk to the Sentinel AI Companion.');
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setError('');
    setLoading(true);

    try {
      const idToken = await user.getIdToken();
      const payloadMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          messages: payloadMessages,
          model,
          systemInstruction: `You are Sentinel, a digital security companion specializing in vibecoded apps. You help builders understand cybersecurity vulnerabilities, API leaks, authentication gaps, and logic flaws in AI-generated code. Speak with clarity, encouragement, and plain English. Provide copy-paste fix prompts for AI builders (Cursor, Lovable, Bolt, v0, AI Studio) whenever requested.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to communicate with Sentinel AI');
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: model,
      };

      setMessages((prev) => [...prev, botMsg]);
      await logUserActivity('companion_query', {
        promptPreview: textToSend.slice(0, 100),
        model
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while talking to Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Analyze common flaws in vibecoded apps',
    'How do I protect client API keys in Vite?',
    'Generate a Cursor prompt to fix CORS errors',
    'Explain prompt injection vulnerabilities',
  ];

  return (
    <div className={`gemini-chat-container ${isEmbedded ? 'embedded' : 'drawer'}`}>
      <div className="chat-header">
        <div className="chat-title">
          <Icon name="shield" />
          <div>
            <h3>Sentinel AI Companion</h3>
            <span className="subtle">Powered by Gemini for Vibecoded Apps</span>
          </div>
        </div>

        <div className="chat-header-actions">
          <select
            className="model-select"
            value={model}
            onChange={(e: any) => setModel(e.target.value)}
            title="Select Gemini Model"
          >
            <option value="gemini-3.8-flash">Gemini 3.8 Flash (Balanced)</option>
            <option value="gemini-4-argon">Gemini 4 Argon (Deep Reasoning)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Lite (Fast)</option>
          </select>

          {onClose && (
            <button className="icon-button" onClick={onClose} aria-label="Close Chat">
              <Icon name="close" />
            </button>
          )}
        </div>
      </div>

      {error && <div className="chat-error-banner">{error}</div>}

      <div className="chat-thread">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble-wrapper ${m.role}`}>
            <div className="chat-avatar">
              {m.role === 'assistant' ? <Icon name="shield" /> : <span>You</span>}
            </div>
            <div className="chat-bubble">
              <div className="chat-bubble-header">
                <span className="chat-sender">{m.role === 'assistant' ? 'Sentinel Companion' : 'You'}</span>
                <span className="chat-time">{m.timestamp}</span>
              </div>
              <div className="chat-text">{m.content}</div>
              {m.modelUsed && <span className="model-tag">{m.modelUsed}</span>}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-bubble-wrapper assistant loading">
            <div className="chat-avatar"><Icon name="shield" /></div>
            <div className="chat-bubble">
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
              <span className="subtle" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Analyzing with {model}...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="quick-prompts-bar">
        {quickPrompts.map((p) => (
          <button
            key={p}
            className="quick-prompt-chip"
            onClick={() => handleSend(p)}
            disabled={loading}
          >
            {p}
          </button>
        ))}
      </div>

      <form
        className="chat-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          placeholder="Ask Sentinel about cybersecurity, findings, or prompt fixes..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button className="button small" type="submit" disabled={!input.trim() || loading}>
          Send
          <Icon name="arrow" />
        </button>
      </form>
    </div>
  );
}
