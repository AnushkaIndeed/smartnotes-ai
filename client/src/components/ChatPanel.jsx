import { useState, useEffect, useRef } from 'react';
import { useAI } from '../hooks/useAI';

export default function ChatPanel({ contentId, contentType, contentTitle }) {
  const [input, setInput] = useState('');
  const { messages, loading, error, sendMessage, clearMessages } = useAI();
  const bottomRef = useRef(null);

  // Clear chat history when user switches to a different note/file
  useEffect(() => {
    clearMessages();
    setInput('');
  }, [contentId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(contentId, contentType, input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!contentId) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Select a note or PDF to start chatting
      </div>
    );
  }

  return (
  <div className="flex flex-col h-full">

    {/* Header */}
    <div
      className="p-3 border-b"
      style={{ borderColor: 'var(--border)' }}
    >
      <p
        className="text-xs"
        style={{ color: 'var(--text-secondary)' }}
      >
        Chatting about:
      </p>

      <p
        className="text-sm font-medium truncate"
        style={{ color: 'var(--text-primary)' }}
      >
        {contentTitle}
      </p>
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-3 space-y-3">

      {messages.length === 0 && (
        <p
          className="text-xs text-center mt-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          Ask anything about this {contentType}
        </p>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`text-sm rounded-xl p-3 max-w-[90%] whitespace-pre-wrap ${
            msg.role === 'user' ? 'ml-auto' : ''
          }`}
          style={{
            background:
              msg.role === 'user'
                ? 'var(--accent)'
                : 'var(--bg-secondary)',
            color:
              msg.role === 'user'
                ? '#ffffff'
                : 'var(--text-primary)',
            border:
              msg.role === 'user'
                ? 'none'
                : '1px solid var(--border)',
          }}
        >
          {msg.text}
        </div>
      ))}

      {loading && (
        <div
          className="rounded-xl p-3 max-w-[90%]"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          <span
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Thinking...
          </span>
        </div>
      )}

      {error && (
        <div
          className="rounded-xl p-3 text-xs"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      <div ref={bottomRef} />
    </div>

    {/* Input */}
    <div
      className="p-3 border-t flex gap-2"
      style={{ borderColor: 'var(--border)' }}
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question... (Enter to send)"
        rows={2}
        disabled={loading}
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
        }}
        className="flex-1 rounded-xl p-3 text-sm resize-none outline-none"
      />

      <button
        onClick={handleSend}
        disabled={loading || !input.trim()}
        style={{
          background: 'var(--accent)',
          color: '#fff',
        }}
        className="px-4 py-2 rounded-xl text-sm disabled:opacity-50 self-end"
      >
        Send
      </button>
    </div>

  </div>
);
}