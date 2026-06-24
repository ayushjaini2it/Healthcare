import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabaseServices } from '../../services/supabaseServices';
import { Loader2, Stethoscope, Phone, Building2, MapPin, ShieldCheck, KeyRound, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { PasswordStrengthMeter, getPasswordStrength } from './PasswordStrengthMeter';
import { supabase } from '../../lib/supabase';

const doctorSignupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').refine(pwd => getPasswordStrength(pwd).canSubmit, { message: 'Password is too weak' }),
  confirmPassword: z.string(),
  specialization: z.string().min(2, 'Specialization is required'),
  phone: z.string().min(5, 'Valid phone number required'),
  hospitalName: z.string().min(2, 'Hospital name is required'),
  hospitalAddress: z.string().min(5, 'Hospital address is required'),
  inviteCode: z.string().min(1, 'Invite code is required to register as a doctor'),
  tos: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms of Service' })
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type DoctorSignupData = z.infer<typeof doctorSignupSchema>;

interface DoctorSignupFormProps {
  onSuccess: (msg: string) => void;
  setError: (msg: string) => void;
  onSwitchToLogin: () => void;
}

export const DoctorSignupForm: React.FC<DoctorSignupFormProps> = ({ onSuccess, setError, onSwitchToLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [canSubmitPwd, setCanSubmitPwd] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Wizard steps: 1 = Account, 2 = Professional, 3 = Workplace & ToS
  const [step, setStep] = useState(1);

  const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm<DoctorSignupData>({
    resolver: zodResolver(doctorSignupSchema),
  });

  // Extract invite code from URL if present
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    if (inviteParam) {
      setValue('inviteCode', inviteParam);
      // We could optionally pre-fetch hospital name here, but the backend overrides it securely anyway.
    }
  }, [setValue]);

  const passwordValue = watch('password');

  const handleNextStep = async () => {
    if (step === 1) {
      const isStep1Valid = await trigger(['fullName', 'email', 'password', 'confirmPassword']);
      if (isStep1Valid && canSubmitPwd) {
        setStep(2);
        setError('');
      } else if (isStep1Valid && !canSubmitPwd) {
        setError('Please strengthen your password before continuing.');
      }
    } else if (step === 2) {
      const isStep2Valid = await trigger(['specialization', 'phone', 'inviteCode']);
      if (isStep2Valid) {
        setStep(3);
        setError('');
      }
    }
  };

  const onSubmit = async (data: DoctorSignupData) => {
    if (!canSubmitPwd) return;

    setIsLoading(true);
    setError('');
    try {
      await supabaseServices.authServices.signupDoctor(
        data.email, data.password, data.fullName, data.specialization, data.phone, data.hospitalName, data.hospitalAddress, data.inviteCode
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        onSuccess('Doctor account created! Please check your email to confirm your account before signing in.');
      } else {
        onSuccess(''); // Successfully logged in
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        setError('An account with this email already exists.');
      } else if (msg.toLowerCase().includes('invite code')) {
        setError(msg);
      } else {
        setError(msg || 'Something went wrong. Please try again or contact support.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step < 3) {
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
      <div className="flex items-center justify-between mb-6 px-1">
        <div className={`text-[10px] sm:text-xs font-bold ${step >= 1 ? 'text-teal-600' : 'text-slate-400'}`}>1. Account</div>
        <div className={`flex-1 h-1 mx-2 rounded-full ${step >= 2 ? 'bg-teal-600' : 'bg-slate-100'}`}></div>
        <div className={`text-[10px] sm:text-xs font-bold ${step >= 2 ? 'text-teal-600' : 'text-slate-400'}`}>2. Profile</div>
        <div className={`flex-1 h-1 mx-2 rounded-full ${step >= 3 ? 'bg-teal-600' : 'bg-slate-100'}`}></div>
        <div className={`text-[10px] sm:text-xs font-bold ${step >= 3 ? 'text-teal-600' : 'text-slate-400'}`}>3. Verify</div>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label htmlFor="doctor-name" className="sr-only">Full Name</label>
            <input 
              id="doctor-name"
              {...register('fullName')}
              type="text" 
              autoComplete="name"
              autoFocus
              className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.fullName ? 'border-red-300' : 'border-slate-300'}`}
              placeholder="Dr. Full Name" 
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div>
            <label htmlFor="doctor-email" className="sr-only">Email Address</label>
            <input 
              id="doctor-email"
              {...register('email')}
              type="email" 
              autoComplete="email"
              className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.email ? 'border-red-300' : 'border-slate-300'}`}
              placeholder="Your email address" 
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="doctor-password" className="sr-only">Password</label>
            <div className="relative">
              <input 
                id="doctor-password"
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
            <label htmlFor="doctor-confirm-password" className="sr-only">Confirm Password</label>
            <div className="relative">
              <input 
                id="doctor-confirm-password"
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
        <div className="space-y-4 animate-fade-in p-4 bg-teal-50 border border-teal-100 rounded-2xl">
          <p className="text-xs text-teal-600 font-semibold flex items-center gap-1.5 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Healthcare professional details
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Specialization</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                <Stethoscope className="h-5 w-5" />
              </div>
              <input {...register('specialization')} type="text" autoFocus
                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all ${errors.specialization ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="e.g. Cardiologist" />
            </div>
            {errors.specialization && <p className="mt-1 text-xs text-red-500">{errors.specialization.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Contact Number</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                <Phone className="h-5 w-5" />
              </div>
              <input {...register('phone')} type="tel" autoComplete="tel"
                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all ${errors.phone ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="+91 98765 43210" />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Doctor Invite Code</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                <KeyRound className="h-5 w-5" />
              </div>
              <input {...register('inviteCode')} type="text" autoComplete="off"
                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 tracking-widest font-mono ${errors.inviteCode ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="e.g. HC-2026-DOC" />
            </div>
            {errors.inviteCode && <p className="mt-1 text-xs text-red-500">{errors.inviteCode.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-3.5 border border-slate-200 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button 
              type="button" 
              onClick={handleNextStep}
              className="flex-1 group relative flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-slate-800 hover:bg-slate-700 focus:outline-none transition-all shadow-sm">
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Hospital / Clinic Name</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                <Building2 className="h-5 w-5" />
              </div>
              <input {...register('hospitalName')} type="text" autoComplete="organization" autoFocus
                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all ${errors.hospitalName ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="e.g. City General Hospital" />
            </div>
            <p className="text-xs text-slate-500 mt-1 mb-1">If your invite code is locked to a hospital, it will automatically override this field.</p>
            {errors.hospitalName && <p className="mt-1 text-xs text-red-500">{errors.hospitalName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Hospital Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                <MapPin className="h-5 w-5" />
              </div>
              <input {...register('hospitalAddress')} type="text" autoComplete="street-address"
                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all ${errors.hospitalAddress ? 'border-red-300' : 'border-slate-300'}`}
                placeholder="123 Medical Lane, City, State" />
            </div>
            {errors.hospitalAddress && <p className="mt-1 text-xs text-red-500">{errors.hospitalAddress.message}</p>}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mt-4">
            <div className="flex items-start gap-3">
              <input 
                id="doctor-tos"
                {...register('tos')}
                type="checkbox" 
                className={`mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600 cursor-pointer ${errors.tos ? 'border-red-400 ring-1 ring-red-400' : ''}`} 
              />
              <label htmlFor="doctor-tos" className="text-sm text-slate-600 leading-tight">
                I agree to the <a href="/terms" target="_blank" className="text-teal-600 font-medium hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-teal-600 font-medium hover:underline">Privacy Policy</a>, and verify my medical credentials are valid.
              </label>
            </div>
            {errors.tos && <p className="mt-1 ml-7 text-xs text-red-500">{errors.tos.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 group relative flex items-center justify-center py-3.5 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition-all shadow-sm shadow-teal-100 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Create Doctor Account</span>}
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
