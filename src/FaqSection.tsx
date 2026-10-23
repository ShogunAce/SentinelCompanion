import { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from './components';

interface FaqItem {
  id: string;
  category: 'scanner' | 'companion' | 'plans' | 'security';
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'security',
    question: 'Why do vibecoded apps need Sentinel?',
    answer: 'Vibe coding tools generate functional code rapidly, but AI models frequently overlook security hardening: missing authentication checks, unvalidated inputs, open database permissions, and exposed API keys. Sentinel acts as your digital companion to audit your vibecoded app and provide instant fixes.',
  },
  {
    id: 'faq-2',
    category: 'plans',
    question: 'What happens when I run out of scans?',
    answer: 'When you reach your 3 fresh scans for the month on the Free plan, your previous report and companion chats remain completely accessible. You can review existing findings and fix prompts at any time. Fresh scan limits reset automatically on the 1st of next month.',
  },
  {
    id: 'faq-3',
    category: 'companion',
    question: 'Why is there a limit on companion messages?',
    answer: 'Each message sent to the companion triggers a real-time Gemini AI API call that costs real computing resources. The Free plan includes a 15 message monthly allowance so every builder gets AI guidance without unexpected fees.',
  },
  {
    id: 'faq-4',
    category: 'plans',
    question: 'Is Lifetime really lifetime?',
    answer: 'Lifetime means the life of the Sentinel product, backed by a strict 100 seat cap and fair-use limits. Need more companion capacity? Bring your own Gemini key support is coming soon.',
  },
  {
    id: 'faq-5',
    category: 'scanner',
    question: 'What cybersecurity and coding flaws does Sentinel look for?',
    answer: 'Sentinel checks for exposed API keys, broken client-side access rules, missing security headers, unsafe CORS policies, input sanitization gaps, and prompt injection vulnerabilities in AI workflows.',
  },
  {
    id: 'faq-6',
    category: 'companion',
    question: 'How do I fix a security flaw found by Sentinel?',
    answer: 'Sentinel translates every finding into plain-English context and generates copy-paste builder prompts. You simply paste the prompt into your AI builder (Cursor, Lovable, Bolt, v0, AI Studio) to apply the fix automatically.',
  },
  {
    id: 'faq-7',
    category: 'scanner',
    question: 'Is the passive scanner safe and polite?',
    answer: 'Yes. Sentinel strictly follows robots.txt, applies in-memory host pacing, avoids any intrusive probing or payload fuzzing, and enforces rigorous SSRF filters so private networks are never contacted.',
  },
  {
    id: 'faq-8',
    category: 'security',
    question: 'How does Sentinel protect secret keys and credentials?',
    answer: 'Sentinel scans compiled bundles for leaked service keys and tokens. Any identified secret strings are immediately redacted in reports and never stored or echoed back in full plaintext.',
  },
];

const CATEGORIES = [
  { id: 'scanner', title: 'Passive Scanner', count: '12 Articles', iconName: 'scope' as const },
  { id: 'companion', title: 'AI Companion', count: '18 Articles', iconName: 'shield' as const },
  { id: 'plans', title: 'Plans & Limits', count: '15 Articles', iconName: 'plan' as const },
  { id: 'security', title: 'Security Rules', count: '24 Articles', iconName: 'globe' as const },
];

