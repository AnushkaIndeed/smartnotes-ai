import { useState, useEffect, useRef } from 'react';
import { useAI } from '../hooks/useAI';

export default function ChatPanel({ contentId, contentType, contentTitle }) {
  const [input, setInput] = useState('');
  const { messages, loading, error, sendMessage, clearMessages } = useAI();
  const bottomRef = useRef(null);

  useEffect(() => {
    clearMessages();
    setInput('');
  }, [contentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(contentId, contentType, input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
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
      <div className="p-3 border-b">
        <p className="text-xs text-gray-500">Chatting about:</p>
        <p className="text-sm font-medium truncate">{contentTitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Ask anything about this {contentType}
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg p-3 max-w-[90%] whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white ml-auto'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="bg-gray-100 rounded-lg p-3 max-w-[90%]">
            <span className="text-sm text-gray-500">Thinking...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question... (Enter to send)"
          rows={2}
          className="flex-1 border rounded p-2 text-sm resize-none outline-none focus:border-blue-400"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-3 rounded text-sm disabled:opacity-50 self-end"
        >
          Send
        </button>
      </div>
    </div>
  );
}
