import { useState, useEffect } from 'react';
import api from '../api/axios';

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    setLoading(true);
    const res = await api.get('/notes');
    setNotes(res.data);
    setLoading(false);
  };

  const createNote = async () => {
    const res = await api.post('/notes', { title: 'Untitled note', content: '' });
    setNotes((prev) => [res.data, ...prev]);
    return res.data;
  };

  const updateNote = async (id, updates) => {
    const res = await api.put(`/notes/${id}`, updates);
    setNotes((prev) => prev.map((n) => (n._id === id ? res.data : n)));
    return res.data;
  };

  const deleteNote = async (id) => {
    await api.delete(`/notes/${id}`);
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return { notes, loading, createNote, updateNote, deleteNote, fetchNotes };
}