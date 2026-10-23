import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useUsage } from './UsageContext';
import { logUserActivity } from './firebase';
import { companionEvents, type CompanionFinding } from './companionState';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  finding?: CompanionFinding;
}

const STORAGE_KEY = 'sentinel_pip_pos_v2';
const BUBBLE_SIZE = 68;
const WINDOW_WIDTH = 360;
const WINDOW_HEIGHT = 520;
const MARGIN = 20;

export function DraggableCompanionWidget() {
  const { user } = useAuth();
  const { canMessage, recordMessage } = useUsage();

  // Widget visibility and expansion
  const [isOpen, setIsOpen] = useState(false);
  const [activeFinding, setActiveFinding] = useState<CompanionFinding | null>(null);

  // Helper to compute default bottom-right coordinates
  const getBottomRightPos = useCallback((expanded: boolean) => {
    if (typeof window === 'undefined') return { x: 20, y: 100 };
    const w = expanded ? WINDOW_WIDTH : BUBBLE_SIZE;
    const h = expanded ? WINDOW_HEIGHT : BUBBLE_SIZE;
    return {
      x: Math.max(12, window.innerWidth - w - MARGIN),
      y: Math.max(12, window.innerHeight - h - MARGIN),
    };
  }, []);

  // Position state (initializes to bottom-right or saved coordinates)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            const maxX = Math.max(12, window.innerWidth - BUBBLE_SIZE - 12);
            const maxY = Math.max(12, window.innerHeight - BUBBLE_SIZE - 12);
            return {
              x: Math.min(Math.max(12, parsed.x), maxX),
              y: Math.min(Math.max(12, parsed.y), maxY),
            };
          }
        }
      } catch {
        // fallback
      }
      return {
        x: Math.max(12, window.innerWidth - BUBBLE_SIZE - MARGIN),
        y: Math.max(12, window.innerHeight - BUBBLE_SIZE - MARGIN),
      };
    }
    return { x: 20, y: 100 };
  });

  // Dragging tracking refs
  const isDraggingRef = useRef(false);
  const dragStartClient = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-pip',
      role: 'assistant',
      content: `Hi! I'm Pip, your digital cybersecurity companion for vibecoded apps. Drag me anywhere on your screen. Ask me about vulnerabilities, response headers, CORS, or click "Break down with Pip" on any finding to get exact prompt fixes for your AI builder.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // When expanding or closing, adjust position so window does not clip off-screen
  useEffect(() => {
    setPosition((prev) => {
      const w = isOpen ? WINDOW_WIDTH : BUBBLE_SIZE;
      const h = isOpen ? WINDOW_HEIGHT : BUBBLE_SIZE;
      const maxX = Math.max(12, window.innerWidth - w - 12);
      const maxY = Math.max(12, window.innerHeight - h - 12);

      // If expanding and was placed on the right edge, shift x so entire window is visible
      let newX = prev.x;
      let newY = prev.y;

      if (isOpen && prev.x + WINDOW_WIDTH > window.innerWidth - 12) {
        newX = Math.max(12, window.innerWidth - WINDOW_WIDTH - MARGIN);
      } else {
        newX = Math.min(Math.max(12, prev.x), maxX);
      }

      if (isOpen && prev.y + WINDOW_HEIGHT > window.innerHeight - 12) {
        newY = Math.max(12, window.innerHeight - WINDOW_HEIGHT - MARGIN);
      } else {
        newY = Math.min(Math.max(12, prev.y), maxY);
      }

      return { x: newX, y: newY };
    });
  }, [isOpen]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const w = isOpen ? WINDOW_WIDTH : BUBBLE_SIZE;
        const h = isOpen ? WINDOW_HEIGHT : BUBBLE_SIZE;
        const maxX = Math.max(12, window.innerWidth - w - 12);
        const maxY = Math.max(12, window.innerHeight - h - 12);
        return {
          x: Math.min(Math.max(12, prev.x), maxX),
          y: Math.min(Math.max(12, prev.y), maxY),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Listen to breakdown events triggered from reports
  useEffect(() => {
    const unsubscribe = companionEvents.onFinding(async (finding) => {
      setActiveFinding(finding);
      setIsOpen(true);

      const findingMsg: ChatMessage = {
        id: `finding-${Date.now()}`,
        role: 'user',
        content: `Break down security finding: "${finding.title}" (${finding.severity.toUpperCase()})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        finding,
      };

      setMessages((prev) => [...prev, findingMsg]);
      setLoading(true);
      setError('');

      try {
        let reply = '';
        if (user) {
          const idToken = await user.getIdToken();
          const res = await fetch('/api/gemini/breakdown', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              finding: {
                title: finding.title,
                severity: finding.severity,
                description: finding.description,
                evidence: finding.evidence || finding.action || '',
              },
              appUrl: finding.appUrl || 'Target Vibecoded App',
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to generate breakdown');
          reply = data.breakdown;
        } else {
          reply = `### Plain English Breakdown: ${finding.title}\n\n**Severity:** ${finding.severity.toUpperCase()}\n\n**What this means:**\n${finding.description}\n\n**Recommended Fix:**\n${finding.action || 'Apply defense-in-depth security controls.'}\n\n**Prompt for Pip to fix in your AI editor:**\n\`\`\`\nFix the security flaw "${finding.title}". ${finding.description}. Ensure all inputs are validated, rate limits and defensive headers are strictly applied.\n\`\`\``;
        }

        const assistantMsg: ChatMessage = {
          id: `breakdown-${Date.now()}`,
          role: 'assistant',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (user) {
          await logUserActivity('companion_breakdown_viewed', { title: finding.title, severity: finding.severity });
        }
      } catch (err: any) {
        setError(err.message || 'Could not fetch breakdown. Please try again.');
      } finally {
        setLoading(false);
      }
    });

    const unsubscribeToggle = companionEvents.onToggle((open) => {
      setIsOpen(open);
    });

    return () => {
      unsubscribe();
      unsubscribeToggle();
    };
  }, [user]);

  // Dedicated drag start handler (used by bubble or expanded header)
  const startDrag = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    // Do not initiate drag on interactive elements
    if (target.closest('button') || target.closest('select') || target.closest('input') || target.closest('a')) {
      return;
    }

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartClient.current = { x: e.clientX, y: e.clientY };
    dragStartPos.current = { ...position };

    const elem = e.currentTarget as HTMLElement;
    try {
      elem.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartClient.current.x;
    const dy = e.clientY - dragStartClient.current.y;

    if (Math.hypot(dx, dy) > 5) {
      hasMovedRef.current = true;
    }

    const w = isOpen ? WINDOW_WIDTH : BUBBLE_SIZE;
    const h = isOpen ? WINDOW_HEIGHT : BUBBLE_SIZE;
    const maxX = Math.max(12, window.innerWidth - w - 12);
    const maxY = Math.max(12, window.innerHeight - h - 12);

    const targetX = Math.min(Math.max(12, dragStartPos.current.x + dx), maxX);
    const targetY = Math.min(Math.max(12, dragStartPos.current.y + dy), maxY);

    setPosition({ x: targetX, y: targetY });
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const elem = e.currentTarget as HTMLElement;
    try {
      elem.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (hasMovedRef.current) {
      // Persist moved position
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      } catch {
        // ignore
      }
    } else {
      // If it was just a tap on the collapsed bubble, toggle open
      if (!isOpen) {
        setIsOpen(true);
      }
    }
  };

  // Send message in chat
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    if (!user) {
      setError('Please sign in to chat with Pip.');
      return;
    }

    if (!canMessage()) {
      setError('Daily AI companion query limit reached for your current plan.');
      return;
    }

    const userText = input.trim();
    setInput('');
    setError('');

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const idToken = await user.getIdToken();
      const payloadMessages = [...messages, newMsg].map((m) => ({
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
          systemInstruction: `You are Pip, the friendly and hyper-capable digital cybersecurity companion for vibecoded apps. You specialize in analyzing applications built with AI code editors (Cursor, Bolt, Lovable, v0, Replit). You translate cybersecurity vulnerabilities, leaked keys, missing headers, and CORS flaws into plain English and generate exact, paste-ready prompts for the builder's AI editor. Keep advice practical, reassuring, and precise.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get answer from Pip');

      const botReply: ChatMessage = {
        id: `pip-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
      recordMessage();
      await logUserActivity('pip_companion_chat', { promptPreview: userText.slice(0, 100), model });
    } catch (err: any) {
      setError(err.message || 'Could not communicate with Pip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const resetToBottomRight = () => {
    const br = getBottomRightPos(isOpen);
    setPosition(br);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Chat widget should ONLY render when a user is signed in
  if (!user) {
    return null;
  }

  return (
    <div
      className="draggable-companion-root"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 99999,
        pointerEvents: 'auto',
      }}
      aria-label="Pip Cybersecurity Companion"
    >
      {!isOpen ? (
        /* Collapsed Floating Robot Avatar Button */
        <button
          type="button"
          className="companion-bubble-btn"
          aria-label="Open Pip Cybersecurity Companion"
          title="Drag Pip anywhere • Click to chat"
          onPointerDown={startDrag}
          onPointerMove={onDragMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{ touchAction: 'none' }}
        >
          <div className="companion-avatar-glow" />
          <img
            src="/sentinel-bot-512.webp"
            alt="Pip Robot Companion"
            className="companion-mini-robot"
            draggable={false}
          />
          <span className="companion-badge-pulse" />
          <span className="companion-drag-tooltip">Pip • Drag me</span>
        </button>
      ) : (
        /* Expanded Floating Draggable Window */
        <div className="companion-window glass-elevated">
          {/* Draggable Header (ONLY header triggers window dragging) */}
          <div
            className="companion-header"
            onPointerDown={startDrag}
            onPointerMove={onDragMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{ touchAction: 'none' }}
          >
            <div className="companion-header-info">
              <img
                src="/sentinel-bot-512.webp"
                alt="Pip"
                className="companion-header-robot"
                draggable={false}
              />
              <div>
                <div className="companion-title">
                  <span>Pip Companion</span>
                  <span className="companion-status-dot" />
                </div>
                <div className="companion-subtitle">Drag header to reposition</div>
              </div>
            </div>

            <div className="companion-header-actions">
              <select
                className="companion-model-select"
                value={model}
                onChange={(e) => setModel(e.target.value as any)}
                aria-label="Select AI Model"
              >
                <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
                <option value="gemini-4-argon">Gemini 4 Argon</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Lite</option>
              </select>

              <button
                type="button"
                className="companion-icon-btn"
                onClick={resetToBottomRight}
                title="Reset Pip to bottom right"
                aria-label="Snap to bottom right"
              >
                ↘
              </button>

              <button
                type="button"
                className="companion-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize Pip"
                aria-label="Minimize Pip"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Active Finding Banner if triggered */}
          {activeFinding && (
            <div className={`companion-finding-bar ${activeFinding.severity}`}>
              <div className="companion-finding-title">
                <span className="companion-finding-tag">{activeFinding.severity.toUpperCase()}</span>
                <span className="truncate">{activeFinding.title}</span>
              </div>
              <button
                type="button"
                className="companion-finding-dismiss"
                onClick={() => setActiveFinding(null)}
                title="Clear finding focus"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Messages Scroll Area (normal scrolling and text selection) */}
          <div className="companion-messages-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`companion-msg ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <img
                    src="/sentinel-bot-512.webp"
                    alt="Pip"
                    className="msg-robot-avatar"
                    draggable={false}
                  />
                )}
                <div className="msg-content-wrapper">
                  <div className="msg-bubble">
                    {msg.content.split('\n\n').map((para, i) => {
                      if (para.startsWith('```')) {
                        const cleanCode = para.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
                        return (
                          <div key={i} className="msg-code-block">
                            <pre><code>{cleanCode}</code></pre>
                            <button
                              type="button"
                              className="code-copy-btn"
                              onClick={() => copyPrompt(cleanCode, `${msg.id}-${i}`)}
                            >
                              {copiedId === `${msg.id}-${i}` ? '✓ Copied' : 'Copy Prompt'}
                            </button>
                          </div>
                        );
                      }
                      return <p key={i}>{para}</p>;
                    })}
                  </div>
                  <span className="msg-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="companion-msg assistant">
                <img
                  src="/sentinel-bot-512.webp"
                  alt="Pip"
                  className="msg-robot-avatar spin-pulse"
                  draggable={false}
                />
                <div className="msg-content-wrapper">
                  <div className="msg-bubble thinking-bubble">
                    <span>Pip is reasoning with {model}</span>
                    <span className="typing-dots">
                      <i>.</i><i>.</i><i>.</i>
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {error && <div className="companion-error-strip">{error}</div>}

          {/* Prompt Form */}
          <form onSubmit={handleSendMessage} className="companion-input-tray">
            <input
              type="text"
              placeholder="Ask Pip anything about your app's security..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="companion-input"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="companion-send-btn"
              title="Send to Pip"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
