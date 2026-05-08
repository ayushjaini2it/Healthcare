import React, { useState, useEffect } from 'react'
import { supabaseServices } from '../services/supabaseServices'
import { supabase } from '../lib/supabase'
import {
  User, Mail, Lock, UserPlus, LogIn, Loader2,
  Phone, Building2, MapPin, Stethoscope, ShieldCheck,
} from 'lucide-react'

// ─── Password strength engine ────────────────────────────────────────────────
interface StrengthResult {
  score: number      // 0-5
  label: string
  color: string      // tailwind bg class for bar
  textColor: string  // tailwind text class for label
  canSubmit: boolean // require minimum "Good" (score >= 3)
}

function getPasswordStrength(pwd: string): StrengthResult {
  let score = 0
  if (pwd.length >= 8)               score++ // basic length
  if (pwd.length >= 12)              score++ // longer = better
  if (/[A-Z]/.test(pwd))            score++ // uppercase
  if (/[0-9]/.test(pwd))            score++ // number
  if (/[^A-Za-z0-9]/.test(pwd))    score++ // special char

  if (score <= 1) return { score, label: 'Weak',   color: 'bg-red-500',    textColor: 'text-red-600',    canSubmit: false }
  if (score === 2) return { score, label: 'Fair',   color: 'bg-orange-500', textColor: 'text-orange-600', canSubmit: false }
  if (score === 3) return { score, label: 'Good',   color: 'bg-yellow-500', textColor: 'text-yellow-600', canSubmit: true  }
  if (score === 4) return { score, label: 'Strong', color: 'bg-green-400',  textColor: 'text-green-600',  canSubmit: true  }
  return              { score, label: 'Very Strong', color: 'bg-green-600', textColor: 'text-green-700',  canSubmit: true  }
}

