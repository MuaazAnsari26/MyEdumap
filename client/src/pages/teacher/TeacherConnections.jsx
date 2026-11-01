import React, { useCallback, useEffect, useState } from 'react';
import connectionService from '../../services/connectionService';
import authService from '../../services/authService';
import KeyBadge from '../../components/common/KeyBadge';
import KeyEntryForm from '../../components/common/KeyEntryForm';
import RequestCard from '../../components/common/RequestCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function TeacherConnections() {
  const [myKey, setMyKey] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [me, inc, out, conns] = await Promise.all([
        authService.fetchCurrentUser(),
        connectionService.getIncoming(),
        connectionService.getOutgoing(),
        connectionService.getConnections(),
      ]);
      setMyKey(me.profile?.connectionKey || null);
      setIncoming(inc);
      setOutgoing(out);
      setConnections(conns);
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSendRequest = async (key) => {
    await connectionService.sendRequest(key);
    await loadAll();
    return 'Request sent.';
  };

  const handleAccept = async (id) => {
    await connectionService.accept(id);
    await loadAll();
  };

  const handleReject = async (id) => {
    await connectionService.reject(id);
    await loadAll();
  };

  const handleCancel = async (id) => {
    await connectionService.cancel(id);
    await loadAll();
  };

  if (isLoading) return <LoadingSpinner label="Loading your connections…" />;

  return (
    <div>
      <span className="eyebrow">Connections</span>
      <h2>Connect with your students</h2>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {myKey && (
        <div style={{ marginBottom: 'var(--space-7)', maxWidth: 480 }}>
          <KeyBadge label="Your teacher connection key" value={myKey} />
        </div>
      )}

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h3>Connect using a student's key</h3>
        <p style={{ fontSize: '0.9rem' }}>Ask your student for their connection key and enter it below.</p>
        <KeyEntryForm placeholder="EDU-STU-XXXXXX" buttonLabel="Send request" onSubmit={handleSendRequest} />
      </section>

      {incoming.length > 0 && (
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h3>Incoming requests</h3>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {incoming.map((r) => (
              <RequestCard
                key={r._id}
                person={r.requester}
                createdAt={r.createdAt}
                direction="incoming"
                onAccept={() => handleAccept(r._id)}
                onReject={() => handleReject(r._id)}
              />
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h3>Pending requests you sent</h3>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {outgoing.map((r) => (
              <RequestCard
                key={r._id}
                person={r.recipient}
                createdAt={r.createdAt}
                direction="outgoing"
                onCancel={() => handleCancel(r._id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3>Your students</h3>
        {connections.length === 0 ? (
          <div className="empty-state">
            <h4>No students connected yet</h4>
            <p style={{ margin: 0 }}>Send a connection request, or share your class key so students can join.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {connections.map((c) => (
              <div key={c._id} className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
                <div style={{ fontWeight: 600 }}>{c.student?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)' }}>{c.student?.email}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
