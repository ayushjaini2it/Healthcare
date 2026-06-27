import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Star, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const mockDoctors = [
  { id: 1, name: "Dr. Sarah Jenkins", specialty: "Cardiologist", location: "New York, NY", rating: 4.9, reviews: 124, image: "SJ" },
  { id: 2, name: "Dr. Michael Chang", specialty: "Neurologist", location: "San Francisco, CA", rating: 4.8, reviews: 89, image: "MC" },
  { id: 3, name: "Dr. Emily Rodriguez", specialty: "Pediatrician", location: "Austin, TX", rating: 4.9, reviews: 210, image: "ER" },
  { id: 4, name: "Dr. David Kim", specialty: "Dermatologist", location: "Seattle, WA", rating: 4.7, reviews: 156, image: "DK" },
  { id: 5, name: "Dr. Olivia Bennett", specialty: "Orthopedic Surgeon", location: "Chicago, IL", rating: 4.9, reviews: 342, image: "OB" },
  { id: 6, name: "Dr. James Wilson", specialty: "General Practice", location: "Miami, FL", rating: 4.6, reviews: 78, image: "JW" },
];

const DoctorDirectory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
  const [isSearching, setIsSearching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Initial load skeleton
    const timer = setTimeout(() => setIsSearching(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchParams(value ? { search: value } : {}, { replace: true });
    
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 400); // Quick skeleton for snappy feedback
  };

  const filteredDoctors = mockDoctors.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="bg-teal-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-teal-100 hover:text-white transition-colors mb-6 font-medium micro-link">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Find Your Doctor</h1>
          <p className="text-teal-100 text-lg max-w-2xl">Browse our network of top-rated healthcare professionals and find the perfect match for your needs.</p>
          
          <div className="mt-8 relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 rounded-xl border-0 ring-1 ring-inset ring-slate-300 sm:text-lg text-slate-900 shadow-sm bg-white micro-input"
              placeholder="Search by name, specialty, or location..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div 
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col animate-pulse shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex-shrink-0"></div>
                    <div className="space-y-3 flex-1 pt-2 w-full">
                      <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-4 mb-6 flex-grow">
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor, idx) => (
                  <motion.div 
                    key={doctor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.4, ease: "easeOut" }}
                    whileHover={{ y: -8, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(13, 148, 136, 0.1), 0 8px 10px -6px rgba(13, 148, 136, 0.1)" }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col transition-colors"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold flex-shrink-0">
                        {doctor.image}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{doctor.name}</h3>
                        <p className="text-teal-600 font-medium">{doctor.specialty}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6 flex-grow">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span>{doctor.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-500 font-medium">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{doctor.rating}</span>
                        <span className="text-slate-400 text-sm">({doctor.reviews} reviews)</span>
                      </div>
                    </div>
      
                    <button 
                      onClick={() => navigate('/?login=true')}
                      className="w-full py-3 bg-slate-100 text-teal-700 font-bold rounded-xl hover:bg-teal-50 hover:text-teal-800 transition-colors micro-btn"
                    >
                      Log in to Book
                    </button>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-20 text-slate-500 text-lg"
                >
                  No doctors found matching your search criteria.
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DoctorDirectory;
