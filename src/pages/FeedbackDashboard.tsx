import React, { useState, useEffect } from 'react';
import { supabaseServices } from '../services/supabaseServices';
import { MessageSquare, Star, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const FeedbackDashboard: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFeedback = async () => {
    try {
      setIsLoading(true);
      const data = await supabaseServices.feedbackServices.getAllFeedback();
      setFeedbacks(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load patient feedback.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const markAsReviewed = async (id: string) => {
    try {
      await supabaseServices.feedbackServices.updateFeedbackStatus(id, 'reviewed');
      setFeedbacks((prev) => 
        prev.map(f => f.id === id ? { ...f, status: 'reviewed' } : f)
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update feedback status.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
      </div>
    );
  }

  const pendingFeedback = feedbacks.filter(f => f.status !== 'reviewed');
  const reviewedFeedback = feedbacks.filter(f => f.status === 'reviewed');

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-teal-600" />
          Patient Satisfaction Dashboard
        </h1>
        <p className="text-slate-600 mt-2">Monitor and respond to patient feedback to improve clinical operations.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center text-center">
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total Submissions</span>
          <span className="text-4xl font-bold text-slate-800">{feedbacks.length}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 flex flex-col justify-center items-center text-center bg-orange-50/50">
          <span className="text-sm font-medium text-orange-600 uppercase tracking-wider mb-1">Pending Review</span>
          <span className="text-4xl font-bold text-orange-700">{pendingFeedback.length}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 flex flex-col justify-center items-center text-center bg-green-50/50">
          <span className="text-sm font-medium text-green-600 uppercase tracking-wider mb-1">Resolved</span>
          <span className="text-4xl font-bold text-green-700">{reviewedFeedback.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="font-semibold text-slate-800">Recent Feedback</h2>
        </div>
        
        {feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No feedback yet</h3>
            <p className="text-slate-500">Patients haven't submitted any feedback.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {feedbacks.map((item) => (
              <div key={item.id} className={`p-6 transition-colors hover:bg-slate-50 ${item.status === 'reviewed' ? 'opacity-70' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider bg-teal-100 text-teal-800">
                        {item.category}
                      </span>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < item.rating ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-slate-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-slate-800 text-base mb-2 font-medium">"{item.comments}"</p>
                    
                    <p className="text-sm text-slate-500">
                      Submitted by: <span className="font-medium text-slate-700">{item.patients?.first_name || 'Unknown'} {item.patients?.last_name || ''}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center md:flex-col md:items-end gap-3 shrink-0">
                    {item.status === 'reviewed' ? (
                      <span className="inline-flex items-center text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Reviewed
                      </span>
                    ) : (
                      <button 
                        onClick={() => markAsReviewed(item.id)}
                        className="btn-primary py-1.5 px-4 text-sm font-medium"
                      >
                        Mark as Reviewed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackDashboard;
