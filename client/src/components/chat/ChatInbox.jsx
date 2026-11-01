import React, { useCallback, useEffect, useRef, useState } from 'react';
import chatService from '../../services/chatService';
import MessageBubble from './MessageBubble';
import ChatComposer from './ChatComposer';
import LoadingSpinner from '../common/LoadingSpinner';

const POLL_INTERVAL_MS = 4000;

// `contacts` is the list of people this user is allowed to message
// (resolved by the page from real connections — never arbitrary users).
// Each contact: { id, name, email }.
export default function ChatInbox({ contacts, isLoadingContacts, contactLabel }) {
  const [threads, setThreads] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const scrollRef = useRef(null);
  const pollRef = useRef(null);

  const loadThreads = useCallback(() => {
    chatService
      .listThreads()
      .then(setThreads)
      .catch((err) => setError(err.friendlyMessage))
      .finally(() => setIsLoadingThreads(false));
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const openConversation = async (contact, existingThreadId) => {
    setError(null);
    setSelectedContact(contact);
    setMobileShowThread(true);
    setIsLoadingMessages(true);
    try {
      const thread = existingThreadId ? { _id: existingThreadId } : await chatService.openThread(contact.id);
      setSelectedThreadId(thread._id);
      const msgs = await chatService.getMessages(thread._id);
      setMessages(msgs);
      loadThreads();
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Light polling while a conversation is open — a pragmatic choice over
  // websockets for this scope; swapping in real-time delivery later
  // wouldn't change this component's props or the backend's message shape.
  useEffect(() => {
    if (!selectedThreadId) return undefined;
    pollRef.current = setInterval(() => {
      chatService
        .getMessages(selectedThreadId)
        .then(setMessages)
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [selectedThreadId]);

  const handleSend = async (content) => {
    setIsSending(true);
    setError(null);
    try {
      const message = await chatService.sendMessage(selectedThreadId, content);
      setMessages((prev) => [...prev, message]);
      loadThreads();
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => setMobileShowThread(false);

  const threadByOtherUserId = new Map(threads.map((t) => [String(t.otherUser?._id), t]));
  const contactRows = (contacts || []).map((c) => {
    const thread = threadByOtherUserId.get(String(c.id));
    return {
      contact: c,
      threadId: thread?._id || null,
      lastMessagePreview: thread?.lastMessagePreview,
      lastMessageAt: thread?.lastMessageAt,
      unreadCount: thread?.unreadCount || 0,
    };
  });
  contactRows.sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return a.contact.name.localeCompare(b.contact.name);
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
  });

  if (isLoadingContacts || isLoadingThreads) {
    return <LoadingSpinner label="Loading conversations…" />;
  }

  if (!contacts || contacts.length === 0) {
    return (
      <div className="empty-state">
        <h4>No {contactLabel}s connected yet</h4>
        <p style={{ margin: 0 }}>Connect with a {contactLabel} to start a conversation.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, height: 'calc(100vh - 200px)', display: 'flex', overflow: 'hidden' }}>
      <div className={`chat-list-pane ${mobileShowThread ? 'chat-hide-mobile' : ''}`} style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--line)', overflowY: 'auto' }}>
        {contactRows.map((row) => (
          <button
            key={row.contact.id}
            type="button"
            onClick={() => openConversation(row.contact, row.threadId)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: 'var(--space-4)',
              border: 'none',
              borderBottom: '1px solid var(--line)',
              background: selectedContact?.id === row.contact.id ? 'var(--route-light)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{row.contact.name}</span>
              {row.unreadCount > 0 && (
                <span
                  className="mono"
                  style={{ background: 'var(--marigold)', color: '#1e2a44', borderRadius: 999, fontSize: '0.7rem', padding: '0.1rem 0.45rem', fontWeight: 700 }}
                >
                  {row.unreadCount}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.lastMessagePreview || 'No messages yet'}
            </div>
          </button>
        ))}
      </div>

      <div className={`chat-thread-pane ${!mobileShowThread ? 'chat-hide-mobile' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!selectedContact ? (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <p style={{ margin: 0 }}>Select a conversation to get started.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="button" onClick={handleBack} className="chat-back-btn" aria-label="Back to conversation list" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                ←
              </button>
              <div>
                <div style={{ fontWeight: 600 }}>{selectedContact.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-light)' }}>{selectedContact.email}</div>
              </div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
              {isLoadingMessages ? (
                <LoadingSpinner label="Loading messages…" size={22} />
              ) : messages.length === 0 ? (
                <div className="empty-state" style={{ margin: 'auto' }}>
                  <p style={{ margin: 0 }}>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((m) => (
                  <MessageBubble key={m._id} content={m.content} isMine={String(m.sender) !== String(selectedContact.id)} timestamp={m.createdAt} />
                ))
              )}
            </div>

            {error && <div className="alert alert-error" role="alert" style={{ margin: 'var(--space-3) var(--space-4) 0' }}>{error}</div>}

            <ChatComposer onSend={handleSend} isSending={isSending} />
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 720px) {
          .chat-hide-mobile { display: none !important; }
          .chat-list-pane { width: 100% !important; }
          .chat-back-btn { display: inline-block !important; }
        }
      `}</style>
    </div>
  );
}
