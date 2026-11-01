import React, { useEffect, useRef, useState } from 'react';
import aiService from '../../services/aiService';
import MessageBubble from '../../components/chat/MessageBubble';
import AssistantMessageBlock from '../../components/chat/AssistantMessageBlock';
import TypingIndicator from '../../components/chat/TypingIndicator';
import ChatComposer from '../../components/chat/ChatComposer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

export default function AIDoubtSolver() {
  const [messages, setMessages] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    aiService
      .getConversation()
      .then(setMessages)
      .catch((err) => setError(err.friendlyMessage))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSend = async (content) => {
    setError(null);
    setLastFailedMessage(null);
    setIsSending(true);
    setMessages((prev) => [...(prev || []), { role: 'user', content, createdAt: new Date().toISOString(), _optimistic: true }]);
    try {
      const [, assistantMessage] = await aiService.sendDoubtMessage(content);
      setMessages((prev) => [
        ...prev.filter((m) => !m._optimistic),
        { role: 'user', content, createdAt: new Date().toISOString() },
        assistantMessage,
      ]);
    } catch (err) {
      setError(err.friendlyMessage);
      setLastFailedMessage(content);
      setMessages((prev) => prev.filter((m) => !m._optimistic));
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) handleSend(lastFailedMessage);
  };

  const handleClear = async () => {
    try {
      await aiService.clearConversation();
      setMessages([]);
    } catch (err) {
      setError(err.friendlyMessage);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <span className="eyebrow">AI Doubt Solver</span>
          <h2 style={{ marginBottom: 0 }}>Ask anything about your syllabus</h2>
        </div>
        {messages && messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear}>
            Clear conversation
          </Button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="card"
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: 'var(--space-5)' }}
      >
        {isLoading ? (
          <LoadingSpinner label="Loading your conversation…" />
        ) : messages && messages.length === 0 ? (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <h4>No questions yet</h4>
            <p style={{ margin: 0 }}>Ask a question about any subject and get a step-by-step explanation.</p>
          </div>
        ) : (
          messages &&
          messages.map((m, idx) =>
            m.role === 'assistant' ? (
              <AssistantMessageBlock key={idx} content={m.content} timestamp={m.createdAt} />
            ) : (
              <MessageBubble key={idx} content={m.content} isMine timestamp={m.createdAt} />
            )
          )
        )}
        {isSending && <TypingIndicator />}
      </div>

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginTop: 'var(--space-3)', marginBottom: 0 }}>
          {error}
          {lastFailedMessage && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <Button size="sm" variant="outline" onClick={handleRetry} isLoading={isSending}>
                Retry
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ padding: 0, marginTop: 'var(--space-3)' }}>
        <ChatComposer onSend={handleSend} isSending={isSending} placeholder="Ask a question…" />
      </div>
    </div>
  );
}
