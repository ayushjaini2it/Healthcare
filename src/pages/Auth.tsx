import React, { useState, useEffect } from 'react';
import { Stethoscope } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { PatientSignupForm } from '../components/auth/PatientSignupForm';
import { DoctorSignupForm } from '../components/auth/DoctorSignupForm';

const Auth: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isDoctorSignup, setIsDoctorSignup] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const savedError = sessionStorage.getItem('auth_error');
    if (savedError) {
      setError(savedError);
      sessionStorage.removeItem('auth_error');
    }
  }, []);

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError('');
    setSuccessMsg('');
    setIsDoctorSignup(false);
  };

  const handleSuccess = (msg?: string) => {
    if (msg) {
      setSuccessMsg(msg);
      setError('');
    } else {
      // If no message, it means successful login, just close/let context refresh
      // App.tsx session listener auto-redirects
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 relative my-8 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors z-20"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            {isLogin ? 'Welcome Back!' : 'Create Account!'}
          </h1>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
            {isLogin ? 'Login to your account' : 'Join our network'}
          </h2>
          <p className="text-slate-500 mt-3">
            {isLogin ? "It's nice to see you again. Ready to manage your health?" : "Sign up to connect with qualified healthcare professionals."}
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0"></div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
            <p className="text-sm text-green-600 font-medium">{successMsg}</p>
          </div>
        )}

        {/* Form Area */}
        {isLogin ? (
          <LoginForm onSuccess={handleSuccess} setError={setError} />
        ) : (
          <div className="space-y-5">
            {/* Healthcare professional opt-in */}
            <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100 cursor-pointer"
              onClick={() => { setIsDoctorSignup(v => !v); setError(''); }}>
              <input type="checkbox" id="doctorCheck" checked={isDoctorSignup} onChange={() => {}}
                className="h-4 w-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 pointer-events-none" />
              <label htmlFor="doctorCheck" className="flex items-center gap-2 text-sm font-semibold text-teal-700 pointer-events-none">
                <Stethoscope className="h-4 w-4" />
                I am a registered healthcare professional
              </label>
            </div>

            {isDoctorSignup ? (
              <DoctorSignupForm onSuccess={handleSuccess} setError={setError} />
            ) : (
              <PatientSignupForm onSuccess={handleSuccess} setError={setError} />
            )}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" onClick={() => switchMode(!isLogin)}
            className="text-teal-600 hover:text-teal-500 font-bold underline underline-offset-4 decoration-2 decoration-teal-100 hover:decoration-teal-300 transition-all">
            {isLogin ? 'Sign up for free' : 'Sign in to your account'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
