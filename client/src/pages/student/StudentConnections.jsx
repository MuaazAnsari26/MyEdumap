import React, { useCallback, useEffect, useState } from 'react';
import connectionService from '../../services/connectionService';
import classService from '../../services/classService';
import authService from '../../services/authService';
import KeyBadge from '../../components/common/KeyBadge';
import KeyEntryForm from '../../components/common/KeyEntryForm';
import RequestCard from '../../components/common/RequestCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function StudentConnections() {
  const [myKey, setMyKey] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [connections, setConnections] = useState([]);
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [me, inc, out, conns, classes] = await Promise.all([
        authService.fetchCurrentUser(),
        connectionService.getIncoming(),
        connectionService.getOutgoing(),
        connectionService.getConnections(),
        classService.listMyJoinedClasses(),
      ]);
      setMyKey(me.profile?.connectionKey || null);
      setIncoming(inc);
      setOutgoing(out);
      setConnections(conns);
      setJoinedClasses(classes);
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

  const handleJoinClass = async (key) => {
    const result = await classService.joinClass(key);
    await loadAll();
    return `Joined ${result.class.name}.`;
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
      <h2>Connect with your teachers</h2>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {myKey && (
        <div style={{ marginBottom: 'var(--space-7)', maxWidth: 480 }}>
          <KeyBadge label="Your student connection key" value={myKey} />
        </div>
      )}

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h3>Connect using a teacher's key</h3>
        <p style={{ fontSize: '0.9rem' }}>Ask your teacher for their connection key and enter it below.</p>
        <KeyEntryForm placeholder="EDU-TCH-XXXXXX" buttonLabel="Send request" onSubmit={handleSendRequest} />
      </section>

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h3>Join a class</h3>
        <p style={{ fontSize: '0.9rem' }}>Enter the class key your teacher shared to join their class.</p>
        <KeyEntryForm placeholder="EDU-CLS-XXXXXX" buttonLabel="Join class" onSubmit={handleJoinClass} />

        <div style={{ marginTop: 'var(--space-5)' }}>
          {joinedClasses.length === 0 ? (
            <div className="empty-state">
              <h4>You haven't joined a class yet</h4>
              <p style={{ margin: 0 }}>Use a class key from your teacher to join one.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {joinedClasses.map((c) => (
                <div key={c.id} className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)' }}>
                    Taught by {c.teacher?.name} · Joined {new Date(c.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        <h3>Your teachers</h3>
        {connections.length === 0 ? (
          <div className="empty-state">
            <h4>No teachers connected yet</h4>
            <p style={{ margin: 0 }}>Send a connection request or join a class to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {connections.map((c) => (
              <div key={c._id} className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
                <div style={{ fontWeight: 600 }}>{c.teacher?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)' }}>{c.teacher?.email}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
