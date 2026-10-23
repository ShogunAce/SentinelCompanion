import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './components';
import { UserHeaderMenu } from './UserHeaderMenu';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      setErrorMessage('Please provide a valid email and message.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message, targetEmail: 'coleslaysolutions@gmail.com' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit contact message.');
      }

      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred while sending your message. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* Header */}
      <header className="container public-header">
        <Link to="/" className="brand">
          <Icon name="shield" />
          <span>Sentinel</span>
          <span className="brand-dot">.</span>
        </Link>
        <nav className="desktop-nav">
          <Link to="/">Home</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact" style={{ fontWeight: 600, color: 'var(--blue)' }}>Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <UserHeaderMenu />
          <Link to="/workspace" className="header-workspace-link">Go to Workspace →</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main-content" className="container section" style={{ flex: 1, paddingBlock: '60px 100px' }}>
        <Link to="/" className="back-link" style={{ marginBottom: '30px' }}>
          <Icon name="arrow" />
          <span>Back to Home</span>
        </Link>

        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="section-kicker">GET IN TOUCH</div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Contact the Sentinel <em>security team</em>
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '40px', lineHeight: 1.6 }}>
            Have a question about passive scanning, custom rules, or security for your vibecoded app? Send a direct message to <strong>coleslaysolutions@gmail.com</strong> through the form below.
          </p>

          {status === 'success' ? (
            <div className="surface" style={{ padding: '40px 32px', textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#def7ec',
                  color: '#03543f',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <Icon name="check" className="icon" />
              </div>
              <h2 style={{ fontSize: '24px', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                Message Sent Successfully
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '28px', lineHeight: 1.6 }}>
                Thank you for reaching out. Your message has been routed to <strong>coleslaysolutions@gmail.com</strong> and our security engineering team will review it shortly.
              </p>
              <button
                className="button secondary"
                onClick={() => setStatus('idle')}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="surface p-5 sm:p-8">
              {errorMessage && (
                <div className="auth-error-banner" style={{ marginBottom: '20px' }}>
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
                <div className="auth-field">
                  <label htmlFor="contact-name">Your Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="contact-email">Email Address *</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="alex@yourdomain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-field" style={{ marginBottom: '20px' }}>
                <label htmlFor="contact-topic">Topic</label>
                <select
                  id="contact-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Scanner Finding Feedback">Scanner Finding Feedback</option>
                  <option value="Founding Access Request">Founding Access Request</option>
                  <option value="Custom Domain Verification">Custom Domain Verification</option>
                </select>
              </div>

              <div className="auth-field" style={{ marginBottom: '28px' }}>
                <label htmlFor="contact-message">Message *</label>
                <textarea
                  id="contact-message"
                  required
                  rows={6}
                  placeholder="Tell us about your app architecture or security inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    border: '1px solid #d4d7d7',
                    borderRadius: '5px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    lineHeight: '1.6',
                  }}
                />
              </div>

              <button
                type="submit"
                className="button"
                disabled={status === 'submitting'}
                style={{ width: '100%' }}
              >
                {status === 'submitting' ? (
                  <span>Sending message...</span>
                ) : (
                  <>
                    <Icon name="arrow" />
                    <span>Send Message to Security Team</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer container">
        <div className="brand">
          <Icon name="shield" />
          <span>Sentinel</span>
          <span className="brand-dot">.</span>
        </div>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/workspace">Workspace</Link>
        </nav>
        <p className="subtle">Direct contact email: coleslaysolutions@gmail.com</p>
      </footer>
    </div>
  );
}
