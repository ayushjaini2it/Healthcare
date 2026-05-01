import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabaseServices } from '../services/supabaseServices'
import { supabase } from '../lib/supabase'
import { User, Mail, Lock, UserPlus, LogIn, Loader2, Phone, Building2, MapPin, Stethoscope } from 'lucide-react'

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [role, setRole] = useState<'doctor' | 'patient'>('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [phone, setPhone] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [hospitalAddress, setHospitalAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isLogin) {
        await supabaseServices.authServices.signIn(email, password)
        navigate('/')
      } else {
        await (role === 'doctor'
          ? supabaseServices.authServices.signupDoctor(email, password, fullName, specialization, phone, hospitalName, hospitalAddress)
          : supabaseServices.authServices.signupPatient(email, password, fullName)
        )
        
        // Check if user is signed in after signup
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Wait a bit for the session to propagate
          setTimeout(() => navigate('/'), 100)
        } else {
          // If not signed in, show a message
          setError('Account created successfully! Please check your email to confirm your account before signing in.')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

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
          {/* Background decorative elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-100 rounded-full blur-3xl opacity-50"></div>

          <div className="relative z-10">
            {/* Toggle Login/Signup */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  !isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  {/* Role Selection */}
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <button
                      type="button"
                      onClick={() => setRole('patient')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                        role === 'patient'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span className="text-sm font-bold">Patient</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('doctor')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                        role === 'doctor'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <Stethoscope className="h-4 w-4" />
                      <span className="text-sm font-bold">Doctor</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                      Full Name
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {role === 'doctor' && (
                    <div className="space-y-4 animate-slideDown">
                      {/* Specialization */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                          Specialization
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            <Stethoscope className="h-5 w-5" />
                          </div>
                          <input
                            type="text"
                            required={role === 'doctor'}
                            value={specialization}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpecialization(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. Cardiologist"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                          Contact Number
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            <Phone className="h-5 w-5" />
                          </div>
                          <input
                            type="tel"
                            required={role === 'doctor'}
                            value={phone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>

                      {/* Hospital Name */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                          Hospital / Clinic Name
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <input
                            type="text"
                            required={role === 'doctor'}
                            value={hospitalName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHospitalName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. City General Hospital"
                          />
                        </div>
                      </div>

                      {/* Hospital Address */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                          Hospital Address
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <input
                            type="text"
                            required={role === 'doctor'}
                            value={hospitalAddress}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHospitalAddress(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="123 Medical Lane, City, State"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative flex items-center justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-200"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? (
                      <span className="flex items-center gap-2">
                        Sign In <LogIn className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Create Account <UserPlus className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500 font-medium">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-indigo-600 hover:text-indigo-500 font-bold underline underline-offset-4 decoration-2 decoration-indigo-100 hover:decoration-indigo-300 transition-all"
              >
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
