import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Dialog, Icon } from './components';

export interface FindingPayload {
  title: string;
  severity: 'critical' | 'warning' | 'minor' | 'clean';
  description: string;
  evidence: string;
}

interface ReportBreakdownModalProps {
  finding: FindingPayload;
  appUrl?: string;
  onClose: () => void;
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export function ReportBreakdownModal({ finding, appUrl = 'Target Vibecoded App', onClose, onOpenChatWithPrompt }: ReportBreakdownModalProps) {
  const { user } = useAuth();
  const [breakdown, setBreakdown] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function fetchBreakdown() {
      if (!user) {
        setError('Authentication required to generate Gemini security breakdown.');
        setLoading(false);
        return;
      }

      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/gemini/breakdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ finding, appUrl }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to generate security breakdown');
        }
        setBreakdown(data.breakdown);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred during breakdown generation.');
      } finally {
        setLoading(false);
      }
    }

    fetchBreakdown();
  }, [finding, appUrl, user]);

  const extractPromptFix = (text: string) => {
    const match = text.match(/Prompt[:\s]*```?([^\n]*\n)?([\s\S]*?)```?/i) || text.match(/5\.\s*\*\*Ready-to-use AI Prompt\*\*[:\s]*([\s\S]*)/i);
    if (match && match[2]) return match[2].trim();
    if (match && match[1]) return match[1].trim();
    return text.slice(text.lastIndexOf('**Ready-to-use AI Prompt**')).replace(/\*\*Ready-to-use AI Prompt\*\*/g, '').trim();
  };

  const copyFixPrompt = () => {
    const fixText = extractPromptFix(breakdown);
    navigator.clipboard.writeText(fixText || breakdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog title={`Gemini Breakdown: ${finding.title}`} onClose={onClose}>
      <div className="breakdown-modal-content">
        <div className={`finding-severity-badge ${finding.severity}`}>
          <Icon name="shield" />
          <span>{finding.severity.toUpperCase()} SEVERITY</span>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <span className="empty-icon"><Icon name="shield" /></span>
            <h3>Gemini is analyzing finding...</h3>
            <p>Deconstructing attack vector, business impact, and generating targeted AI builder prompt.</p>
          </div>
        ) : error ? (
          <div className="auth-error-banner">{error}</div>
        ) : (
          <div className="breakdown-body">
            <div className="breakdown-text-display">
              {breakdown.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="breakdown-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="breakdown-actions-bar">
              <button className="button" onClick={copyFixPrompt}>
                {copied ? 'Prompt Fix Copied!' : 'Copy Fix Prompt for AI Builder'}
                <Icon name="plan" />
              </button>

              {onOpenChatWithPrompt && (
                <button
                  className="button secondary"
                  onClick={() => {
                    onClose();
                    onOpenChatWithPrompt(`I'd like to discuss the "${finding.title}" finding further with Sentinel.`);
                  }}
                >
                  Discuss with AI Companion
                  <Icon name="arrow" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
