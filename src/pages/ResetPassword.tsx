import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { supabaseServices } from '../services/supabaseServices';
import { useAuth } from '../context/AuthContext';
import { Loader2, Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { clearPasswordResetFlag } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [canSubmitPwd, setCanSubmitPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Security: verify a valid recovery session exists
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1. Manually check the URL hash before Supabase strips it (useful for catching errors)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashError = hashParams.get('error_description');
    if (hashError) {
      setError(`Link error: ${hashError.replace(/\+/g, ' ')}`);
      setIsVerifying(false);
      setIsAuthorized(false);
      return;
    }

    // 2. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session) {
        setIsAuthorized(true);
        setIsVerifying(false);
      }
    });

    // 3. Listen for auth state changes (Supabase handles the token exchange here)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsAuthorized(true);
        setIsVerifying(false);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthorized(false);
      }
    });

    // 4. Fallback timeout
    const timeout = setTimeout(() => {
      if (mounted) {
        setIsVerifying(false);
        // We use the functional state update to avoid closure bugs with isAuthorized
        setIsAuthorized(prev => {
          if (!prev && !error) {
            setError('Invalid or expired reset link. Ensure you are using the most recent link.');
          }
          return prev;
        });
      }
    }, 2500);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array prevents re-running and clearing the timeout erroneously

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (!canSubmitPwd) {
      setError("Please use a stronger password");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await supabaseServices.authServices.updatePassword(password);
      localStorage.removeItem('password_reset_in_progress');
      clearPasswordResetFlag();
      window.dispatchEvent(new Event('storage')); // Notify other tabs/AuthContext
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state if no valid session
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-6">
            {error || 'This page can only be accessed through a valid password reset link sent to your email.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
          <p className="text-slate-500 mt-2">Enter your new password below.</p>
        </div>

        {success ? (
          <div className="text-center animate-fade-in">
            <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl mb-6">
              Password successfully updated!
            </div>
            <p className="text-sm text-slate-500">Redirecting you to the home page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  placeholder="Create a strong password" 
                  autoFocus
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-teal-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} onStrengthChange={setCanSubmitPwd} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                placeholder="Confirm new password" 
              />
            </div>

            <button type="submit" disabled={isLoading || !password || !confirmPassword}
              className="w-full mt-4 flex items-center justify-center py-3.5 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition-all disabled:opacity-50 shadow-sm shadow-teal-100">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
