import { useState, useEffect } from 'react';
import { useNotes } from '../hooks/useNotes';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../hooks/useFiles';
import ChatPanel from '../components/ChatPanel';

export default function NotesApp() {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes();
  const { logout, user } = useAuth();
  const { files, uploading, uploadFile } = useFiles();

  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [chatTarget, setChatTarget] = useState(null);

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
      if (
        debouncedTitle !== activeNote.title ||
        debouncedContent !== activeNote.content
      ) {
        updateNote(activeId, {
          title: debouncedTitle,
          content: debouncedContent,
        });
      }
    }
  }, [debouncedTitle, debouncedContent]);

  const handleNewNote = async () => {
    const note = await createNote();
    setActiveId(note._id);
    setTitle('');
    setContent('');
    setChatTarget({ id: note._id, type: 'note', title: 'Untitled note' });
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    if (activeId === id) {
      setActiveId(null);
      setTitle('');
      setContent('');
      setChatTarget(null);
    }
  };

  const handleSelectNote = (note) => {
    setActiveId(note._id);
    setChatTarget({
      id: note._id,
      type: 'note',
      title: note.title || 'Untitled note',
    });
  };

  const handleSelectFile = (file) => {
    setActiveId(null);
    setTitle('');
    setContent('');
    setChatTarget({ id: file._id, type: 'file', title: file.filename });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) await uploadFile(file);
  };

  return (
    <div className="flex h-screen flex h-screen overflow-hidden">

      {/* Column 1: Sidebar */}
      <div className="w-56 border-r bg-gray-50 flex flex-col shrink-0">

        {/* User + logout */}
        <div className="p-3 border-b flex justify-between items-center">
          <span className="text-xs text-gray-500 truncate">{user?.email}</span>
          <button
            onClick={logout}
            className="text-xs text-red-500 ml-2 shrink-0"
          >
            Logout
          </button>
        </div>

        {/* New note button */}
        <button
          onClick={handleNewNote}
          className="m-3 bg-blue-600 text-white rounded p-2 text-sm hover:bg-blue-700 transition-colors"
        >
          + New note
        </button>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          )}

          {!loading && notes.length === 0 && (
            <p className="text-xs text-gray-400 text-center mt-4 px-2">
              No notes yet — create one!
            </p>
          )}

          {!loading && notes.map((note) => (
            <div
              key={note._id}
              onClick={() => handleSelectNote(note)}
              className={`px-3 py-2 cursor-pointer flex justify-between items-center group ${
                activeId === note._id ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-sm truncate">
                {note.title || 'Untitled note'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(note._id);
                }}
                className="text-xs text-red-400 ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* PDF section */}
        <div className="border-t p-3">
          <p className="text-xs text-gray-500 mb-2">PDFs</p>
          <label className="block text-xs bg-gray-100 rounded p-2 text-center cursor-pointer hover:bg-gray-200 transition-colors">
            {uploading ? 'Uploading...' : '+ Upload PDF'}
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>

          <div className="mt-2 max-h-28 overflow-y-auto">
            {files.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-2">
                No PDFs yet
              </p>
            )}
            {files.map((f) => (
              <div
                key={f._id}
                onClick={() => handleSelectFile(f)}
                className={`text-xs truncate py-1 px-1 rounded cursor-pointer ${
                  chatTarget?.id === f._id
                    ? 'bg-blue-100'
                    : 'hover:bg-gray-100'
                }`}
              >
                📄 {f.filename}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Column 2: Editor */}
      <div className="flex-1 p-6 overflow-y-auto min-w-0 max-w-[calc(100%-320px-224px)]">
        {activeNote ? (
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-medium w-full mb-4 outline-none placeholder-gray-300"
              placeholder="Untitled note"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[calc(100%-60px)] outline-none resize-none text-sm leading-relaxed placeholder-gray-300"
              placeholder="Start writing..."
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {chatTarget?.type === 'file' ? (
              <>
                <p className="text-2xl mb-2">📄</p>
                <p className="text-sm font-medium text-gray-600">{chatTarget.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Ask questions about this PDF in the chat →
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400">
                  Select a note or create a new one
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Column 3: Chat panel */}
      <div className="w-80 min-w-[320px] border-l flex flex-col shrink-0 bg-blue">
        <ChatPanel
          contentId={chatTarget?.id}
          contentType={chatTarget?.type}
          contentTitle={chatTarget?.title}
        />
      </div>

    </div>
  );
}
