import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Accent, Words } from './landingBits';

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

  const toggleAccordion = (id: string) => {
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
    <section id="faq" className="lp-section band band-mist">
      <div className="wrap faq-wrap">
        <div className="faq-side">
          <p className="kicker" data-reveal>FAQ</p>
          <h2 className="h2" data-words><Words>Questions,</Words> <Accent>answered.</Accent></h2>
          <p className="lede" data-reveal style={{ marginTop: 16 }}>
            Find answers about Sentinel’s passive scanner, AI companion limits, security rules, and prompt fixes.
          </p>
          <label className="search" data-reveal>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input
              type="search"
              placeholder="Search questions, findings, or limits"
              aria-label="Search FAQ questions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <div className="cats" data-reveal>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                aria-pressed={selectedCategory === cat.id}
                onClick={() => setSelectedCategory((prev) => (prev === cat.id ? null : cat.id))}
              >
                {cat.title} <small>{cat.count.split(' ')[0]}</small>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="faq-list">
            {filteredFaqs.map((item) => {
              const isOpen = openItemId === item.id;
              return (
                <div key={item.id} className={`qa${isOpen ? ' open' : ''}`}>
                  <button type="button" aria-expanded={isOpen} aria-controls={`${item.id}-answer`} onClick={() => toggleAccordion(item.id)}>
                    {item.question}
                    <span className="pm" aria-hidden="true">+</span>
                  </button>
                  <div className="ans" id={`${item.id}-answer`}><div><p>{item.answer}</p></div></div>
                </div>
              );
            })}
          </div>
          {filteredFaqs.length === 0 && <p className="faq-empty" style={{ display: 'block' }}>No questions match your search.</p>}
          <p className="faq-contact">
            Still have questions about your application’s security? <Link to="/contact">Contact the security team →</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
