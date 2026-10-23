import { useState, useEffect, useRef } from 'react';
import { useUsage } from './UsageContext';
import { Icon } from './components';

export function WaitlistModal() {
  const { isWaitlistOpen, closeWaitlistModal, waitlistPrefill } = useUsage();
  const [email, setEmail] = useState('');
  const [selectedPlanOption, setSelectedPlanOption] = useState('pro-monthly');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDialogElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (waitlistPrefill) {
      if (waitlistPrefill.planId === 'lifetime') {
        setSelectedPlanOption('lifetime');
      } else if (waitlistPrefill.period === 'annual') {
        setSelectedPlanOption('pro-annual');
      } else {
        setSelectedPlanOption('pro-monthly');
      }
    }
  }, [waitlistPrefill]);

  useEffect(() => {
    if (isWaitlistOpen && modalRef.current) {
      modalRef.current.showModal();
      setTimeout(() => emailInputRef.current?.focus(), 50);
    } else if (modalRef.current) {
      modalRef.current.close();
    }
  }, [isWaitlistOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWaitlistOpen) {
        closeWaitlistModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWaitlistOpen, closeWaitlistModal]);

  if (!isWaitlistOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    // TODO: POST waitlist payload to /api/waitlist endpoint when backend waitlist table is active
    console.log('Waitlist submission:', { email, planOption: selectedPlanOption, timestamp: new Date().toISOString() });

    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setEmail('');
    closeWaitlistModal();
  };

  return (
    <dialog
      ref={modalRef}
      className="waitlist-dialog"
      onClick={(e) => {
        if (e.target === modalRef.current) closeWaitlistModal();
      }}
      aria-labelledby="waitlist-title"
    >
      <div className="dialog-head">
        <div className="auth-brand">
          <Icon name="shield" />
          <span>Sentinel Founding Access</span>
        </div>
        <button
          className="icon-button"
          onClick={handleResetAndClose}
          aria-label="Close modal"
        >
          <Icon name="close" />
        </button>
      </div>

      {!isSubmitted ? (
        <div>
          <h2 id="waitlist-title" style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--ink)' }}>
            Join founding access
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.6 }}>
            Paid plans are in preview and opening soon. Leave your email to secure early access and lock in founding pricing. No payment or credit card is taken today.
          </p>

          {error && <div className="auth-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="waitlist-email">Work or Builder Email</label>
              <input
                ref={emailInputRef}
                id="waitlist-email"
                type="email"
                required
                placeholder="you@yourdomain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="waitlist-plan">Which plan are you interested in?</label>
              <select
                id="waitlist-plan"
                value={selectedPlanOption}
                onChange={(e) => setSelectedPlanOption(e.target.value)}
              >
                <option value="pro-monthly">Pro ($12 / month)</option>
                <option value="pro-annual">Pro Annual ($99 / year)</option>
                <option value="lifetime">Founding Lifetime ($149 one-time, 100 seats)</option>
              </select>
            </div>

            <button type="submit" className="button auth-submit-btn" style={{ marginTop: '12px' }}>
              Save my spot
            </button>
          </form>

          <p className="subtle" style={{ marginTop: '16px', textAlign: 'center' }}>
            Free tier remains active with 3 fresh scans and 15 companion messages per month.
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#def7ec',
              color: '#03543f',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="check" className="icon" />
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>You are on the list</h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.6 }}>
            No payment was taken. We will reach out at <strong>{email}</strong> as soon as founding spots open for your selected tier.
          </p>
          <button className="button" onClick={handleResetAndClose}>
            Done
          </button>
        </div>
      )}
    </dialog>
  );
}
