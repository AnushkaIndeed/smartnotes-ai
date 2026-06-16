import { useState, useEffect } from 'react';
import api from '../api/axios';

export function useFiles() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    const res = await api.get('/files');
    setFiles(res.data);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file); // key must match upload.single('file')

    try {
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFiles((prev) => [res.data, ...prev]);
    } finally {
      setUploading(false);
    }
  };
  // Delete a file by ID
  const deleteFile = async (id) => {
    await api.delete(`/files/${id}`);
    setFiles((prev) => prev.filter((f) => f._id !== id));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return { files, uploading, uploadFile };
}