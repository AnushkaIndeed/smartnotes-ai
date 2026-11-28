import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function PdfViewer({ fileId, filename, totalPages, jump }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    setUrl(null);
    setError('');

    api.get(`/files/${fileId}/file`, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this PDF.');
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  const src = url ? (jump?.page ? `${url}#page=${jump.page}` : url) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {filename}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {totalPages ? `${totalPages} pages` : 'PDF'}
            {jump?.page ? ` · showing page ${jump.page}` : ''}
          </p>
        </div>
        {src && (
          <a href={src} target="_blank" rel="noreferrer"
             style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', flexShrink: 0 }}>
            Open in new tab
          </a>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, background: 'var(--bg-secondary)' }}>
        {error && (
          <p style={{ padding: '24px', fontSize: '13px', color: 'var(--danger)' }}>{error}</p>
        )}
        {!error && !src && (
          <p style={{ padding: '24px', fontSize: '13px', color: 'var(--text-tertiary)' }}>Loading PDF...</p>
        )}
        {src && (
          <iframe
            key={jump ? jump.nonce : 'initial'}
            src={src}
            title={filename}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}
      </div>
    </div>
  );
}