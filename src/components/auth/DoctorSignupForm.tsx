import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabaseServices } from '../../services/supabaseServices';
import { Loader2, Stethoscope, Phone, Building2, MapPin, ShieldCheck, KeyRound } from 'lucide-react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { supabase } from '../../lib/supabase';

const doctorSignupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  specialization: z.string().min(2, 'Specialization is required'),
  phone: z.string().min(5, 'Valid phone number required'),
  hospitalName: z.string().min(2, 'Hospital name is required'),
  hospitalAddress: z.string().min(5, 'Hospital address is required'),
  inviteCode: z.string().min(1, 'Doctor invite code is required'),
});

type DoctorSignupData = z.infer<typeof doctorSignupSchema>;

interface DoctorSignupFormProps {
  onSuccess: (msg: string) => void;
  setError: (msg: string) => void;
}

export const DoctorSignupForm: React.FC<DoctorSignupFormProps> = ({ onSuccess, setError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [canSubmitPwd, setCanSubmitPwd] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<DoctorSignupData>({
    resolver: zodResolver(doctorSignupSchema),
  });

  const passwordValue = watch('password');

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
        setError('An account with this email already exists. Try signing in instead.');
      } else if (msg.toLowerCase().includes('invalid invite code') || msg.toLowerCase().includes('invite')) {
        setError('Invalid or inactive doctor invite code. Please contact your administrator.');
      } else {
        setError(msg || 'Something went wrong. Please try again or contact support.');
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
          autoComplete="name"
          className={`w-full px-4 py-3.5 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.fullName ? 'border-red-300' : 'border-slate-300'}`}
          placeholder="Your full name" 
        />
        {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
      </div>

      {/* Invite Code */}
      <div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
            <KeyRound className="h-5 w-5" />
          </div>
          <input
            {...register('inviteCode')}
            type="text"
            autoComplete="off"
            className={`w-full pl-11 pr-4 py-3.5 bg-amber-50 border rounded-xl focus:ring-2 focus:ring-amber-400/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400 font-mono tracking-wider ${
              errors.inviteCode ? 'border-red-300' : 'border-amber-200'
            }`}
            placeholder="Doctor Invite Code (e.g. HC-2026-DOC)"
          />
        </div>
        {errors.inviteCode && <p className="mt-1 text-xs text-red-500">{errors.inviteCode.message}</p>}
        <p className="mt-1 text-xs text-amber-600 font-medium">🔑 Contact your hospital administrator for an invite code.</p>
      </div>

      <div className="space-y-4 p-4 bg-teal-50 border border-teal-100 rounded-2xl">
        <p className="text-xs text-teal-600 font-semibold flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Healthcare professional details
        </p>

        {/* Specialization */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Specialization</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
              <Stethoscope className="h-5 w-5" />
            </div>
            <input {...register('specialization')} type="text"
              className={`w-full pl-11 pr-4 py-3 bg-white border rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all ${errors.specialization ? 'border-red-300' : 'border-slate-100'}`}
              placeholder="e.g. Cardiologist" />
          </div>
          {errors.specialization && <p className="mt-1 text-xs text-red-500">{errors.specialization.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Contact Number</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
              <Phone className="h-5 w-5" />
            </div>
            <input {...register('phone')} type="tel" autoComplete="tel"
              className={`w-full pl-11 pr-4 py-3 bg-white border rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all ${errors.phone ? 'border-red-300' : 'border-slate-100'}`}
              placeholder="+91 98765 43210" />
          </div>
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        {/* Hospital Name */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Hospital / Clinic Name</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
              <Building2 className="h-5 w-5" />
            </div>
            <input {...register('hospitalName')} type="text" autoComplete="organization"
              className={`w-full pl-11 pr-4 py-3 bg-white border rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all ${errors.hospitalName ? 'border-red-300' : 'border-slate-100'}`}
              placeholder="e.g. City General Hospital" />
          </div>
          {errors.hospitalName && <p className="mt-1 text-xs text-red-500">{errors.hospitalName.message}</p>}
        </div>

        {/* Hospital Address */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Hospital Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
              <MapPin className="h-5 w-5" />
            </div>
            <input {...register('hospitalAddress')} type="text" autoComplete="street-address"
              className={`w-full pl-11 pr-4 py-3 bg-white border rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all ${errors.hospitalAddress ? 'border-red-300' : 'border-slate-100'}`}
              placeholder="123 Medical Lane, City, State" />
          </div>
          {errors.hospitalAddress && <p className="mt-1 text-xs text-red-500">{errors.hospitalAddress.message}</p>}
        </div>
      </div>

      <div>
        <input 
          {...register('email')}
          type="email" 
          autoComplete="email"
          className={`w-full px-4 py-3.5 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.email ? 'border-red-300' : 'border-slate-300'}`}
          placeholder="Your email address" 
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <input 
          {...register('password')}
          type="password" 
          autoComplete="new-password"
          className={`w-full px-4 py-3.5 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${errors.password || (passwordValue && !canSubmitPwd) ? 'border-red-300' : 'border-slate-300'}`}
          placeholder="Create a password" 
        />
        <PasswordStrengthMeter password={passwordValue} onStrengthChange={setCanSubmitPwd} />
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isLoading || (!!passwordValue && !canSubmitPwd)}
        className="w-full mt-2 group relative flex items-center justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Create Doctor Account</span>}
      </button>
    </form>
  );
};
