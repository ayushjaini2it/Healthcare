import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Auth from './Auth';
import { 
  Search, Calendar, UserCircle, Clock, Shield, Heart
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {isAuthOpen && <Auth onClose={closeAuth} />}
      {/* ─── NAVBAR ─── */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between animate-fade-in opacity-0 ![animation-fill-mode:both]">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <img src="/logo.png" alt="Health Connect Logo" className="h-10 w-auto" />
          </div>
          <span className="text-xl font-bold text-teal-800 tracking-tight">Health Connect</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-teal-600 transition-colors">How It Works</a>
            <a href="#about" className="hover:text-teal-600 transition-colors">About</a>
          </div>
          
          <button 
            onClick={openAuth}
            className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-all shadow-sm"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8 animate-slide-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight">
            Your Health, <span className="text-teal-600">Connected</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
            Seamlessly connect with qualified healthcare professionals. Book appointments, search doctors, and manage your health journey all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={openAuth}
              className="px-8 py-3.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-200"
            >
              <Calendar className="w-5 h-5" />
              Book Appointment
            </button>
            <button 
              onClick={openAuth}
              className="px-8 py-3.5 bg-white text-teal-600 border-2 border-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Find a Doctor
            </button>
          </div>
        </div>
        
        {/* Hero Illustration */}
        <div className="flex-1 relative flex justify-center items-center w-full max-w-lg mx-auto animate-fade-in opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <img src="/hero.png" alt="Healthcare professionals" className="w-full h-auto object-contain drop-shadow-xl" />
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="bg-slate-50 py-24 border-y border-slate-100 animate-slide-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose Health Connect?</h2>
          <p className="text-slate-600 mb-16 max-w-2xl mx-auto">Comprehensive healthcare management at your fingertips</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {[
              { icon: Search, title: "Search Doctors", desc: "Find qualified healthcare professionals by specialty, location, availability, and patient ratings." },
              { icon: Calendar, title: "Easy Booking", desc: "Schedule appointments instantly with real-time availability. Get confirmations and reminders." },
              { icon: UserCircle, title: "Patient Profiles", desc: "Manage your health records, prescriptions, and appointment history in one secure location." },
              { icon: Clock, title: "24/7 Access", desc: "Access your healthcare information anytime, anywhere. Book appointments even outside office hours." },
              { icon: Shield, title: "Secure & Private", desc: "Your health data is encrypted and protected with industry-leading security standards." },
              { icon: Heart, title: "Quality Care", desc: "Connect with verified, experienced healthcare professionals committed to your wellbeing." },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-slide-up opacity-0" style={{ animationDelay: '700ms', animationFillMode: 'both' }}>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
        <p className="text-slate-600 mb-16 max-w-2xl mx-auto">Get started in three simple steps</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16.666%] right-[16.666%] h-0.5 bg-teal-100 -z-10"></div>
          
          {[
            { step: "1", title: "Create Your Profile", desc: "Sign up and add your health information securely to help doctors serve you better." },
            { step: "2", title: "Find Your Doctor", desc: "Search and browse through our network of qualified healthcare professionals." },
            { step: "3", title: "Book & Connect", desc: "Schedule your appointment and receive instant confirmation with reminders." },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-teal-200 border-4 border-white">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed max-w-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="bg-teal-600 py-20 text-center px-4 animate-slide-up opacity-0" style={{ animationDelay: '900ms', animationFillMode: 'both' }}>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Take Control of Your Health?</h2>
        <p className="text-teal-50 mb-10 text-lg">Join thousands of patients who trust Health Connect for their healthcare needs.</p>
        <button 
          onClick={openAuth}
          className="inline-block px-8 py-4 bg-white text-teal-700 font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-lg"
        >
          Get Started Today
        </button>
      </section>

      {/* ─── FOOTER ─── */}
      <footer id="about" className="bg-slate-900 text-slate-400 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="Health Connect Logo" className="h-8 w-auto brightness-0 invert" />
              <span className="text-xl font-bold text-white tracking-tight">Health Connect</span>
            </div>
            <p className="text-sm leading-relaxed">
              Connecting patients with quality healthcare professionals.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">For Patients</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={openAuth} className="hover:text-white transition-colors">Find a Doctor</button></li>
              <li><button onClick={openAuth} className="hover:text-white transition-colors">Book Appointment</button></li>
              <li><button onClick={openAuth} className="hover:text-white transition-colors">My Health Records</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">For Doctors</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={openAuth} className="hover:text-white transition-colors">Join Network</button></li>
              <li><button onClick={openAuth} className="hover:text-white transition-colors">Manage Appointments</button></li>
              <li><Link to="/resources" className="hover:text-white transition-colors">Resources</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
