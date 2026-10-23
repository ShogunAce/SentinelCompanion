import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchActivityLogs, fetchAllUsersForAdmin, type ActivityLog, type UserProfile } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Icon } from './components';

const ADMIN_EMAILS = ['coleslaysolutions@gmail.com', 'coleduane96@gmail.com'];

export function AdminPanel() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userScansMap, setUserScansMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activity' | 'users' | 'security'>('activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const loadAdminData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [fetchedLogs, fetchedUsers] = await Promise.all([
        fetchActivityLogs(100),
        fetchAllUsersForAdmin(),
      ]);
      setLogs(fetchedLogs || []);
      setUsersList(fetchedUsers || []);

      // Fetch scan counts per user if permission allows
      const scansData: Record<string, any[]> = {};
      await Promise.all(
        (fetchedUsers || []).map(async (u) => {
          try {
            const scansSnap = await getDocs(collection(db, 'users', u.uid, 'scans'));
            scansData[u.uid] = scansSnap.docs.map(doc => doc.data());
          } catch {
            scansData[u.uid] = [];
          }
        })
      );
      setUserScansMap(scansData);
    } catch (err) {
      console.error("Error loading admin telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  if (!isAdmin) {
    return (
      <main className="not-found" id="main-content" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#f87171' }}>404 — Access Restricted</h1>
        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
          This route does not exist or you lack authorization to view this nexus.
        </p>
        <a className="button" href="/workspace" style={{ display: 'inline-block' }}>
          Back to Workspace
        </a>
      </main>
    );
  }

  const filteredLogs = logs.filter(log =>
    log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = usersList.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.uid.includes(searchQuery)
  );

  const totalScansCount = Object.values(userScansMap).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="workspace-container" style={{ padding: '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.95), rgba(9, 9, 11, 0.98))',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}>
              Restricted Admin Nexus
            </span>
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              Route: <code style={{ color: '#f87171', background: 'rgba(0,0,0,0.4)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>/ops-nexus-903f</code>
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#f9fafb' }}>
            Sentinel Security Operations Command
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#9ca3af', fontSize: '0.9rem' }}>
            Active Admin Session: <strong style={{ color: '#60a5fa' }}>{user.email}</strong> • Anti-IDOR & Role Isolation Active
          </p>
        </div>

        <button
          onClick={loadAdminData}
          disabled={loading}
          style={{
            background: '#27272a',
            color: '#f3f4f6',
            border: '1px solid #3f3f46',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          <Icon name="arrow" />
          {loading ? 'Syncing Telemetry...' : 'Refresh Activity'}
        </button>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Registered Builders
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
            {usersList.length}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Authenticated via Firebase Auth
          </div>
        </div>

        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Total Security Scans
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a855f7', marginTop: '0.25rem' }}>
            {totalScansCount}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Executed via In-Process Polite Scanner
          </div>
        </div>

        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            User Event Logs
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4ade80', marginTop: '0.25rem' }}>
            {logs.length}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Stored in `/activity_logs`
          </div>
        </div>

        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Privilege Model
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#facc15', marginTop: '0.5rem' }}>
            Zero-Trust IDOR Shield
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Default Deny Rules Active
          </div>
        </div>
      </div>

      {/* Tab Controls & Search Filter */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #27272a',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('activity')}
            style={{
              background: activeTab === 'activity' ? '#ef4444' : '#18181b',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Live Activity Stream ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              background: activeTab === 'users' ? '#ef4444' : '#18181b',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            User Directory ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              background: activeTab === 'security' ? '#ef4444' : '#18181b',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Security Hardening Status
          </button>
        </div>

        <input
          type="text"
          placeholder="Filter by email, action, or UID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: '#18181b',
            border: '1px solid #3f3f46',
            color: '#f9fafb',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            minWidth: '260px'
          }}
        />
      </div>

      {/* TAB 1: Live Activity Stream */}
      {activeTab === 'activity' && (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#27272a', color: '#9ca3af', borderBottom: '1px solid #3f3f46' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem' }}>User Email</th>
                <th style={{ padding: '0.85rem 1rem' }}>Event Action</th>
                <th style={{ padding: '0.85rem 1rem' }}>Action Metadata</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    {loading ? 'Loading user activity logs...' : 'No activity logs found yet. Logs will populate as users sign up and run scans.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.logId} style={{ borderBottom: '1px solid #27272a', color: '#e5e7eb' }}>
                    <td style={{ padding: '0.85rem 1rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#60a5fa' }}>
                      {log.userEmail}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        background: log.action.includes('scan') ? 'rgba(168, 85, 247, 0.2)' :
                                    log.action.includes('signup') ? 'rgba(74, 222, 128, 0.2)' :
                                    log.action.includes('companion') ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: log.action.includes('scan') ? '#c084fc' :
                               log.action.includes('signup') ? '#4ade80' :
                               log.action.includes('companion') ? '#38bdf8' : '#e5e7eb',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#d1d5db', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: User Directory */}
      {activeTab === 'users' && (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#27272a', color: '#9ca3af', borderBottom: '1px solid #3f3f46' }}>
                <th style={{ padding: '0.85rem 1rem' }}>User</th>
                <th style={{ padding: '0.85rem 1rem' }}>Firebase UID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Assigned Role</th>
                <th style={{ padding: '0.85rem 1rem' }}>Registration Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Total Scans</th>
                <th style={{ padding: '0.85rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    {loading ? 'Fetching registered users...' : 'No users found matching query.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const scans = userScansMap[u.uid] || [];
                  return (
                    <tr key={u.uid} style={{ borderBottom: '1px solid #27272a', color: '#e5e7eb' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{u.displayName || 'Vibe Builder'}</div>
                        <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#9ca3af' }}>
                        {u.uid}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {u.role || 'builder'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#9ca3af' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#a855f7' }}>
                        {scans.length}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <button
                          onClick={() => setSelectedUser(u)}
                          style={{
                            background: '#27272a',
                            color: '#38bdf8',
                            border: '1px solid #3f3f46',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Inspect Scans
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Security Hardening Status */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#f3f4f6' }}>
              🛡️ Active Hardening & Anti-Privilege Escalation Controls
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ background: '#09090b', padding: '1rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                <div style={{ fontWeight: 700, color: '#4ade80' }}>✓ Firestore Rules & UID Path Isolation</div>
                <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Users are strictly restricted to <code>/users/{'{uid}'}</code>. Path enumeration and cross-user list queries are blocked for standard users.
                </div>
              </div>

              <div style={{ background: '#09090b', padding: '1rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                <div style={{ fontWeight: 700, color: '#4ade80' }}>✓ Non-Standard Hidden Admin URL</div>
                <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  The Admin panel is mounted at a non-standard secret path (<code>/ops-nexus-903f</code>) and strictly checks <code>request.auth.token.email</code>. Unauthorized attempts receive a standard 404 response.
                </div>
              </div>

              <div style={{ background: '#09090b', padding: '1rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                <div style={{ fontWeight: 700, color: '#4ade80' }}>✓ Scanner SSRF & IP Guard</div>
                <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Outbound scan engine enforces <code>ipGuard.js</code> to block private IPs (10.x, 172.16.x, 192.168.x, 169.254.x, localhost) and restricted ports.
                </div>
              </div>

              <div style={{ background: '#09090b', padding: '1rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                <div style={{ fontWeight: 700, color: '#4ade80' }}>✓ Express Server API Hardening</div>
                <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  <code>x-powered-by</code> header removed, express.json capped at 64KB, rate limiter set to 30 req/min for Gemini endpoint, raw scanner mounted before body parser.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for User Scans Inspection */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 9999
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f3f4f6' }}>
                User Scans: {selectedUser.email}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {(userScansMap[selectedUser.uid] || []).length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>
                This user has not executed any web security scans yet.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {(userScansMap[selectedUser.uid] || []).map((s, idx) => (
                  <div key={idx} style={{ background: '#09090b', padding: '1rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f3f4f6', fontWeight: 600 }}>
                      <span>{s.appUrl}</span>
                      <span style={{ color: s.scoreLetter === 'A' ? '#4ade80' : s.scoreLetter === 'F' ? '#f87171' : '#facc15' }}>
                        Grade {s.scoreLetter}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      Status: {s.status} • Flaws: {s.findingsCount || 0} • Date: {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
