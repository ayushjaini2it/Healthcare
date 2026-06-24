import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabaseServices } from '../../services/supabaseServices';
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: () => void;
  setError: (msg: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, setError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    // Default to true unless explicitly set to use session storage
    return localStorage.getItem('hc_use_session_storage') !== 'true';
  });
  
  // Forgot password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    
    // Save remember me preference before login
    localStorage.setItem('hc_use_session_storage', (!rememberMe).toString());
    localStorage.removeItem('password_reset_in_progress');

    try {
      await supabaseServices.authServices.signIn(data.email, data.password);
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.includes('Account data missing')) {
        setError(msg);
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Please confirm your email address before signing in.');
      } else {
        setError('Something went wrong. Please try again or contact support.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please enter your email address.');
      return;
    }
    
    setForgotLoading(true);
    setError('');
    setForgotSuccess('');
    
    try {
      localStorage.setItem('password_reset_in_progress', Date.now().toString());
      await supabaseServices.authServices.resetPassword(forgotEmail);
      setForgotSuccess('A password reset link has been sent to your email.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (isForgotMode) {
    return (
      <div className="space-y-5 animate-fade-in relative">
        {forgotLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
             <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          </div>
        )}
        
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800">Reset Password</h3>
          <p className="text-sm text-slate-500 mt-1">Enter your email and we'll send you a reset link.</p>
        </div>

        {forgotSuccess && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">
            {forgotSuccess}
          </div>
        )}

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="relative">
            <label htmlFor="reset-email" className="sr-only">Email Address</label>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-5 w-5" />
            </div>
            <input 
              id="reset-email"
              type="email" 
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              autoFocus
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="Your email address" 
            />
          </div>

          <button type="submit" disabled={forgotLoading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {forgotLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Send Reset Link</span>}
          </button>
          
          <button type="button" onClick={() => { setIsForgotMode(false); setError(''); setForgotSuccess(''); }}
            className="w-full py-3 px-4 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
            Back to Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
           <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        </div>
      )}
      
      <div>
        <label htmlFor="login-email" className="sr-only">Email Address</label>
        <input 
          id="login-email"
          {...register('email')}
          type="email" 
          autoFocus
          className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.email ? 'border-red-300' : 'border-slate-300'}`}
          placeholder="Your email address" 
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="login-password" className="sr-only">Password</label>
        <div className="relative">
          <input 
            id="login-password"
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.password ? 'border-red-300' : 'border-slate-300'}`}
            placeholder="Your password" 
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-teal-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isLoading}
        className="w-full mt-2 group relative flex items-center justify-center py-3.5 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition-all shadow-sm shadow-teal-100 disabled:opacity-50 disabled:cursor-not-allowed">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Log In</span>}
      </button>

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center">
          <input 
            id="remember-me" 
            type="checkbox" 
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600 cursor-pointer" 
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-500 cursor-pointer select-none">Remember me</label>
        </div>
        <button 
          type="button" 
          onClick={() => { setIsForgotMode(true); setError(''); }}
          className="text-sm font-medium text-teal-600 hover:text-teal-500 transition-colors"
        >
          Forgot password?
        </button>
      </div>
    </form>
  );
};
