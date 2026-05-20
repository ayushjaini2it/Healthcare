import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabaseServices } from '../services/supabaseServices';
import { FileText, Microscope, Calendar, Clock, Activity, AlertCircle } from 'lucide-react';

interface TimelineItem {
  id: string;
  type: 'consultation' | 'diagnosis';
  date: Date;
  data: any;
}

const PatientRecords: React.FC = () => {
  const { currentUser } = useAuth();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      if (!currentUser?.id) return;
      try {
        setIsLoading(true);
        // Note: the services might expect auth_user_id (which is currentUser.id)
        // Wait, getPatientConsultations takes patientId. Does it mean patient's ID in patients table or auth_user_id?
        // Let's check how PatientMedications fetches: it uses currentUser.id, wait.
        // Actually, let's fetch the patient profile first if needed, or if getPatientConsultations works with auth_user_id.
        // Wait! In supabaseServices.ts, patientServices.getPatientByAuthId exists.
        
        const patientData = await supabaseServices.patientServices.getPatientByAuthId(currentUser.id);
        if (!patientData) throw new Error('Patient profile not found');

        const [consultations, diagnoses] = await Promise.all([
          supabaseServices.consultationServices.getPatientConsultations(patientData.id),
          supabaseServices.diagnosisServices.getPatientDiagnoses(patientData.id)
        ]);

        const items: TimelineItem[] = [
          ...(consultations || []).map((c: any) => ({
            id: `c-${c.id}`,
            type: 'consultation' as const,
            date: new Date(c.date),
            data: c
          })),
          ...(diagnoses || []).map((d: any) => ({
            id: `d-${d.id}`,
            type: 'diagnosis' as const,
            date: new Date(d.date || d.test_date || new Date()),
            data: d
          }))
        ];

        // Sort by date descending
        items.sort((a, b) => b.date.getTime() - a.date.getTime());
        setTimeline(items);
      } catch (err) {
        console.error(err);
        setError('Failed to load clinical records.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 animate-pulse">
        <div className="mb-8">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="space-y-8 ml-3 md:ml-6 border-l-2 border-slate-100 pb-12">
          {[1, 2, 3].map(i => (
            <div key={i} className="relative pl-6 md:pl-8">
              <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-slate-200 ring-4 ring-white"></div>
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-50">
                  <div className="w-10 h-10 rounded-lg bg-slate-100"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-slate-100 rounded w-full"></div>
                  <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-3 bg-slate-100 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Clinical Records</h1>
        <p className="text-slate-600 mt-2">View your complete consultation history and lab test results.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {timeline.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No records found</h3>
          <p className="text-slate-500">You don't have any consultation notes or lab results yet.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-3 md:ml-6 space-y-8 pb-12">
          {timeline.map((item) => (
            <div key={item.id} className="relative pl-6 md:pl-8">
              {/* Timeline dot */}
              <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full ring-4 ring-slate-50 ${
                item.type === 'consultation' ? 'bg-teal-500' : 'bg-blue-500'
              }`} />

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center">
                    {item.type === 'consultation' ? (
                      <div className="bg-teal-50 p-2 rounded-lg text-teal-600 mr-3">
                        <FileText className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mr-3">
                        <Microscope className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {item.type === 'consultation' ? 'Consultation Notes' : 'Lab Test Results'}
                      </h3>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {item.date.toLocaleDateString()}
                        <Clock className="h-3.5 w-3.5 ml-3 mr-1" />
                        {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  {item.type === 'diagnosis' && (
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      item.data.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.data.status === 'completed' ? 'Results Available' : 'Pending'}
                    </span>
                  )}
                </div>

                {item.type === 'consultation' ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Symptoms Reported</h4>
                      <p className="text-slate-700">{Array.isArray(item.data.symptoms) ? item.data.symptoms.join(', ') : item.data.symptoms}</p>
                    </div>
                    {item.data.notes && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Doctor's Notes</h4>
                        <p className="text-slate-700">{item.data.notes}</p>
                      </div>
                    )}
                    {item.data.diagnosis && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Preliminary Diagnosis</h4>
                        <p className="text-slate-900 font-medium">{item.data.diagnosis}</p>
                      </div>
                    )}
                    {item.data.vitalSigns && (
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                        <div>
                          <span className="text-slate-400 text-xs block mb-1">Blood Pressure</span>
                          <span className="font-semibold text-slate-800">
                            {item.data.vitalSigns.systolicBP && item.data.vitalSigns.diastolicBP 
                              ? `${item.data.vitalSigns.systolicBP}/${item.data.vitalSigns.diastolicBP}` 
                              : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-xs block mb-1">Heart Rate</span>
                          <span className="font-semibold text-slate-800">{item.data.vitalSigns.heartRate ? `${item.data.vitalSigns.heartRate} bpm` : '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-xs block mb-1">Temp</span>
                          <span className="font-semibold text-slate-800">{item.data.vitalSigns.temperature ? `${item.data.vitalSigns.temperature}°C` : '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-xs block mb-1">Weight</span>
                          <span className="font-semibold text-slate-800">{item.data.vitalSigns.weight ? `${item.data.vitalSigns.weight} kg` : '-'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Test Name</h4>
                        <p className="text-slate-900 font-medium">{item.data.testName || item.data.type}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</h4>
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase bg-slate-100 text-slate-600">
                          {item.data.type}
                        </span>
                      </div>
                    </div>
                    
                    {item.data.status === 'completed' ? (
                      <div className="mt-4 bg-teal-50/50 rounded-lg p-4 border border-teal-100">
                        {item.data.results && (
                          <div className="mb-3">
                            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">Test Results</h4>
                            <p className="text-slate-800">{item.data.results}</p>
                          </div>
                        )}
                        {item.data.interpretation && (
                          <div>
                            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">Clinical Interpretation</h4>
                            <p className="text-slate-700 italic">{item.data.interpretation}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                        <Activity className="h-6 w-6 text-slate-400 mx-auto mb-2 animate-pulse" />
                        <p className="text-sm">Lab results are currently being processed. Check back later.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientRecords;
