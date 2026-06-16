import { useState } from 'react';
import api from '../api/axios';

export function useAI() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async (contentId, contentType, question) => {
    if (!question.trim()) return;

    // Immediately show the user's message in the chat
    const userMessage = { role: 'user', text: question };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/ai/chat', { contentId, contentType, question });

      const aiMessage = { role: 'ai', text: res.data.answer };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (err) {
      setError(err.response?.data?.error || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return { messages, loading, error, sendMessage, clearMessages };
}