// ─── Component ───────────────────────────────────────────────────────────────
const Auth: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Doctor-specific
  const [isDoctorSignup, setIsDoctorSignup] = useState(false)
  const [location, setLocation] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [phone, setPhone] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [hospitalAddress, setHospitalAddress] = useState('')

  // Password state
  const [strength, setStrength] = useState<StrengthResult | null>(null)

  useEffect(() => {
    const savedError = sessionStorage.getItem('auth_error')
    if (savedError) {
      setError(savedError)
      sessionStorage.removeItem('auth_error')
    }
  }, [])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPassword(val)
    if (!isLogin && val.length > 0) {
      setStrength(getPasswordStrength(val))
    } else {
      setStrength(null)
    }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side guards on signup
    if (!isLogin) {
      // Must meet "Good" or better strength
      const s = getPasswordStrength(password)
      if (!s.canSubmit) {
        setStrength(s)
        return
      }


    }

    setIsLoading(true)
    try {
      if (isLogin) {
        await supabaseServices.authServices.signIn(email, password)
        // App.tsx session listener auto-redirects
      } else if (isDoctorSignup) {
        await supabaseServices.authServices.signupDoctor(
          email, password, fullName, specialization, phone, hospitalName, hospitalAddress
        )
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Doctor account created! Please check your email to confirm your account before signing in.')
        }
      } else {
        await supabaseServices.authServices.signupPatient(email, password, fullName)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Account created! Please check your email to confirm your account before signing in.')
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      const msg: string = err?.message || ''
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        setError('An account with this email already exists. Try signing in instead.')
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Please confirm your email address before signing in.')
      } else if (msg.includes('Account data missing')) {
        setError(msg)
      } else {
        setError('Something went wrong. Please try again or contact support.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = (login: boolean) => {
    setIsLogin(login)
    setError('')
    setError('')
    setStrength(null)
    setIsDoctorSignup(false)
  }

  const isSubmitDisabled = isLoading || (!isLogin && !!strength && !strength.canSubmit)

  // Strength bar width
  const barWidth = strength ? `${(strength.score / 5) * 100}%` : '0%'

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
        <div className="mb-8 pr-12">
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



            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0"></div>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  {/* Full Name */}
                  <div>
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                      className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
                      placeholder="Your full name" />
                  </div>

                  {/* Healthcare professional opt-in */}
                  <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100 cursor-pointer"
                    onClick={() => { setIsDoctorSignup(v => !v); }}>
                    <input type="checkbox" id="doctorCheck" checked={isDoctorSignup} onChange={() => {}}
                      className="h-4 w-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 pointer-events-none" />
                    <label htmlFor="doctorCheck" className="flex items-center gap-2 text-sm font-semibold text-teal-700 pointer-events-none">
                      <Stethoscope className="h-4 w-4" />
                      I am a registered healthcare professional
                    </label>
                  </div>

                  {/* Doctor-only fields */}
                  {isDoctorSignup && (
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
                          <input type="text" required={isDoctorSignup} value={specialization}
                            onChange={e => setSpecialization(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            placeholder="e.g. Cardiologist" />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Contact Number</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                            <Phone className="h-5 w-5" />
                          </div>
                          <input type="tel" required={isDoctorSignup} value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            placeholder="+91 98765 43210" />
                        </div>
                      </div>

                      {/* Hospital Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Hospital / Clinic Name</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <input type="text" required={isDoctorSignup} value={hospitalName}
                            onChange={e => setHospitalName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            placeholder="e.g. City General Hospital" />
                        </div>
                      </div>

                      {/* Hospital Address */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Hospital Address</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <input type="text" required={isDoctorSignup} value={hospitalAddress}
                            onChange={e => setHospitalAddress(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            placeholder="123 Medical Lane, City, State" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Email */}
              <div>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Your username or email" />
              </div>

              {/* Password */}
              <div>
                <input type="password" required value={password} onChange={handlePasswordChange}
                  className={`w-full px-4 py-3.5 bg-white border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 ${strength && !strength.canSubmit ? 'border-red-300' : 'border-slate-300'}`}
                  placeholder="Your password" />

                {/* ── Password strength meter (signup only) ── */}
                {!isLogin && strength && (
                  <div className="mt-2 space-y-1.5">
                    {/* Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: barWidth }}
                      />
                    </div>
                    {/* Label + requirements */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 text-xs text-slate-400">
                        <span className={/[A-Z]/.test(password) ? 'text-green-600 font-medium' : ''}>ABC</span>
                        <span className={/[0-9]/.test(password) ? 'text-green-600 font-medium' : ''}>123</span>
                        <span className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600 font-medium' : ''}>!@#</span>
                        <span className={password.length >= 8 ? 'text-green-600 font-medium' : ''}>8+</span>
                        <span className={password.length >= 12 ? 'text-green-600 font-medium' : ''}>12+</span>
                      </div>
                      <span className={`text-xs font-bold ${strength.textColor}`}>{strength.label}</span>
                    </div>
                    {!strength.canSubmit && (
                      <p className="text-xs text-red-500 font-medium">
                        Add uppercase letters, numbers, and symbols to continue.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button type="submit" disabled={isSubmitDisabled}
                className="w-full mt-2 group relative flex items-center justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-[#a3b1c6] hover:bg-teal-600 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isLogin ? (
                  <span>Log In</span>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
              
              {isLogin && (
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center">
                    <input id="remember-me" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600" />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-500">Remember me</label>
                  </div>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">Forgot password?</a>
                </div>
              )}
            </form>

            <p className="mt-8 text-center text-sm text-slate-500 font-medium">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button type="button" onClick={() => switchMode(!isLogin)}
                className="text-teal-600 hover:text-teal-500 font-bold underline underline-offset-4 decoration-2 decoration-teal-100 hover:decoration-teal-300 transition-all">
                {isLogin ? 'Sign up for free' : 'Sign in to your account'}
              </button>
            </p>
        </div>
      </div>
  )
}

export default Auth
