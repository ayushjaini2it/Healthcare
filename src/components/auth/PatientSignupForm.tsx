import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabaseServices } from '../../services/supabaseServices';
import { Loader2, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { PasswordStrengthMeter, getPasswordStrength } from './PasswordStrengthMeter';
import { supabase } from '../../lib/supabase';

const patientSignupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').refine(pwd => getPasswordStrength(pwd).canSubmit, { message: 'Password is too weak' }),
  confirmPassword: z.string(),
  age: z.coerce.number().min(1, 'Age must be at least 1').max(120, 'Invalid age'),
  gender: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'Please select a gender' }) }),
  tos: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms of Service' })
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PatientSignupData = z.infer<typeof patientSignupSchema>;

interface PatientSignupFormProps {
  onSuccess: (msg: string) => void;
  setError: (msg: string) => void;
  onSwitchToLogin: () => void;
}

export const PatientSignupForm: React.FC<PatientSignupFormProps> = ({ onSuccess, setError, onSwitchToLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [canSubmitPwd, setCanSubmitPwd] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Wizard steps: 1 = Account Info, 2 = Demographics & ToS
  const [step, setStep] = useState(1);

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<PatientSignupData>({
    resolver: zodResolver(patientSignupSchema),
    defaultValues: {
      gender: 'other',
    }
  });

  const passwordValue = watch('password');

  const handleNextStep = async () => {
    // Validate step 1 fields before proceeding
    const isStep1Valid = await trigger(['fullName', 'email', 'password', 'confirmPassword']);
    if (isStep1Valid && canSubmitPwd) {
      setStep(2);
      setError('');
    } else if (isStep1Valid && !canSubmitPwd) {
      setError('Please strengthen your password before continuing.');
    }
  };

  const onSubmit = async (data: PatientSignupData) => {
    if (!canSubmitPwd) return;

    setIsLoading(true);
    setError('');
    try {
      await supabaseServices.authServices.signupPatient(data.email, data.password, data.fullName, data.age, data.gender);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        onSuccess('Account created! Please check your email to confirm your account before signing in.');
      } else {
        onSuccess(''); // Successfully logged in
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        setError('An account with this email already exists.');
      } else {
        setError('Something went wrong. Please try again or contact support.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step < 2) {
      e.preventDefault();
      handleNextStep();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
           <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        </div>
      )}

      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className={`text-xs font-bold ${step >= 1 ? 'text-teal-600' : 'text-slate-400'}`}>1. Account</div>
        <div className={`flex-1 h-1 mx-3 rounded-full ${step >= 2 ? 'bg-teal-600' : 'bg-slate-100'}`}></div>
        <div className={`text-xs font-bold ${step >= 2 ? 'text-teal-600' : 'text-slate-400'}`}>2. Details</div>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label htmlFor="patient-name" className="sr-only">Full Name</label>
            <input 
              id="patient-name"
              {...register('fullName')}
              type="text" 
              autoComplete="name"
              autoFocus
              className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.fullName ? 'border-red-300' : 'border-slate-300'}`}
              placeholder="Your full name" 
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div>
            <label htmlFor="patient-email" className="sr-only">Email Address</label>
            <input 
              id="patient-email"
              {...register('email')}
              type="email" 
              autoComplete="email"
              className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.email ? 'border-red-300' : 'border-slate-300'}`}
              placeholder="Your email address" 
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="patient-password" className="sr-only">Password</label>
            <div className="relative">
              <input 
                id="patient-password"
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.password || (passwordValue && !canSubmitPwd) ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="Create a password" 
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
            <PasswordStrengthMeter password={passwordValue} onStrengthChange={setCanSubmitPwd} />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="patient-confirm-password" className="sr-only">Confirm Password</label>
            <div className="relative">
              <input 
                id="patient-confirm-password"
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.confirmPassword ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="Confirm password" 
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-teal-600 transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="button" 
            onClick={handleNextStep}
            className="w-full mt-2 group relative flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-slate-800 hover:bg-slate-700 focus:outline-none transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <span>Continue</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="patient-age" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Age</label>
              <input 
                id="patient-age"
                {...register('age')}
                type="number"
                autoFocus
                min="1"
                className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.age ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="Years" 
              />
              {errors.age && <p className="mt-1 text-xs text-red-500">{errors.age.message}</p>}
            </div>

            <div className="flex-1">
              <label htmlFor="patient-gender" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Gender</label>
              <select 
                id="patient-gender"
                {...register('gender')}
                className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all ${errors.gender ? 'border-red-300' : 'border-slate-300'}`}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mt-4">
            <div className="flex items-start gap-3">
              <input 
                id="patient-tos"
                {...register('tos')}
                type="checkbox" 
                className={`mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600 cursor-pointer ${errors.tos ? 'border-red-400 ring-1 ring-red-400' : ''}`} 
              />
              <label htmlFor="patient-tos" className="text-sm text-slate-600 leading-tight">
                I (or my parent/guardian) agree to the <a href="/terms" target="_blank" className="text-teal-600 font-medium hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-teal-600 font-medium hover:underline">Privacy Policy</a>, including the processing of my medical data.
              </label>
            </div>
            {errors.tos && <p className="mt-1 ml-7 text-xs text-red-500">{errors.tos.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button type="submit" disabled={isLoading || (!!passwordValue && !canSubmitPwd)}
              className="flex-1 group relative flex items-center justify-center py-3.5 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition-all shadow-sm shadow-teal-100 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Create Account</span>}
            </button>
          </div>
        </div>
      )}
      
      {/* Action link for error state */}
      {errors.root && (
         <div className="mt-2 text-center text-sm">
            <button type="button" onClick={onSwitchToLogin} className="text-teal-600 font-bold underline">
              Sign in instead
            </button>
         </div>
      )}
    </form>
  );
};
