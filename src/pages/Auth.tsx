import React, { useState, useEffect } from 'react'
import { supabaseServices } from '../services/supabaseServices'
import { supabase } from '../lib/supabase'
import {
  User, Mail, Lock, UserPlus, LogIn, Loader2,
  Phone, Building2, MapPin, Stethoscope, ShieldCheck, KeyRound,
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
const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Doctor-specific
  const [isDoctorSignup, setIsDoctorSignup] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteError, setInviteError] = useState('')
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

  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInviteCode(e.target.value)
    setInviteError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInviteError('')

    // Client-side guards on signup
    if (!isLogin) {
      // Must meet "Good" or better strength
      const s = getPasswordStrength(password)
      if (!s.canSubmit) {
        setStrength(s)
        return
      }

      // Doctor invite code validation
      if (isDoctorSignup) {
        const validCode = import.meta.env.VITE_DOCTOR_INVITE_CODE
        if (!inviteCode.trim()) {
          setInviteError('An invite code is required for healthcare professional accounts.')
          return
        }
        if (inviteCode.trim() !== validCode) {
          setInviteError('Invalid invite code. Contact your hospital administrator.')
          return
        }
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
    setInviteError('')
    setInviteCode('')
    setStrength(null)
    setIsDoctorSignup(false)
  }

  const isSubmitDisabled = isLoading || (!isLogin && !!strength && !strength.canSubmit)

  // Strength bar width
  const barWidth = strength ? `${(strength.score / 5) * 100}%` : '0%'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl shadow-lg shadow-indigo-200 mb-4 transform hover:scale-110 transition-transform duration-300">
            <img src="/logo.png" alt="Health-Connect Logo" className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Health-Connect</h1>
          <p className="text-gray-500 mt-2 font-medium">Your health, our priority</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 overflow-hidden relative">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-100 rounded-full blur-3xl opacity-50"></div>

          <div className="relative z-10">
            {/* Toggle Login/Signup */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
              <button type="button" onClick={() => switchMode(true)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                Sign In
              </button>
              <button type="button" onClick={() => switchMode(false)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${!isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                Sign Up
              </button>
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
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                        <User className="h-5 w-5" />
                      </div>
                      <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        placeholder="John Doe" />
                    </div>
                  </div>

                  {/* Healthcare professional opt-in */}
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 cursor-pointer"
                    onClick={() => { setIsDoctorSignup(v => !v); setInviteCode(''); setInviteError('') }}>
                    <input type="checkbox" id="doctorCheck" checked={isDoctorSignup} onChange={() => {}}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 pointer-events-none" />
                    <label htmlFor="doctorCheck" className="flex items-center gap-2 text-sm font-semibold text-indigo-700 pointer-events-none">
                      <Stethoscope className="h-4 w-4" />
                      I am a registered healthcare professional
                    </label>
                  </div>

                  {/* Doctor-only fields */}
                  {isDoctorSignup && (
                    <div className="space-y-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                      <p className="text-xs text-blue-600 font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Healthcare professional details — invite code required
                      </p>

                      {/* ── Invite Code ── */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                          Invite Code <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            <KeyRound className="h-5 w-5" />
                          </div>
                          <input type="text" required={isDoctorSignup} value={inviteCode}
                            onChange={handleInviteCodeChange}
                            className={`w-full pl-11 pr-4 py-3 bg-white border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono tracking-widest ${inviteError ? 'border-red-300' : 'border-gray-100'}`}
                            placeholder="HC-XXXX-XXXX" />
                        </div>
                        {inviteError && (
                          <p className="mt-1.5 text-xs text-red-500 font-medium ml-1">{inviteError}</p>
                        )}
                        <p className="mt-1.5 text-xs text-blue-500 ml-1">Provided by your hospital administrator.</p>
                      </div>

                      {/* Specialization */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Specialization</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            <Stethoscope className="h-5 w-5" />
                          </div>
                          <input type="text" required={isDoctorSignup} value={specialization}
                            onChange={e => setSpecialization(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. Cardiologist" />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Contact Number</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            <Phone className="h-5 w-5" />
                          </div>
                          <input type="tel" required={isDoctorSignup} value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="+91 98765 43210" />
                        </div>
                      </div>

                      {/* Hospital Name */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Hospital / Clinic Name</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <input type="text" required={isDoctorSignup} value={hospitalName}
                            onChange={e => setHospitalName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. City General Hospital" />
                        </div>
                      </div>

                      {/* Hospital Address */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Hospital Address</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <input type="text" required={isDoctorSignup} value={hospitalAddress}
                            onChange={e => setHospitalAddress(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="123 Medical Lane, City, State" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="name@example.com" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input type="password" required value={password} onChange={handlePasswordChange}
                    className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all ${strength && !strength.canSubmit ? 'border-red-200' : 'border-gray-100'}`}
                    placeholder={isLogin ? '••••••••' : 'Min 8 chars, uppercase, number, symbol'} />
                </div>

                {/* ── Password strength meter (signup only) ── */}
                {!isLogin && strength && (
                  <div className="mt-2 space-y-1.5">
                    {/* Bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: barWidth }}
                      />
                    </div>
                    {/* Label + requirements */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 text-xs text-gray-400">
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
                className="w-full group relative flex items-center justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-200">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isLogin ? (
                  <span className="flex items-center gap-2">Sign In <LogIn className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></span>
                ) : (
                  <span className="flex items-center gap-2">Create Account <UserPlus className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></span>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500 font-medium">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button type="button" onClick={() => switchMode(!isLogin)}
                className="text-indigo-600 hover:text-indigo-500 font-bold underline underline-offset-4 decoration-2 decoration-indigo-100 hover:decoration-indigo-300 transition-all">
                {isLogin ? 'Sign up for free' : 'Sign in to your account'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-6 text-gray-400 text-xs font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-indigo-500 transition-colors">Privacy Policy</a>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <a href="#" className="hover:text-indigo-500 transition-colors">Terms of Service</a>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <a href="#" className="hover:text-indigo-500 transition-colors">Support</a>
        </div>
      </div>
    </div>
  )
}

export default Auth
