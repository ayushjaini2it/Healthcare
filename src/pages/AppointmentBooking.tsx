import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowLeft } from 'lucide-react';

const AppointmentBooking: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Book an appointment</h1>
            <p className="mt-2 text-slate-600">
              This placeholder booking page is now available so the app route loads correctly.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-teal-50 px-4 py-3 text-teal-700">
            <CalendarDays className="h-5 w-5" />
            <span className="font-medium">Booking flow coming soon</span>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          <p>
            The appointment booking experience is currently being wired into the app. Until that flow is finalized,
            this page keeps navigation working and avoids the missing-file build error.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
