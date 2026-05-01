import React from 'react'

const Pharmacy: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6">
      <div className="max-w-3xl w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-10 text-center">
        <div className="inline-flex items-center justify-center mx-auto mb-6 h-16 w-16 rounded-full bg-emerald-100 text-emerald-700">
          <span className="text-2xl font-bold">??</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Pharmacy Page</h1>
        <p className="text-lg text-slate-600 leading-8">
          This section is currently under progress and will be available in the next update.
        </p>
        <p className="text-sm text-slate-400 mt-4">
          We are working on medication dispensing and pharmacy features now.
        </p>
      </div>
    </div>
  )
}

export default Pharmacy
