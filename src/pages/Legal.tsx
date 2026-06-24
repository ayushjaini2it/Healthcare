import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Legal: React.FC = () => {
  const location = useLocation();
  const isPrivacy = location.pathname === '/privacy';
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="bg-teal-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-teal-100 hover:text-white transition-colors mb-6 font-medium">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-5xl font-extrabold">{title}</h1>
          <p className="text-teal-100 mt-4">Last updated: June 24, 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-12 prose prose-slate max-w-none">
          {isPrivacy ? (
            <>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="mb-6 text-slate-600 leading-relaxed">At Health Connect, we take your privacy and the security of your health information seriously. This Privacy Policy outlines how we collect, use, and protect your data in compliance with HIPAA and applicable healthcare data regulations.</p>
              
              <h2 className="text-2xl font-bold mb-4">2. Data Collection</h2>
              <p className="mb-6 text-slate-600 leading-relaxed">We collect information necessary to provide you with healthcare management services, including personal identification, medical history (when provided), and appointment records.</p>
              
              <h2 className="text-2xl font-bold mb-4">3. Data Security (HIPAA Compliance)</h2>
              <p className="mb-6 text-slate-600 leading-relaxed">Your protected health information (PHI) is encrypted at rest and in transit. We implement strict access controls and regular security audits to ensure your data remains confidential.</p>
              
              <h2 className="text-2xl font-bold mb-4">4. Sharing of Information</h2>
              <p className="mb-6 text-slate-600 leading-relaxed">We do not sell your personal data. Information is only shared with your chosen healthcare providers to facilitate your care.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-6 text-slate-600 leading-relaxed">By accessing and using the Health Connect platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
              
              <h2 className="text-2xl font-bold mb-4">2. Use of Services</h2>
              <p className="mb-6 text-slate-600 leading-relaxed">Health Connect provides a platform for booking appointments and managing health records. We are a technology provider, not a medical provider. For medical emergencies, please dial 911 immediately.</p>
              
              <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
              <p className="mb-6 text-slate-600 leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials and for ensuring the accuracy of the health information you provide.</p>
              
              <h2 className="text-2xl font-bold mb-4">4. Limitation of Liability</h2>
              <p className="mb-6 text-slate-600 leading-relaxed">Health Connect is not liable for the medical advice or services provided by healthcare professionals accessed through our platform.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Legal;