export function FaqSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // One-at-a-time accordion: store currently open item ID (first item open by default)
  const [openItemId, setOpenItemId] = useState<string | null>('faq-1');
  
  // Section entrance animation state
  const [hasEntered, setHasEntered] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHasEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const toggleAccordion = (id: string) => {
    // Strict one-at-a-time accordion behavior: clicking open closes it; clicking another closes previous and opens new
    setOpenItemId((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQ_DATA.filter((item) => {
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="relative w-full bg-[#090909] text-white py-20 px-4 sm:px-6 md:px-10 overflow-hidden"
      style={{
        fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background radial cobalt glow & stepped atmospheric light bars */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[740px] h-[650px] rounded-full opacity-35 blur-[120px] transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle, #1e3a8a 0%, #172554 45%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Stepped vertical light bars matching dark theme layout */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-[380px] hidden sm:flex justify-between px-6 sm:px-16 opacity-20"
        aria-hidden="true"
      >
        <div className="flex gap-2 sm:gap-4 items-start">
          <div className="w-8 sm:w-14 h-[320px] bg-gradient-to-b from-[#254cc2] to-transparent rounded-b-lg" />
          <div className="w-8 sm:w-14 h-[260px] bg-gradient-to-b from-[#1e3a8a] to-transparent rounded-b-lg" />
          <div className="w-8 sm:w-14 h-[190px] bg-gradient-to-b from-[#1e3a8a] to-transparent rounded-b-lg" />
          <div className="w-8 sm:w-14 h-[130px] bg-gradient-to-b from-[#172554] to-transparent rounded-b-lg" />
        </div>
        <div className="flex gap-2 sm:gap-4 items-start">
          <div className="w-8 sm:w-14 h-[130px] bg-gradient-to-b from-[#172554] to-transparent rounded-b-lg" />
          <div className="w-8 sm:w-14 h-[190px] bg-gradient-to-b from-[#1e3a8a] to-transparent rounded-b-lg" />
          <div className="w-8 sm:w-14 h-[260px] bg-gradient-to-b from-[#1e3a8a] to-transparent rounded-b-lg" />
          <div className="w-8 sm:w-14 h-[320px] bg-gradient-to-b from-[#254cc2] to-transparent rounded-b-lg" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[1224px] mx-auto">
        {/* Hero Header with Entrance Animation */}
        <div
          className="text-center mb-10 sm:mb-16 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            opacity: hasEntered ? 1 : 0,
            transform: hasEntered ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <div
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full mb-5 sm:mb-6"
            style={{
              background: 'rgba(38, 75, 194, 0.16)',
              border: '1.2px solid rgba(79, 118, 246, 0.35)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span className="text-xs font-semibold tracking-wider text-[#93c5fd] uppercase">
              FAQ
            </span>
          </div>

          <h2
            className="text-white text-2xl xs:text-3xl sm:text-5xl font-bold tracking-tight mb-3 sm:mb-4"
            style={{ letterSpacing: '-0.035em' }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-white/80 text-xs sm:text-base max-w-[620px] mx-auto leading-relaxed px-2">
            Find answers to common questions about Sentinel’s passive scanner, AI companion limits, security rules, and prompt fixes.
          </p>
        </div>

        {/* Glass Search Bar with Refined Hover and Focus Animation */}
        <div
          className="max-w-[760px] mx-auto mb-8 sm:mb-14 transition-all duration-700 delay-100 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            opacity: hasEntered ? 1 : 0,
            transform: hasEntered ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <div
            className="group relative flex items-center w-full h-[52px] sm:h-[68px] rounded-full px-4 sm:px-6 transition-all duration-300"
            style={{
              background: searchQuery ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: searchQuery ? '1.5px solid #3b82f6' : '1.5px solid rgba(255, 255, 255, 0.12)',
              boxShadow: searchQuery
                ? '0 0 28px rgba(37, 99, 235, 0.3)'
                : '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Icon
              name="search"
              className="w-5 h-5 text-white/50 mr-4 flex-shrink-0 transition-colors duration-200 group-hover:text-blue-400"
            />
            <input
              type="text"
              className="w-full bg-transparent text-white placeholder-white/40 text-sm sm:text-base outline-none font-light"
              placeholder="Search for questions, findings, or limits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search FAQ questions"
            />
            {searchQuery && (
              <button
                type="button"
                className="text-xs text-white/60 hover:text-white px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 transition-all duration-150"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* 4 Category Pill Cards Grid with Staggered Entrance and Hover Physics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {CATEGORIES.map((cat, idx) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className="group relative flex items-center gap-4 p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
                style={{
                  background: isSelected ? 'rgba(38, 75, 194, 0.22)' : '#1B1B1B',
                  border: isSelected ? '1.5px solid #3b82f6' : '1px solid #282828',
                  boxShadow: isSelected
                    ? '0 12px 28px rgba(37, 99, 235, 0.25)'
                    : '0 4px 16px rgba(0, 0, 0, 0.3)',
                  opacity: hasEntered ? 1 : 0,
                  transform: hasEntered
                    ? isSelected
                      ? 'translateY(-2px)'
                      : undefined
                    : 'translateY(20px)',
                  transitionDelay: `${150 + idx * 60}ms`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{
                    background: isSelected ? '#1e3a8a' : '#232323',
                    color: isSelected ? '#93c5fd' : '#ffffff',
                    border: isSelected
                      ? '1px solid #3b82f6'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <Icon
                    name={cat.iconName}
                    className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                  />
                </div>
                <div>
                  <h3 className="text-white text-sm sm:text-base font-semibold group-hover:text-blue-400 transition-colors duration-200">
                    {cat.title}
                  </h3>
                  <span className="text-xs text-white/50">{cat.count}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Smooth One-at-a-Time Accordion Area */}
        <div
          className="flex flex-col gap-3 transition-all duration-700 delay-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            opacity: hasEntered ? 1 : 0,
            transform: hasEntered ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16 bg-[#121212] rounded-2xl border border-[#262626] p-8">
              <p className="text-white/70 text-base mb-4">No questions match your search query.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                className="button secondary small"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((item) => {
              const isOpen = openItemId === item.id;
              return (
                <div
                  key={item.id}
                  className="group rounded-2xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    background: isOpen ? '#141722' : '#131313',
                    border: isOpen
                      ? '1px solid rgba(59, 130, 246, 0.5)'
                      : '1px solid #222222',
                    boxShadow: isOpen
                      ? '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 16px rgba(37, 99, 235, 0.12)'
                      : '0 2px 8px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left transition-colors duration-200 hover:bg-white/[0.03] cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-white font-medium text-base sm:text-lg pr-4 leading-snug group-hover:text-blue-100 transition-colors duration-200">
                      {item.question}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,0.68,0,1.01)]"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        background: isOpen ? '#1e3a8a' : '#232323',
                        border: isOpen
                          ? '1px solid #3b82f6'
                          : '1px solid #2F2F2F',
                        color: isOpen ? '#93c5fd' : '#ffffff',
                      }}
                      aria-hidden="true"
                    >
                      <svg
                        className="w-4 h-4 transition-transform duration-200"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {/* Smooth one-at-a-time accordion animation with CSS grid-template-rows & opacity */}
                  <div
                    className="grid transition-all duration-350 ease-[cubic-bezier(0.22,0.68,0,1.01)]"
                    style={{
                      gridTemplateRows: isOpen ? '1fr' : '0fr',
                    }}
                  >
                    <div className="overflow-hidden">
                      <div
                        className="px-5 sm:px-6 pb-6 pt-2 text-white/80 text-sm sm:text-base leading-relaxed border-t border-[#222222]/80 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                        }}
                      >
                        {item.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Question Prompt */}
        <div className="mt-12 text-center text-sm text-white/60">
          <span>Still have questions about your application's security? </span>
          <a href="/contact" className="text-blue-400 hover:underline font-medium ml-1">
            Contact the security team
          </a>
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
