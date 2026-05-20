import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabaseServices } from '../../services/supabaseServices';
import { Loader2 } from 'lucide-react';

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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <input 
          {...register('email')}
          type="email" 
          className={`w-full px-4 py-3.5 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.email ? 'border-red-300' : 'border-slate-300'}`}
          placeholder="Your email address" 
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <input 
          {...register('password')}
          type="password" 
          className={`w-full px-4 py-3.5 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.password ? 'border-red-300' : 'border-slate-300'}`}
          placeholder="Your password" 
        />
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isLoading}
        className="w-full mt-2 group relative flex items-center justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-[#a3b1c6] hover:bg-teal-600 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Log In</span>}
      </button>

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center">
          <input id="remember-me" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600" />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-500">Remember me</label>
        </div>
        <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">Forgot password?</a>
      </div>
    </form>
  );
};
