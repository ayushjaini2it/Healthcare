import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Stethoscope, ChevronDown, ChevronUp } from 'lucide-react';

export const AboutUs: React.FC = () => (
  <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-white min-h-[70vh] rounded-xl shadow-sm mt-8 border border-slate-100">
    <h1 className="text-3xl font-bold text-slate-900 mb-6">About Health Connect</h1>
    <p className="text-slate-600 mb-4 leading-relaxed">
      Health Connect is dedicated to revolutionizing the healthcare experience by seamlessly connecting patients with qualified healthcare professionals. Our mission is to make healthcare accessible, efficient, and transparent.
    </p>
    <p className="text-slate-600 mb-4 leading-relaxed">
      Founded with the vision of a connected medical ecosystem, we empower both patients and doctors through secure data management, streamlined appointments, and comprehensive digital records.
    </p>
    <div className="mt-8">
      <Link to="/" className="text-teal-600 hover:text-teal-700 font-medium">← Back to Home</Link>
    </div>
  </div>
);

export const Contact: React.FC = () => (
  <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-white min-h-[70vh] rounded-xl shadow-sm mt-8 border border-slate-100">
    <h1 className="text-3xl font-bold text-slate-900 mb-6">Contact Us</h1>
    <p className="text-slate-600 mb-6 leading-relaxed">
      We're here to help. If you have any questions, concerns, or feedback, please reach out to our team directly.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-700 mt-8">
      <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-slate-900">Lokesh Jhuria</h2>
        <p className="text-teal-600 font-medium mb-4">Creator and Coordinator</p>
        <div className="space-y-3">
          <p className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium">Email</span>
            <a href="mailto:lokeshjhuria7@gmail.com" className="text-slate-900 hover:text-teal-600 transition-colors font-medium">lokeshjhuria7@gmail.com</a>
          </p>
          <p className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium">Phone</span>
            <a href="tel:+919257944985" className="text-slate-900 hover:text-teal-600 transition-colors font-medium">+91 92579 44985</a>
          </p>
        </div>
        <div className="mt-8">
          <a href="mailto:lokeshjhuria7@gmail.com" className="inline-block px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-bold shadow-sm">
            Send Email
          </a>
        </div>
      </div>

      <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-slate-900">Ayush Jain</h2>
        <p className="text-teal-600 font-medium mb-4">Developer</p>
        <div className="space-y-3">
          <p className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium">Email</span>
            <a href="mailto:ayushjain.aj2006@gmail.com" className="text-slate-900 hover:text-teal-600 transition-colors font-medium">ayushjain.aj2006@gmail.com</a>
          </p>
          <p className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium">Phone</span>
            <a href="tel:+917709973114" className="text-slate-900 hover:text-teal-600 transition-colors font-medium">+91 7709973114</a>
          </p>
        </div>
        <div className="mt-8">
          <a href="mailto:ayushjain.aj2006@gmail.com" className="inline-block px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-bold shadow-sm">
            Send Email
          </a>
        </div>
      </div>
    </div>

    <div className="mt-10 pt-6 border-t border-slate-100">
      <Link to="/" className="text-teal-600 hover:text-teal-700 font-medium">← Back to Home</Link>
    </div>
  </div>
);

export const PrivacyPolicy: React.FC = () => (
  <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-white min-h-[70vh] rounded-xl shadow-sm mt-8 border border-slate-100">
    <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
    <p className="text-slate-600 mb-4 leading-relaxed">
      Your privacy and the security of your medical data are our top priorities. Health Connect is fully compliant with HIPAA and standard data protection regulations.
    </p>
    <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Data Collection</h2>
    <p className="text-slate-600 mb-4 leading-relaxed">
      We collect personal and medical information solely for the purpose of providing you with healthcare services. This includes profile details, medical history, and consultation notes.
    </p>
    <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Data Security</h2>
    <p className="text-slate-600 mb-4 leading-relaxed">
      All data is encrypted at rest and in transit. Access to your records is strictly limited to you and your authorized healthcare providers.
    </p>
    <div className="mt-8">
      <Link to="/" className="text-teal-600 hover:text-teal-700 font-medium">← Back to Home</Link>
    </div>
  </div>
);

export const Resources: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-white min-h-[70vh] rounded-xl shadow-sm mt-8 border border-slate-100">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Medical Resources</h1>
      <p className="text-slate-600 mb-6 leading-relaxed">
        Access our library of healthcare guides, technical documentation for doctors, and platform tutorials.
      </p>
      
      <div className="space-y-4">
        {/* Patient Guide */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <button 
            onClick={() => toggleSection('patient')}
            className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="bg-teal-100 p-2 rounded-lg mr-4">
                <BookOpen className="h-6 w-6 text-teal-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-900">Patient Guide & Tutorials</h3>
                <p className="text-sm text-slate-500 mt-1">Learn how to maximize your Health Connect dashboard.</p>
              </div>
            </div>
            {openSection === 'patient' ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
          </button>
          
          {openSection === 'patient' && (
            <div className="p-6 border-t border-slate-200 bg-slate-50 text-left">
              <h4 className="font-semibold text-slate-800 mb-3">Getting Started</h4>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 mb-4">
                <li><strong>Registration:</strong> Complete your profile and medical history securely.</li>
                <li><strong>Booking Appointments:</strong> Use the interactive calendar to find specialized doctors in your area.</li>
                <li><strong>Managing Records:</strong> Access your lab results, prescriptions, and billing invoices from your personal dashboard.</li>
              </ul>
              <p className="text-sm text-slate-600">
                Need more help? Visit our <Link to="/contact" className="text-teal-600 hover:underline">Contact Page</Link> for direct support.
              </p>
            </div>
          )}
        </div>

        {/* Provider Documentation */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <button 
            onClick={() => toggleSection('provider')}
            className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-lg mr-4">
                <Stethoscope className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-900">Provider Documentation</h3>
                <p className="text-sm text-slate-500 mt-1">Integration and best practices for healthcare providers.</p>
              </div>
            </div>
            {openSection === 'provider' ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
          </button>
          
          {openSection === 'provider' && (
            <div className="p-6 border-t border-slate-200 bg-slate-50 text-left">
              <h4 className="font-semibold text-slate-800 mb-3">Clinical Workflows</h4>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                <li><strong>Consultation Pipeline:</strong> Manage patient states from "Registered" to "Discharged".</li>
                <li><strong>Prescriptions:</strong> Issue digital prescriptions that integrate directly with the in-house Pharmacy module.</li>
                <li><strong>Compliance:</strong> All data transactions comply with standard EHR (Electronic Health Record) encryption policies.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 text-left">
        <Link to="/" className="text-teal-600 hover:text-teal-700 font-medium">← Back to Home</Link>
      </div>
    </div>
  );
};
