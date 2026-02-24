import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { UtensilsCrossed, Mail, Lock, User } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithEmail, resendVerificationEmail, loading, user } = useAuthStore();
  const toast = useToastStore;

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');

  useEffect(() => {
    if (!user) return;
    navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
  }, [user, navigate]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.getState().error('Please enter your name');
      return;
    }
    if (!email || !password) {
      toast.getState().error('Enter your email and password');
      return;
    }
    if (password.length < 6) {
      toast.getState().error('Password must be at least 6 characters');
      return;
    }
    try {
      const result = await signUpWithEmail({ email, password, name: name.trim() });
      if (result.needsEmailConfirmation) {
        setVerificationEmail(email);
        setMode('verify');
        toast.getState().success('Verification email sent');
        return;
      }
      const user = await signInWithEmail({ email, password });
      toast.getState().success(`Welcome, ${user.name || user.email}!`);
      navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (err) {
      toast.getState().error(err.message || 'Failed to sign up');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.getState().error('Enter your email and password');
      return;
    }
    try {
      const user = await signInWithEmail({ email, password });
      toast.getState().success(`Welcome back, ${user.name || user.email}!`);
      navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (err) {
      toast.getState().error(err.message || 'Failed to sign in');
    }
  };

  const handleResend = async () => {
    if (!verificationEmail) return;
    try {
      await resendVerificationEmail(verificationEmail);
      toast.getState().success('Verification email resent');
    } catch (err) {
      toast.getState().error(err.message || 'Failed to resend verification email');
    }
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <div className="login-logo">
          <UtensilsCrossed size={48} color="var(--primary)" />
        </div>
        <h1 className="login-title">CanteenX</h1>
        <p className="login-subtitle">Smart Campus Canteen</p>
      </div>

      <div className="login-card">
        {mode === 'verify' ? (
          <div>
            <h2 className="auth-card-title">Verify your email</h2>
            <p className="auth-card-sub">
              We sent a verification link to <strong>{verificationEmail}</strong>.
              Open it to activate your account.
            </p>
            <button
              className="btn btn-primary btn-block auth-submit"
              type="button"
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend verification email'}
            </button>
            <button
              className="btn btn-outline btn-block"
              type="button"
              onClick={() => setMode('signin')}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={mode === 'signup' ? handleSignUp : handleSignIn}>
            <h2 className="auth-card-title">{mode === 'signup' ? 'Create account' : 'Sign in'}</h2>
            <p className="auth-card-sub">
              {mode === 'signup'
                ? 'Use your email to create an account'
                : 'Use your email to continue'}
            </p>

            {mode === 'signup' && (
              <div className="auth-field">
                <User size={18} className="auth-field-icon" />
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  autoComplete="name"
                />
              </div>
            )}

            <div className="auth-field">
              <Mail size={18} className="auth-field-icon" />
              <input
                className="auth-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <Lock size={18} className="auth-field-icon" />
              <input
                className="auth-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            <button
              className="btn btn-primary btn-block auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? mode === 'signup'
                  ? 'Creating account...'
                  : 'Signing in...'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
            </button>

            <div className="auth-switch-text">
              {mode === 'signup' ? 'Already have an account?' : 'New here?'}
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
              >
                {mode === 'signup' ? 'Sign in' : 'Create account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
