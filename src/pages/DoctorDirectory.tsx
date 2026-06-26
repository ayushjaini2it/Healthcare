import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Star, UserCircle, ArrowLeft } from 'lucide-react';

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
  const navigate = useNavigate();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchParams(value ? { search: value } : {}, { replace: true });
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
          <Link to="/" className="inline-flex items-center gap-2 text-teal-100 hover:text-white transition-colors mb-6 font-medium">
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
              className="block w-full pl-12 pr-4 py-4 rounded-xl border-0 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-lg text-slate-900 shadow-sm bg-white"
              placeholder="Search by name, specialty, or location..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDoctors.map(doctor => (
            <div key={doctor.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-6 flex flex-col">
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
                className="w-full py-3 bg-slate-100 text-teal-700 font-semibold rounded-xl hover:bg-teal-50 hover:text-teal-800 transition-colors"
              >
                Log in to Book
              </button>
            </div>
          ))}
        </div>
        
        {filteredDoctors.length === 0 && (
          <div className="text-center py-20 text-slate-500 text-lg">
            No doctors found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDirectory;
