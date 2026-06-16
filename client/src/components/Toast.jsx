import { useEffect } from 'react';

export default function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // auto-dismiss after 3s
    return () => clearTimeout(timer);
  }, []);

  const colours = {
    error: 'bg-red-600',
    success: 'bg-green-600',
    info: 'bg-blue-600',
  };

  return (
    <div className={`fixed bottom-4 right-4 ${colours[type]} text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50`}>
      {message}
    </div>
  );
}
