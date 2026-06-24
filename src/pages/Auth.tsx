import React, { useState, useEffect, useRef } from 'react';
import { Stethoscope } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { PatientSignupForm } from '../components/auth/PatientSignupForm';
import { DoctorSignupForm } from '../components/auth/DoctorSignupForm';

const Auth: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isDoctorSignup, setIsDoctorSignup] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedError = sessionStorage.getItem('auth_error');
    if (savedError) {
      setError(savedError);
      sessionStorage.removeItem('auth_error');
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'false') {
      setIsLogin(false);
    }
    if (params.get('tab') === 'doctor') {
      setIsDoctorSignup(true);
    }
    
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      // Focus Trap Logic
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [onClose]);

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError('');
    setSuccessMsg('');
    setIsDoctorSignup(false);
  };

  const handleSuccess = (msg?: string) => {
    if (msg) {
      // Signup success with confirmation message — show it, don't close
      setSuccessMsg(msg);
      setError('');
    } else {
      // Login or auto-login success — close the modal
      onClose();
    }
  };

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        ref={modalRef}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-5 sm:p-6 relative my-4 sm:my-8 border border-slate-100 max-h-[100dvh] sm:max-h-[95vh] overflow-y-auto animate-fade-in"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors z-20"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Header */}
        <div className="mb-4 sm:mb-6 pr-10">
          <h1 id="auth-modal-title" className="text-lg sm:text-xl font-bold text-slate-800">
            {isLogin ? 'Welcome Back!' : 'Create Account!'}
          </h1>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            {isLogin ? 'Login to your account' : 'Join our network'}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 sm:mt-2">
            {isLogin ? "It's nice to see you again. Ready to manage your health?" : "Sign up to connect with qualified healthcare professionals."}
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-fade-in">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0"></div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 animate-fade-in">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
            <p className="text-sm text-green-600 font-medium">{successMsg}</p>
          </div>
        )}

        {/* Form Area */}
        <div className="relative">
          {isLogin ? (
            <div className="animate-fade-in">
               <LoginForm onSuccess={handleSuccess} setError={setError} />
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Segmented Control for Account Type */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setIsDoctorSignup(false); setError(''); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isDoctorSignup ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => { setIsDoctorSignup(true); setError(''); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${isDoctorSignup ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Stethoscope className="w-4 h-4" /> Doctor
                </button>
              </div>

              {isDoctorSignup ? (
                <div className="animate-fade-in">
                   <DoctorSignupForm onSuccess={handleSuccess} setError={setError} onSwitchToLogin={() => switchMode(true)} />
                </div>
              ) : (
                <div className="animate-fade-in">
                   <PatientSignupForm onSuccess={handleSuccess} setError={setError} onSwitchToLogin={() => switchMode(true)} />
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 sm:mt-8 text-center text-sm text-slate-500 font-medium">
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
