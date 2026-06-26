import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Auth from './Auth';
import { 
  Search, Calendar, UserCircle, Clock, Shield, Heart, 
  Menu, X, Star, ChevronDown, CheckCircle2, ArrowRight,
  Twitter, Github, Linkedin, Facebook
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const testimonials = [
  { name: "Sarah Jenkins", role: "Patient", text: "Finding a specialist used to take weeks of phone calls. With Health Connect, I found my cardiologist and booked an appointment the same afternoon." },
  { name: "Michael Chang", role: "Patient", text: "Having all my health records and upcoming appointments in one app gives me incredible peace of mind. The UI is gorgeous and so easy to use." },
  { name: "Emily Rodriguez", role: "Patient", text: "The automated reminders and seamless check-in process have completely changed how I manage my family's healthcare. Highly recommended." },
  { name: "David Thompson", role: "Patient", text: "I love the ability to sync my fitness data directly with my doctor. It makes our consultations so much more productive." },
  { name: "Priya Patel", role: "Patient", text: "The telemedicine feature is a lifesaver. I can consult with my pediatrician without dragging my sick child to the clinic." }
];

const faqCategories = [
  {
    category: 'General',
    questions: [
      { q: "What is Health Connect?", a: "Health Connect is a modern healthcare platform that connects you with top-rated medical professionals. You can find doctors, book appointments, and manage your health records all in one secure place." },
      { q: "How much does it cost to use?", a: "The platform is completely free for patients to use. You only pay for the actual medical services you receive from your healthcare provider, according to their standard rates or your insurance plan." },
      { q: "Can I add family members to my account?", a: "Yes, you can easily manage profiles for your dependents, including children and elderly family members, right from your main dashboard." }
    ]
  },
  {
    category: 'Appointments',
    questions: [
      { q: "Can I book virtual (telehealth) appointments?", a: "Yes! Many of our providers offer secure video consultations. Just look for the 'Telehealth' badge when searching for a doctor." },
      { q: "What is the cancellation policy?", a: "You can cancel or reschedule appointments for free up to 24 hours in advance. Cancellations within 24 hours may be subject to a fee determined by the specific clinic." },
      { q: "What should I bring to my first appointment?", a: "Please bring a valid photo ID, your insurance card, and any relevant medical records or current medications. We recommend arriving 15 minutes early." }
    ]
  },
  {
    category: 'Privacy & Security',
    questions: [
      { q: "Is my medical data secure?", a: "Absolutely. We use bank-level encryption and comply strictly with HIPAA and other international data protection regulations. Your data is never shared without your explicit consent." },
      { q: "Who can see my health records?", a: "Only you and the healthcare providers you explicitly grant access to can view your medical history. You remain in full control of your data at all times." }
    ]
  }
];

const LandingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaqCategory, setActiveFaqCategory] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/doctors');
    }
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    
    // Get precise visual positions using bounding rects
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + (containerRect.width / 2);
    
    let closestIndex = 0;
    let minDistance = Infinity;
    
    // Filter out the style tag so the index matches the testimonials array exactly
    const cards = Array.from(container.children).filter(c => c.tagName.toLowerCase() !== 'style');
    
    cards.forEach((child, index) => {
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.left + (childRect.width / 2);
      
      const distance = Math.abs(childCenter - containerCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    setCurrentTestimonial(closestIndex);
  };

  const scrollToIndex = (index: number) => {
    if (carouselRef.current && carouselRef.current.children.length > 0) {
      // Find all actual card elements (excluding the style tag)
      const cards = Array.from(carouselRef.current.children).filter(c => c.tagName.toLowerCase() !== 'style');
      const child = cards[index] as HTMLElement;
      
      if (child) {
        const container = carouselRef.current;
        const containerRect = container.getBoundingClientRect();
        const childRect = child.getBoundingClientRect();
        
        // Calculate how many pixels the child's center is away from the container's center
        const childCenter = childRect.left + (childRect.width / 2);
        const containerCenter = containerRect.left + (containerRect.width / 2);
        const difference = childCenter - containerCenter;
        
        // Scroll by the exact difference to snap it to the center
        container.scrollBy({ left: difference, behavior: 'smooth' });
        setCurrentTestimonial(index);
      }
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    const timer = setInterval(() => {
      // Go to next, or loop back to 0
      const nextIndex = (currentTestimonial + 1) % testimonials.length;
      scrollToIndex(nextIndex);
    }, 3000); // Reduced wait time to 3s
    
    return () => clearInterval(timer);
  }, [currentTestimonial]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 scroll-smooth">
      {isAuthOpen && <Auth onClose={closeAuth} onSuccessLogin={() => navigate('/dashboard', { replace: true })} />}
      
      {/* ─── EMERGENCY BANNER ─── */}
      {showEmergencyBanner && (
        <div className="bg-rose-600 text-white text-xs sm:text-sm font-medium py-2.5 px-4 relative z-50 flex items-center justify-between sm:justify-center gap-4 tracking-wide">
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
      <nav className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 transition-all">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300 ${isScrolled ? 'py-3 lg:py-3.5' : 'py-4 lg:py-5'}`}>
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Health Connect Logo" className={`w-auto transition-all duration-300 ${isScrolled ? 'h-8' : 'h-10'}`} />
            <span className="text-xl font-bold text-teal-800 tracking-tight">Health Connect</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#features" className={`hover:text-teal-600 transition-colors ${activeSection === 'features' ? 'text-teal-600 font-bold' : ''}`}>Features</a>
            <a href="#how-it-works" className={`hover:text-teal-600 transition-colors ${activeSection === 'how-it-works' ? 'text-teal-600 font-bold' : ''}`}>How It Works</a>
            <a href="#about" className={`hover:text-teal-600 transition-colors ${activeSection === 'about' ? 'text-teal-600 font-bold' : ''}`}>About Us</a>
            <Link to="/contact" className="hover:text-teal-600 transition-colors">Contact Us</Link>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-full border border-slate-100">
                  <div className="h-8 w-8 bg-teal-600 rounded-full flex items-center justify-center shadow-sm text-white text-sm font-bold">
                    {currentUser.profile?.full_name?.[0] || currentUser.profile?.first_name?.[0] || 'U'}
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {currentUser.profile?.full_name || currentUser.profile?.first_name || 'User'}
                  </span>
                </div>
                <Link 
                  to="/dashboard"
                  className="px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 hover:-translate-y-0.5"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <>
                <button 
                  onClick={openAuth}
                  className="px-5 py-2.5 text-teal-700 font-semibold hover:bg-teal-50 rounded-xl transition-all"
                >
                  Log In
                </button>
                <button 
                  onClick={openAuth}
                  className="px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 hover:-translate-y-0.5"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          <button 
            className="md:hidden p-2 text-slate-600 hover:text-teal-600 focus-visible:outline-teal-600 rounded-md"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl py-4 px-4 flex flex-col gap-4 animate-fade-in">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className={`block py-2 font-medium ${activeSection === 'features' ? 'text-teal-600' : 'text-slate-600'}`}>Features</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className={`block py-2 font-medium ${activeSection === 'how-it-works' ? 'text-teal-600' : 'text-slate-600'}`}>How It Works</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className={`block py-2 font-medium ${activeSection === 'about' ? 'text-teal-600' : 'text-slate-600'}`}>About Us</a>
            <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-600 font-medium hover:text-teal-600">Contact Us</Link>
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-3 pt-2">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="h-10 w-10 bg-teal-600 rounded-full flex items-center justify-center shadow-sm text-white font-bold">
                      {currentUser.profile?.full_name?.[0] || currentUser.profile?.first_name?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">
                        {currentUser.profile?.full_name || currentUser.profile?.first_name || 'User'}
                      </span>
                      <span className="text-xs text-slate-500 capitalize">{currentUser.role}</span>
                    </div>
                  </div>
                  <Link 
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center px-5 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-sm"
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-6 pb-16 md:pt-10 md:pb-24 overflow-hidden bg-white">
        <div className="absolute top-0 inset-x-0 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-50/80 via-white to-white -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 space-y-5 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:shadow-md transition-shadow cursor-default">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              Trusted by 10,000+ Patients
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Modern Healthcare, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-400 to-teal-600 animate-gradient-x">Simplified.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-xl">
              Connect with top-rated specialists, book appointments instantly, and manage your medical records—all from one secure, premium platform.
            </p>
            <div className="flex flex-col gap-4 pt-4">
              <form 
                onSubmit={handleHeroSearch}
                className="flex flex-col sm:flex-row gap-3 w-full max-w-xl bg-white p-2 rounded-2xl sm:rounded-full border border-slate-200 shadow-sm focus-within:shadow-md focus-within:border-teal-300 transition-all"
              >
                <div className="flex-1 flex items-center pl-4 pr-2 py-2 sm:py-0">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search specialty, doctor, or condition..."
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    className="w-full bg-transparent border-0 focus:ring-0 text-slate-700 px-3 py-1 outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl sm:rounded-full hover:bg-teal-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-teal-600/20"
                >
                  Find Doctors
                </button>
              </form>
              <div className="flex items-center gap-3 text-sm text-slate-500 sm:pl-4 font-medium flex-wrap">
                <span>Popular:</span>
                <button onClick={() => { setHeroSearch('Cardiologist'); navigate('/doctors?search=Cardiologist'); }} className="hover:text-teal-600 transition-colors cursor-pointer">Cardiologist</button>
                <button onClick={() => { setHeroSearch('Dermatologist'); navigate('/doctors?search=Dermatologist'); }} className="hover:text-teal-600 transition-colors cursor-pointer">Dermatologist</button>
                <button onClick={() => { setHeroSearch('Pediatrician'); navigate('/doctors?search=Pediatrician'); }} className="hover:text-teal-600 transition-colors cursor-pointer">Pediatrician</button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative flex justify-center items-center w-full max-w-lg mx-auto animate-fade-in animate-delay-300">
            <div className="absolute inset-0 bg-teal-100 rounded-full blur-3xl opacity-40 animate-pulse-soft"></div>
            <img src="/hero.png" alt="Healthcare professional" className="w-full h-auto object-contain relative z-10 drop-shadow-2xl" />
            
            <div className="absolute -bottom-2 -left-2 md:bottom-8 md:-left-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 animate-float z-20 flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 shadow-inner">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Patient Rating</p>
                <p className="text-xl font-black text-slate-800">4.9<span className="text-sm font-semibold text-slate-500">/5</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT SECTION ─── */}
      <section id="about" className="scroll-mt-20 py-12 md:py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 relative">
              <div className="absolute -inset-4 bg-teal-100 rounded-[3rem] blur-xl opacity-50 -z-10 animate-pulse-soft"></div>
              <img 
                src="/about_us.png" 
                alt="Healthcare professionals collaborating" 
                className="relative w-full h-auto rounded-3xl shadow-2xl bg-white/80 backdrop-blur-sm border border-white"
              />
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
                  { text: "Verified, top-tier medical professionals.", delay: "100" },
                  { text: "Bank-level security for your health records.", delay: "300" },
                  { text: "24/7 access to your health timeline.", delay: "500" }
                ].map((item, idx) => (
                  <li key={idx} className={`flex items-center gap-3 text-slate-700 font-medium animate-fade-in animate-delay-${item.delay}`}>
                    <CheckCircle2 className="w-6 h-6 text-teal-500 flex-shrink-0" />
                    {item.text}
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
              { icon: Search, title: "Search Doctors", desc: "Find qualified healthcare professionals by specialty, location, availability, and patient ratings.", delay: "100" },
              { icon: Calendar, title: "Smart Booking", desc: "Schedule appointments instantly with real-time availability. Receive automated confirmations and reminders.", delay: "200" },
              { icon: UserCircle, title: "Unified Profiles", desc: "Manage your health records, prescriptions, and appointment history in one secure, accessible location.", delay: "300" },
              { icon: Clock, title: "24/7 Access", desc: "Access your healthcare information anytime, anywhere. Book appointments even outside office hours.", delay: "400" },
              { icon: Shield, title: "Ironclad Security", desc: "Your health data is encrypted and protected with industry-leading HIPAA-compliant security standards.", delay: "500" },
              { icon: Heart, title: "Quality Care", desc: "Connect with verified, experienced healthcare professionals deeply committed to your wellbeing.", delay: "700" },
            ].map((feature, idx) => (
              <div key={idx} className={`group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-600/10 hover:-translate-y-1.5 hover:bg-gradient-to-br hover:from-white hover:to-teal-50/50 transition-all duration-300 animate-slide-up animate-delay-${feature.delay}`}>
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4 border border-teal-100/50 group-hover:scale-110 group-hover:bg-teal-100 transition-transform duration-300">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">{feature.desc}</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-0">
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-1 bg-gradient-to-r from-teal-50 via-teal-300 to-teal-50 bg-[length:200%_auto] animate-gradient-x -z-10 rounded-full"></div>
            
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
      <section id="testimonials" className="scroll-mt-20 py-16 md:py-24 bg-slate-50 border-t border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold tracking-widest text-teal-600 uppercase mb-3">Patient Stories</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">Trusted by thousands of patients</h3>
          </div>
          
          <div className="relative max-w-7xl mx-auto z-10 mt-12 group">
            {/* Main Carousel Area */}
            <div className="relative -mx-4 pb-8">
              <div 
                ref={carouselRef}
                onScroll={handleScroll}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar pb-8 pt-4 px-[calc(50%-42.5vw)] sm:px-[calc(50%-200px)] lg:px-[calc(50%-225px)]"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style>{`
                  .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {testimonials.map((testimonial, idx) => (
                  <div 
                    key={idx} 
                    className="w-[85vw] sm:w-[400px] lg:w-[450px] shrink-0 snap-center bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex gap-1 mb-6 text-amber-400">
                        <Star className="w-5 h-5 fill-current" />
                        <Star className="w-5 h-5 fill-current" />
                        <Star className="w-5 h-5 fill-current" />
                        <Star className="w-5 h-5 fill-current" />
                        <Star className="w-5 h-5 fill-current" />
                      </div>
                      
                      <p className="text-lg text-slate-700 font-medium leading-relaxed mb-8 italic">
                        "{testimonial.text}"
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-auto">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <h5 className="font-bold text-slate-900">{testimonial.name}</h5>
                        <span className="text-sm font-medium text-slate-500">{testimonial.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Arrow Navigation (Absolute positioned) */}
            <button 
              onClick={() => scrollToIndex(Math.max(0, currentTestimonial - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 hover:shadow-md flex items-center justify-center transition-all focus:outline-none z-20 opacity-0 group-hover:opacity-100 shadow-sm disabled:opacity-0"
              disabled={currentTestimonial === 0}
              aria-label="Previous testimonial"
            >
              <ChevronDown className="w-6 h-6 rotate-90" />
            </button>
            
            <button 
              onClick={() => scrollToIndex(Math.min(testimonials.length - 1, currentTestimonial + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 hover:shadow-md flex items-center justify-center transition-all focus:outline-none z-20 opacity-0 group-hover:opacity-100 shadow-sm disabled:opacity-0"
              disabled={currentTestimonial === testimonials.length - 1}
              aria-label="Next testimonial"
            >
              <ChevronDown className="w-6 h-6 -rotate-90" />
            </button>
            
            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentTestimonial ? 'bg-teal-600 w-6' : 'bg-slate-300 hover:bg-slate-400 w-2'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ─── */}
      <section id="faq" className="scroll-mt-20 py-16 lg:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <h2 className="text-sm font-bold tracking-widest text-teal-600 uppercase mb-3">FAQ</h2>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Common questions</h3>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
              Everything you need to know about Health Connect. Can't find the answer you're looking for? Please contact our friendly support team.
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            {/* Left Sidebar - Categories */}
            <div className="w-full lg:w-[280px] shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 hide-scrollbar lg:sticky lg:top-32">
              {faqCategories.map((category, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveFaqCategory(idx);
                    setOpenFaq(null); // Close any open FAQ when switching categories
                  }}
                  className={`text-left px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-between group whitespace-nowrap lg:whitespace-normal shrink-0 ${
                    activeFaqCategory === idx 
                      ? 'bg-white text-teal-800 shadow-sm border border-teal-100 ring-1 ring-teal-600/5' 
                      : 'bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <span className="text-sm">{category.category}</span>
                  <ArrowRight className={`hidden lg:block w-4 h-4 transition-transform duration-300 ${activeFaqCategory === idx ? 'opacity-100 translate-x-0 text-teal-600' : 'opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:-translate-x-2'}`} />
                </button>
              ))}
            </div>

            {/* Right Column - Questions */}
            <div className="flex-1 w-full">
              <div className="space-y-3 lg:space-y-4">
                {faqCategories[activeFaqCategory].questions.map((faq, idx) => (
                  <div key={idx} className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === idx ? 'border-teal-200 shadow-sm ring-1 ring-teal-600/5' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
                    <button 
                      id={`faq-button-${idx}`}
                      aria-expanded={openFaq === idx}
                      aria-controls={`faq-content-${idx}`}
                      className={`w-full px-5 lg:px-6 py-4 lg:py-5 flex items-start justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-2xl transition-colors ${openFaq === idx ? 'text-teal-900' : 'text-slate-900'}`}
                      onClick={() => toggleFaq(idx)}
                    >
                      <span className="font-bold pr-8 text-base leading-snug">{faq.q}</span>
                      <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${openFaq === idx ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    <div 
                      id={`faq-content-${idx}`}
                      role="region"
                      aria-labelledby={`faq-button-${idx}`}
                      className={`px-5 lg:px-6 text-slate-600 leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 pb-4 lg:pb-5 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}
                    >
                      <p className="text-sm">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-20 lg:py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-teal-100/90 via-white to-teal-50/90 px-6 py-16 md:py-20 text-center shadow-xl shadow-teal-900/5 border border-teal-200/60">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-300/40 rounded-full blur-[80px]" />
              <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-400/30 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100/60 border border-teal-200/50 text-teal-800 text-xs sm:text-sm font-bold mb-8 shadow-sm">
                <Heart className="w-4 h-4 fill-current text-rose-500" />
                Trusted by 10,000+ patients worldwide
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                Ready to modernize your healthcare experience?
              </h2>
              
              <p className="text-base sm:text-lg text-slate-600 mb-10 max-w-xl leading-relaxed font-medium">
                Join Health Connect today and get instant access to top-rated professionals, seamless booking, and secure medical records.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button 
                  onClick={openAuth}
                  className="inline-flex justify-center items-center gap-2 px-8 py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-600/20 transition-all hover:-translate-y-0.5 text-base shadow-md shadow-teal-600/10"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('faq');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex justify-center items-center gap-2 px-8 py-4 bg-white text-teal-700 font-bold rounded-xl hover:bg-slate-50 hover:text-teal-800 transition-all border border-slate-200 hover:border-teal-200 hover:shadow-sm text-base"
                >
                  Read the FAQs
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-50 border-t border-slate-200 text-slate-600 pt-12 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-6">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Health Connect Logo" className="h-8 w-auto opacity-90" />
              <span className="text-xl font-extrabold text-teal-800 tracking-tight">Health Connect</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm mb-5 text-slate-500 font-medium">
              Empowering patients with modern technology to find the right care, right when they need it. Your health, connected.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Twitter, label: 'Twitter' },
                { icon: Facebook, label: 'Facebook' },
                { icon: Linkedin, label: 'LinkedIn' },
                { icon: Github, label: 'GitHub' },
              ].map((social, idx) => (
                <a 
                  key={idx}
                  href="#" 
                  aria-label={social.label}
                  className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 hover:shadow-sm hover:-translate-y-0.5 transition-all" 
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-4">For Patients</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-500">
              <li><Link to="/doctors" className="hover:text-teal-600 transition-colors">Find a Doctor</Link></li>
              <li><button onClick={openAuth} className="hover:text-teal-600 transition-colors">Book Appointment</button></li>
              <li><button onClick={openAuth} className="hover:text-teal-600 transition-colors">My Health Records</button></li>
              <li><a href="#faq" className="hover:text-teal-600 transition-colors">Patient Help</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-4">For Doctors</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-500">
              <li><button onClick={openAuth} className="hover:text-teal-600 transition-colors">Join Network</button></li>
              <li><button onClick={openAuth} className="hover:text-teal-600 transition-colors">Manage Appointments</button></li>
              <li><a href="#about" className="hover:text-teal-600 transition-colors">Provider Resources</a></li>
              <li><a href="#features" className="hover:text-teal-600 transition-colors">Platform Features</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-4">Company</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-500">
              <li><a href="#about" className="hover:text-teal-600 transition-colors">About Us</a></li>
              <li><Link to="/contact" className="hover:text-teal-600 transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-teal-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-teal-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-slate-500">
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
