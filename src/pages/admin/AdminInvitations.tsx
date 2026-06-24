import React, { useState, useEffect, useMemo } from 'react';
import { supabaseServices } from '../../services/supabaseServices';
import { KeyRound, Plus, Copy, Check, Clock, ShieldAlert, Mail, Search, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const AdminInvitations = () => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [email, setEmail] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [daysValid, setDaysValid] = useState(7);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const data = await supabaseServices.adminServices.getInvitations();
      setInvitations(data || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load invitations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      await supabaseServices.adminServices.generateInvitation(email, daysValid, maxUses, hospitalName);
      setSuccess('Invitation code generated successfully!');
      setEmail('');
      setHospitalName('');
      setMaxUses(1);
      setDaysValid(7);
      fetchInvitations();
    } catch (err: any) {
      setError(err?.message || 'Failed to generate invitation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this invitation code? It will immediately become unusable.')) return;
    try {
      await supabaseServices.adminServices.revokeInvitation(id);
      fetchInvitations();
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke invitation.');
    }
  };

  const filteredInvitations = useMemo(() => {
    if (!searchQuery) return invitations;
    return invitations.filter(inv => 
      inv.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (inv.assigned_email && inv.assigned_email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [invitations, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
          <KeyRound className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Doctor Invitations</h1>
          <p className="text-slate-500">Generate and manage secure single-use access codes for new doctors.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-teal-600" />
            Generate New Code
          </h2>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl">{success}</div>}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Assign to Email <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  placeholder="doctor@hospital.com"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">If provided, only this exact email can use the code.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Hospital Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                placeholder="E.g., City General Hospital"
              />
              <p className="text-xs text-slate-500 mt-1">Locks doctors using this code to this hospital.</p>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Valid For (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={daysValid}
                  onChange={(e) => setDaysValid(parseInt(e.target.value) || 7)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Max Uses</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 px-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Code'}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-12rem)]">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-800">Generated Codes</h2>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search codes or emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none w-full sm:w-64 transition-all"
                />
              </div>
              <button 
                onClick={fetchInvitations} 
                className="px-4 py-2 text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-xl font-medium transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm shadow-sm z-10">
                <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Code</th>
                  <th className="p-4">Email / Hospital</th>
                  <th className="p-4">Status & Uses</th>
                  <th className="p-4 hidden sm:table-cell">Created</th>
                  <th className="p-4 hidden md:table-cell">Expires</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent mb-2"></div>
                      <p className="text-slate-500">Loading invitations...</p>
                    </td>
                  </tr>
                ) : filteredInvitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <AlertCircle className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No invitation codes found.</p>
                      {searchQuery && <p className="text-sm text-slate-400 mt-1">Try clearing your search filters.</p>}
                    </td>
                  </tr>
                ) : (
                  filteredInvitations.map((inv) => {
                    const expired = isExpired(inv.expires_at);
                    const isActive = !inv.is_used && !expired;
                    
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">{inv.code}</span>
                            <button
                              onClick={() => handleCopy(inv.code)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Copy Code"
                            >
                              {copiedCode === inv.code ? <Check className="h-4 w-4 text-teal-600" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">
                          {inv.assigned_email ? (
                            <div className="flex items-center gap-1.5 mb-1">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate max-w-[150px]" title={inv.assigned_email}>{inv.assigned_email}</span>
                            </div>
                          ) : null}
                          {inv.hospital_name ? (
                            <div className="text-xs font-semibold text-teal-700 bg-teal-50 inline-block px-2 py-0.5 rounded-md truncate max-w-[150px]" title={inv.hospital_name}>
                              {inv.hospital_name}
                            </div>
                          ) : !inv.assigned_email ? (
                            <span className="text-slate-400 italic text-sm bg-slate-50 px-2 py-0.5 rounded-md">Anyone</span>
                          ) : null}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            {inv.current_uses >= inv.max_uses ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                <Check className="h-3.5 w-3.5" /> Depleted
                              </span>
                            ) : expired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                                <ShieldAlert className="h-3.5 w-3.5" /> Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                                <Clock className="h-3.5 w-3.5" /> Active
                              </span>
                            )}
                            <span className="text-xs text-slate-400 font-medium ml-1">
                              {inv.current_uses} / {inv.max_uses} uses
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 whitespace-nowrap hidden sm:table-cell text-sm">
                          {format(new Date(inv.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="p-4 text-slate-500 whitespace-nowrap hidden md:table-cell text-sm">
                          {inv.expires_at ? format(new Date(inv.expires_at), 'MMM d, yyyy') : 'Never'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isActive && (
                              <a
                                href={`mailto:${inv.assigned_email || ''}?subject=You%20have%20been%20invited%20to%20join%20Health-Connect&body=Hello,%0A%0AYou%20have%20been%20invited%20to%20register%20as%20a%20Doctor%20on%20Health-Connect!%0A%0AClick%20this%20secure%20link%20to%20create%20your%20profile:%0A${encodeURIComponent(window.location.origin)}/?login=false&tab=doctor&invite=${inv.code}%0A%0AWelcome%20aboard!`}
                                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Email Invite (Magic Link)"
                              >
                                <Mail className="h-4 w-4" />
                              </a>
                            )}
                            {isActive && (
                              <button
                                onClick={() => handleRevoke(inv.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Revoke Code"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
