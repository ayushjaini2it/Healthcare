import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Auth from './Auth';
import { 
  Search, Calendar, UserCircle, Clock, Shield, Heart, 
  Menu, X, Star, ChevronDown, CheckCircle2, ArrowRight
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(true);

  const isAuthOpen = searchParams.get('login') === 'true';

  const closeAuth = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('login');
    setSearchParams(newParams, { replace: true });
  };

  const openAuth = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('login', 'true');
    setSearchParams(newParams);
    setIsMobileMenuOpen(false);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 scroll-smooth">
      {isAuthOpen && <Auth onClose={closeAuth} />}
      
      {/* ─── EMERGENCY BANNER ─── */}
      {showEmergencyBanner && (
        <div className="bg-red-600 text-white text-sm font-medium py-3 px-4 fixed bottom-0 left-0 right-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-between sm:justify-center gap-4">
          <div className="text-center flex-1">
            <span className="hidden sm:inline">⚠️ </span>
            If you are experiencing a medical emergency, please call 108 or 112 or visit your nearest emergency room immediately.
          </div>
          <button 
            onClick={() => setShowEmergencyBanner(false)}
            className="p-1 hover:bg-red-700 rounded-full transition-colors flex-shrink-0"
            aria-label="Dismiss emergency banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ─── NAVBAR ─── */}
      <nav className="fixed w-full z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Health Connect Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold text-teal-800 tracking-tight">Health Connect</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-teal-600 transition-colors">How It Works</a>
            <a href="#about" className="hover:text-teal-600 transition-colors">About Us</a>
            <a href="#testimonials" className="hover:text-teal-600 transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-teal-600 transition-colors">FAQ</a>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={openAuth}
              className="px-5 py-2.5 text-teal-700 font-semibold hover:bg-teal-50 rounded-xl transition-all"
            >
              Log In
            </button>
            <button 
              onClick={openAuth}
              className="px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
            >
              Sign Up
            </button>
          </div>

          <button 
            className="md:hidden p-2 text-slate-600 hover:text-teal-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl py-4 px-4 flex flex-col gap-4 animate-fade-in">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-600 font-medium">Features</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-600 font-medium">How It Works</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-600 font-medium">About Us</a>
            <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-600 font-medium">Reviews</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-600 font-medium">FAQ</a>
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={openAuth}
                className="w-full px-5 py-3 text-teal-700 font-semibold bg-teal-50 rounded-xl transition-all"
              >
                Log In
              </button>
              <button 
                onClick={openAuth}
                className="w-full px-5 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-sm"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-24 pb-12 md:pt-28 md:pb-16 overflow-hidden bg-white">
        <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-teal-50/50 to-white -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 space-y-5 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-sm font-semibold shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              Trusted by 10,000+ Patients
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Modern Healthcare, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-400">Simplified.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
              Connect with top-rated specialists, book appointments instantly, and manage your medical records—all from one secure, premium platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                onClick={openAuth}
                className="px-6 py-3.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 hover:shadow-teal-600/40 hover:-translate-y-0.5"
              >
                <Calendar className="w-5 h-5" />
                Book Appointment
              </button>
              <Link 
                to="/doctors"
                className="px-6 py-3.5 bg-white text-slate-700 border border-slate-200 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow"
              >
                <Search className="w-5 h-5 text-teal-600" />
                Find a Doctor
              </Link>
            </div>
          </div>
          
          <div className="flex-1 relative flex justify-center items-center w-full max-w-lg mx-auto animate-fade-in animate-delay-300">
            <div className="absolute inset-0 bg-teal-100 rounded-full blur-3xl opacity-40 animate-pulse-soft"></div>
            <img src="/hero.png" alt="Healthcare professional" className="w-full h-auto object-contain relative z-10 drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* ─── ABOUT SECTION ─── */}
      <section id="about" className="scroll-mt-20 py-12 md:py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white">
                <img 
                  src="/about_us.png" 
                  alt="Healthcare professionals collaborating" 
                  className="w-full h-[400px] object-contain"
                />
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <h2 className="text-sm font-bold tracking-widest text-teal-600 uppercase">About Us</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                Empowering your health journey with technology and empathy.
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                At Health Connect, we believe that accessing quality healthcare should be seamless, transparent, and patient-centric. We've built a platform that bridges the gap between expert medical professionals and those who need them most.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  "Verified, top-tier medical professionals.",
                  "Bank-level security for your health records.",
                  "24/7 access to your health timeline."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 className="w-6 h-6 text-teal-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="scroll-mt-20 py-12 md:py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm font-bold tracking-widest text-teal-600 uppercase mb-3">Our Services</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Comprehensive care, curated for you</h3>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">Everything you need to manage your healthcare journey, neatly packaged into one powerful, intuitive platform.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {[
              { icon: Search, title: "Search Doctors", desc: "Find qualified healthcare professionals by specialty, location, availability, and patient ratings." },
              { icon: Calendar, title: "Smart Booking", desc: "Schedule appointments instantly with real-time availability. Receive automated confirmations and reminders." },
              { icon: UserCircle, title: "Unified Profiles", desc: "Manage your health records, prescriptions, and appointment history in one secure, accessible location." },
              { icon: Clock, title: "24/7 Access", desc: "Access your healthcare information anytime, anywhere. Book appointments even outside office hours." },
              { icon: Shield, title: "Ironclad Security", desc: "Your health data is encrypted and protected with industry-leading HIPAA-compliant security standards." },
              { icon: Heart, title: "Quality Care", desc: "Connect with verified, experienced healthcare professionals deeply committed to your wellbeing." },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4 border border-teal-100/50">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="scroll-mt-20 py-12 md:py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm font-bold tracking-widest text-teal-600 uppercase mb-3">Simple Process</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Get started in three simple steps</h3>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">We've eliminated the friction of traditional healthcare access.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-teal-100 via-teal-300 to-teal-100 -z-10"></div>
            
            {[
              { step: "1", title: "Create Your Profile", desc: "Sign up and add your basic health information securely in less than 2 minutes." },
              { step: "2", title: "Find Your Doctor", desc: "Browse our curated network of top-rated healthcare professionals matching your needs." },
              { step: "3", title: "Book & Connect", desc: "Schedule your appointment instantly and receive digital reminders before your visit." },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center bg-white">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mb-5 shadow-xl shadow-teal-600/20 ring-8 ring-white transform rotate-3 hover:rotate-0 transition-transform">
                  {item.step}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
                <p className="text-slate-600 leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="scroll-mt-20 py-12 md:py-16 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-600/20 blur-[120px] rounded-full pointer-events-none"></div>
          
          <h2 className="text-sm font-bold tracking-widest text-teal-400 uppercase mb-3">Patient Stories</h2>
          <h3 className="text-3xl md:text-4xl font-bold mb-10">Trusted by thousands</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              { name: "Sarah Jenkins", role: "Patient", text: "Finding a specialist used to take weeks of phone calls. With Health Connect, I found my cardiologist and booked an appointment the same afternoon." },
              { name: "Michael Chang", role: "Patient", text: "Having all my health records and upcoming appointments in one app gives me incredible peace of mind. The UI is gorgeous and so easy to use." },
              { name: "Emily Rodriguez", role: "Patient", text: "The automated reminders and seamless check-in process have completely changed how I manage my family's healthcare. Highly recommended." }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-700 text-left">
                <div className="flex gap-1 mb-6 text-amber-400">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-slate-300 leading-relaxed mb-6">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold">{testimonial.name}</h5>
                    <span className="text-sm text-slate-400">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ─── */}
      <section id="faq" className="scroll-mt-20 py-12 md:py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-sm font-bold tracking-widest text-teal-600 uppercase mb-3">FAQ</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900">Frequently Asked Questions</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "How much does it cost to use Health Connect?", a: "Health Connect is completely free for patients to use. You only pay for the medical services you receive from your healthcare provider, according to their standard rates or your insurance plan." },
              { q: "Is my medical data secure?", a: "Yes. We use end-to-end encryption and comply strictly with HIPAA and other international data protection regulations. Your data is never shared without your explicit consent." },
              { q: "Can I use Health Connect for emergencies?", a: "No. Health Connect is designed for scheduling routine appointments and managing health records. In a medical emergency, please call your local emergency services (like 911) immediately." },
              { q: "Do you accept insurance?", a: "Insurance acceptance depends on the individual doctor or clinic you book with. You can filter doctors by the insurance plans they accept during your search." }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  className="w-full px-6 py-5 flex items-center justify-between font-bold text-slate-900 hover:text-teal-600 text-left focus:outline-none"
                  onClick={() => toggleFaq(idx)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <div 
                  className={`px-6 text-slate-600 leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="bg-teal-600 py-12 md:py-16 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">Ready to Take Control of Your Health?</h2>
          <p className="text-teal-50 mb-8 text-lg font-medium">Join thousands of patients who trust Health Connect for their healthcare needs.</p>
          <button 
            onClick={openAuth}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-1 text-base"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className={`bg-white border-t border-slate-200 text-slate-600 pt-12 px-4 ${showEmergencyBanner ? 'pb-16' : 'pb-6'}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="Health Connect Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-teal-800 tracking-tight">Health Connect</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm mb-6">
              Empowering patients with modern technology to find the right care, right when they need it. Your health, connected.
            </p>
            <div className="flex gap-4">
              {/* Social icons could go here */}
            </div>
          </div>
          
          <div>
            <h4 className="text-slate-900 font-bold mb-6">For Patients</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/doctors" className="hover:text-teal-600 transition-colors">Find a Doctor</Link></li>
              <li><button onClick={openAuth} className="hover:text-teal-600 transition-colors">Book Appointment</button></li>
              <li><button onClick={openAuth} className="hover:text-teal-600 transition-colors">My Health Records</button></li>
              <li><a href="#faq" className="hover:text-teal-600 transition-colors">Patient Help</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-slate-900 font-bold mb-6">For Doctors</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><button onClick={openAuth} className="hover:text-teal-600 transition-colors">Join Network</button></li>
              <li><button onClick={openAuth} className="hover:text-teal-600 transition-colors">Manage Appointments</button></li>
              <li><a href="#about" className="hover:text-teal-600 transition-colors">Provider Resources</a></li>
              <li><a href="#features" className="hover:text-teal-600 transition-colors">Platform Features</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-slate-900 font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#about" className="hover:text-teal-600 transition-colors">About Us</a></li>
              <li><a href="#about" className="hover:text-teal-600 transition-colors">Careers</a></li>
              <li><Link to="/privacy" className="hover:text-teal-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-teal-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-8 pt-5 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-slate-500">
          <p>© {new Date().getFullYear()} Health Connect. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-teal-600 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-teal-600 transition-colors">Privacy Policy</Link>
            <Link to="/privacy" className="hover:text-teal-600 transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
