import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ContactUs: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Retrieve Web3Forms access key
    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      setError("Web3Forms access key is missing in environment configuration.");
      setIsLoading(false);
      return;
    }

    formData.append("access_key", accessKey);

    // Combine firstName and lastName for Web3Forms standard name parameter
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    formData.append("name", `${firstName} ${lastName}`);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        form.reset();
        // Hide success message after 7 seconds
        setTimeout(() => setIsSubmitted(false), 7000);
      } else {
        setError(data.message || "Failed to submit the form. Please try again.");
      }
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError("Network error: Your browser's adblocker or privacy shields might be blocking the form submission. Please temporarily disable it for this site and try again.");
      } else {
        setError("An error occurred. Please check your internet connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ─── HEADER ─── */}
      <div className="bg-teal-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-teal-100 hover:text-white transition-colors mb-6 font-medium">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Contact Us</h1>
          <p className="text-teal-100 mt-4 text-lg max-w-xl">
            Have questions or need assistance? We're here to help you navigate your healthcare journey.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-start">
          
          {/* ─── CONTACT INFORMATION ─── */}
          <div className="space-y-8">
            <div>
              <h2 className="text-sm font-bold tracking-widest text-teal-600 uppercase mb-3">Get in Touch</h2>
              <h3 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
                Let's start a conversation.
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Whether you're a patient looking for care, or a professional looking to join our network, our dedicated team is ready to assist you.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all space-y-8">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Email Us</h4>
                  <p className="text-slate-500 mb-2">Our friendly team is here to help.</p>
                  <a href="mailto:lokeshjhuria7@gmail.com" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                    lokeshjhuria7@gmail.com
                  </a>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Call Us</h4>
                  <p className="text-slate-500 mb-2">Mon-Fri from 8am to 5pm.</p>
                  <a href="tel:+919257944985" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                    +91 92579 44985
                  </a>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Office</h4>
                  <p className="text-slate-500">
                    Health Connect HQ<br />
                    123 Innovation Drive<br />
                    Tech District, 400001
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── CONTACT FORM ─── */}
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-xl lg:ml-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h3>
            
            {isSubmitted ? (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center animate-fade-in">
                <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h4>
                <p className="text-slate-600">
                  Thank you for reaching out to Health Connect. One of our team members will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                    <input 
                      type="text" 
                      id="firstName" 
                      name="firstName"
                      required
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-400"
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                    <input 
                      type="text" 
                      id="lastName" 
                      name="lastName"
                      required
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-400"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="jane@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                  <select 
                    id="subject"
                    name="subject"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">Select a topic...</option>
                    <option value="Patient Support">Patient Support</option>
                    <option value="Doctor Network Inquiry">Doctor Network Inquiry</option>
                    <option value="Billing Question">Billing Question</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                  <textarea 
                    id="message" 
                    name="message"
                    rows={4}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all resize-y disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 px-6 bg-teal-600 text-white text-lg font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 ${
                    isLoading 
                      ? 'opacity-70 cursor-not-allowed' 
                      : 'hover:bg-teal-700 hover:shadow-teal-600/40 hover:-translate-y-0.5'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>


        </div>
      </div>
    </div>
  );
};

export default ContactUs;
