import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-screen">
      <Link to="/" className="auth-brand" aria-label="Back to SmartNotes home">
        <span>S</span>
        SmartNotes AI
      </Link>

      <form onSubmit={handleSubmit} className="auth-card">
        <div className="auth-copy">
          <p>Start free</p>
          <h1>Create your workspace</h1>
          <span>Set up SmartNotes AI and turn your notes and PDFs into a study assistant.</span>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
          required
          minLength={6}
        />
        <button type="submit" className="auth-submit">
          Create account
        </button>

        <p className="auth-switch">
          Have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
