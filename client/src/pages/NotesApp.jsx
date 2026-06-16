import { useState, useEffect } from 'react';
import { useNotes } from '../hooks/useNotes';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../hooks/useFiles';
import { useTheme } from '../context/ThemeContext';
import ChatPanel from '../components/ChatPanel';

export default function NotesApp() {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes();
  const { logout, user } = useAuth();
  const { files, uploading, uploadFile, deleteFile } = useFiles();
  const { theme, toggleTheme } = useTheme();

  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [chatTarget, setChatTarget] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');

  const activeNote = notes.find((n) => n._id === activeId);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    }
  }, [activeId]);

  const debouncedTitle = useDebounce(title);
  const debouncedContent = useDebounce(content);

  useEffect(() => {
    if (activeId && activeNote) {
      if (debouncedTitle !== activeNote.title || debouncedContent !== activeNote.content) {
        setSaveStatus('saving');
        updateNote(activeId, { title: debouncedTitle, content: debouncedContent })
          .then(() => setSaveStatus('saved'));
      }
    }
  }, [debouncedTitle, debouncedContent]);

  const handleTitleChange = (e) => { setTitle(e.target.value); setSaveStatus('saving'); };
  const handleContentChange = (e) => { setContent(e.target.value); setSaveStatus('saving'); };

  const handleNewNote = async () => {
    const note = await createNote();
    setActiveId(note._id);
    setTitle('');
    setContent('');
    setChatTarget({ id: note._id, type: 'note', title: 'Untitled note' });
  };

  const handleDeleteNote = async (id) => {
    await deleteNote(id);
    if (activeId === id) {
      setActiveId(null);
      setTitle('');
      setContent('');
      setChatTarget(null);
    }
  };

  const handleDeleteFile = async (id) => {
    await deleteFile(id);
    if (chatTarget?.id === id) {
      setChatTarget(null);
    }
  };

  const handleSelectNote = (note) => {
    setActiveId(note._id);
    setSaveStatus('saved');
    setChatTarget({ id: note._id, type: 'note', title: note.title || 'Untitled note' });
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
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>

      {/* Sidebar */}
      <div style={{
        width: '240px', minWidth: '240px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Branding */}
        <div style={{
          padding: '16px 14px 12px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', color: 'var(--accent)' }}>✦</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>SmartNotes</span>
          </div>
          <button onClick={toggleTheme} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', padding: '4px', borderRadius: '6px',
          }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* User row */}
        <div style={{
          padding: '10px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '600', flexShrink: 0,
            }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <span style={{
              fontSize: '12px', color: 'var(--text-secondary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.email}
            </span>
          </div>
          <button onClick={logout} style={{
            fontSize: '11px', color: 'var(--text-tertiary)',
            background: 'none', border: 'none', cursor: 'pointer',
            flexShrink: 0, marginLeft: '8px', padding: '3px 6px', borderRadius: '4px',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--danger)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}>
            Sign out
          </button>
        </div>

        {/* New note button */}
        <div style={{ padding: '10px 14px 6px' }}>
          <button onClick={handleNewNote} style={{
            width: '100%', padding: '7px 12px',
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: '7px',
            fontSize: '13px', fontWeight: '500', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> New note
          </button>
        </div>

        {/* Notes label */}
        <div style={{ padding: '8px 14px 4px' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Notes
          </p>
        </div>

        {/* Notes list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px' }}>
          {loading && [1,2,3].map(i => (
            <div key={i} style={{
              height: '32px', borderRadius: '6px', background: 'var(--bg-hover)',
              marginBottom: '4px', animation: 'shimmer 1.5s infinite',
            }} />
          ))}

          {!loading && notes.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '16px', lineHeight: '1.5' }}>
              No notes yet.<br />Create one above.
            </p>
          )}

          {!loading && notes.map((note) => (
            <div
              key={note._id}
              onClick={() => handleSelectNote(note)}
              style={{
                padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: activeId === note._id ? 'var(--bg-active)' : 'transparent',
                marginBottom: '1px', gap: '4px',
              }}
              onMouseEnter={e => {
                if (activeId !== note._id) e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.querySelector('.note-del').style.opacity = '1';
              }}
              onMouseLeave={e => {
                if (activeId !== note._id) e.currentTarget.style.background = 'transparent';
                e.currentTarget.querySelector('.note-del').style.opacity = '0';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', flexShrink: 0 }}>📝</span>
                <span style={{
                  fontSize: '13px',
                  color: activeId === note._id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {note.title || 'Untitled note'}
                </span>
              </div>
              <button
                className="note-del"
                onClick={(e) => { e.stopPropagation(); handleDeleteNote(note._id); }}
                title="Delete note"
                style={{
                  opacity: 0, background: 'none', border: 'none',
                  color: 'var(--text-tertiary)', cursor: 'pointer',
                  fontSize: '12px', padding: '2px 5px', borderRadius: '4px', flexShrink: 0,
                }}
                onMouseEnter={e => { e.target.style.color = 'var(--danger)'; e.target.style.background = 'var(--danger-soft)'; }}
                onMouseLeave={e => { e.target.style.color = 'var(--text-tertiary)'; e.target.style.background = 'none'; }}
              >✕</button>
            </div>
          ))}
        </div>

        {/* PDFs section */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              PDFs
            </p>
            <label style={{ fontSize: '11px', color: 'var(--accent)', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
              {uploading ? 'Uploading...' : '+ Upload'}
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
          </div>

          <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
            {files.length === 0 && (
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>No PDFs yet</p>
            )}
            {files.map((f) => (
              <div
                key={f._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 4px', borderRadius: '5px', marginBottom: '1px',
                  background: chatTarget?.id === f._id ? 'var(--bg-active)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (chatTarget?.id !== f._id) e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.querySelector('.pdf-del').style.opacity = '1';
                }}
                onMouseLeave={e => {
                  if (chatTarget?.id !== f._id) e.currentTarget.style.background = 'transparent';
                  e.currentTarget.querySelector('.pdf-del').style.opacity = '0';
                }}
              >
                {/* Clickable area */}
                <div
                  onClick={() => handleSelectFile(f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    flex: 1, minWidth: 0, cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '11px', flexShrink: 0 }}>📄</span>
                  <span style={{
                    fontSize: '12px', color: 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {f.filename}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  className="pdf-del"
                  onClick={(e) => { e.stopPropagation(); handleDeleteFile(f._id); }}
                  title="Delete PDF"
                  style={{
                    opacity: 0, background: 'none', border: 'none',
                    color: 'var(--text-tertiary)', cursor: 'pointer',
                    fontSize: '11px', padding: '2px 4px', borderRadius: '4px', flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.target.style.color = 'var(--danger)'; e.target.style.background = 'var(--danger-soft)'; }}
                  onMouseLeave={e => { e.target.style.color = 'var(--text-tertiary)'; e.target.style.background = 'none'; }}
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {activeNote && (
          <div style={{
            padding: '10px 32px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', color: saveStatus === 'saving' ? 'var(--text-tertiary)' : 'var(--success)' }}>
              {saveStatus === 'saving' ? 'Saving...' : '✓ Saved'}
            </span>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: activeNote ? '48px 64px' : '0' }}>
          {activeNote ? (
            <>
              <input
                value={title}
                onChange={handleTitleChange}
                placeholder="Untitled"
                style={{
                  display: 'block', width: '100%',
                  fontSize: '30px', fontWeight: '700',
                  color: 'var(--text-primary)', background: 'transparent',
                  border: 'none', outline: 'none', marginBottom: '16px',
                  letterSpacing: '-0.02em', fontFamily: 'inherit',
                }}
              />
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing, or ask the AI on the right..."
                style={{
                  display: 'block', width: '100%', minHeight: 'calc(100vh - 240px)',
                  fontSize: '15px', lineHeight: '1.75',
                  color: 'var(--text-secondary)', background: 'transparent',
                  border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit',
                }}
              />
            </>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: '12px',
            }}>
              {chatTarget?.type === 'file' ? (
                <>
                  <span style={{ fontSize: '36px' }}>📄</span>
                  <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-secondary)' }}>{chatTarget.title}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Ask questions about this PDF in the chat →</p>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '36px', color: 'var(--accent)' }}>✦</span>
                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Select a note or create a new one</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div style={{
        width: '300px', minWidth: '300px',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: 'var(--bg-primary)',
      }}>
        <ChatPanel
          contentId={chatTarget?.id}
          contentType={chatTarget?.type}
          contentTitle={chatTarget?.title}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.4; } 50% { opacity: 0.8; } 100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}