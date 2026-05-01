import React from 'react'

const Billing: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-3xl w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-10 text-center">
        <div className="inline-flex items-center justify-center mx-auto mb-6 h-16 w-16 rounded-full bg-indigo-100 text-indigo-700">
          <span className="text-2xl font-bold">?</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Billing Page</h1>
        <p className="text-lg text-gray-600 leading-8">
          This section is currently under progress and will be available in the next update.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Thank you for your patience while we complete the billing and payment workflow.
        </p>
      </div>
    </div>
  )
}

export default Billing
