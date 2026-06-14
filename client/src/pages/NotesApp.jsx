import { useState, useEffect } from 'react';
import { useNotes } from '../hooks/useNotes';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';

export default function NotesApp() {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes();
  const { logout, user } = useAuth();

  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const activeNote = notes.find((n) => n._id === activeId);

  // When user selects a note, load its data into the editor
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    }
  }, [activeId]);

  // Debounced values — only change 800ms after user stops typing
  const debouncedTitle = useDebounce(title);
  const debouncedContent = useDebounce(content);

  // Auto-save when debounced values change
  useEffect(() => {
    if (activeId && activeNote) {
      if (debouncedTitle !== activeNote.title || debouncedContent !== activeNote.content) {
        updateNote(activeId, { title: debouncedTitle, content: debouncedContent });
      }
    }
  }, [debouncedTitle, debouncedContent]);

  const handleNewNote = async () => {
    const note = await createNote();
    setActiveId(note._id);
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    if (activeId === id) setActiveId(null);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50 flex flex-col">
        <div className="p-3 border-b flex justify-between items-center">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button onClick={logout} className="text-xs text-red-600">Logout</button>
        </div>

        <button
          onClick={handleNewNote}
          className="m-3 bg-blue-600 text-white rounded p-2 text-sm"
        >
          + New note
        </button>

        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-4">No notes yet — create one!</p>
          )}
          {notes.map((note) => (
            <div
              key={note._id}
              onClick={() => setActiveId(note._id)}
              className={`px-3 py-2 cursor-pointer flex justify-between items-center ${
                activeId === note._id ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-sm truncate">{note.title || 'Untitled note'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(note._id); }}
                className="text-xs text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6">
        {activeNote ? (
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-medium w-full mb-4 outline-none"
              placeholder="Untitled note"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[calc(100%-60px)] outline-none resize-none text-sm leading-relaxed"
              placeholder="Start writing..."
            />
          </>
        ) : (
          <p className="text-gray-400">Select a note or create a new one</p>
        )}
      </div>
    </div>
  );
}
