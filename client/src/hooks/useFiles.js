import { useState, useEffect } from 'react';
import api from '../api/axios';

export function useFiles() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchFiles = async () => {
    const res = await api.get('/files');
    setFiles(res.data);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFiles((prev) => [res.data, ...prev]);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (id) => {
    setUploadError('');
    try {
      await api.delete(`/files/${id}`);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      return true;
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Could not delete the PDF.');
      return false;
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return { files, uploading, uploadError, uploadFile, deleteFile };
}