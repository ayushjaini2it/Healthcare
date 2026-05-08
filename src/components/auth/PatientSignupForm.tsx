import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabaseServices } from '../../services/supabaseServices';
import { Loader2 } from 'lucide-react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { supabase } from '../../lib/supabase';

const patientSignupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type PatientSignupData = z.infer<typeof patientSignupSchema>;

interface PatientSignupFormProps {
  onSuccess: (msg: string) => void;
  setError: (msg: string) => void;
}

export const PatientSignupForm: React.FC<PatientSignupFormProps> = ({ onSuccess, setError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [canSubmitPwd, setCanSubmitPwd] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<PatientSignupData>({
    resolver: zodResolver(patientSignupSchema),
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: PatientSignupData) => {
    if (!canSubmitPwd) return;

    setIsLoading(true);
    setError('');
    try {
      await supabaseServices.authServices.signupPatient(data.email, data.password, data.fullName);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        onSuccess('Account created! Please check your email to confirm your account before signing in.');
      } else {
        onSuccess(''); // Successfully logged in
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        setError('An account with this email already exists. Try signing in instead.');
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
          {...register('fullName')}
          type="text" 
          className={`w-full px-4 py-3.5 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.fullName ? 'border-red-300' : 'border-slate-300'}`}
          placeholder="Your full name" 
        />
        {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
      </div>

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
          className={`w-full px-4 py-3.5 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.password || (passwordValue && !canSubmitPwd) ? 'border-red-300' : 'border-slate-300'}`}
          placeholder="Create a password" 
        />
        <PasswordStrengthMeter password={passwordValue} onStrengthChange={setCanSubmitPwd} />
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isLoading || (!!passwordValue && !canSubmitPwd)}
        className="w-full mt-2 group relative flex items-center justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-[#a3b1c6] hover:bg-teal-600 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Create Patient Account</span>}
      </button>
    </form>
  );
};
