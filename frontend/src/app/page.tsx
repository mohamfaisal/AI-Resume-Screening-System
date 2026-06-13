"use client";

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Briefcase, Users, Settings, UploadCloud, 
  CheckCircle2, XCircle, Search, Filter, ChevronRight, 
  AlertTriangle, FileText, Download, Network, Mail, Phone, Eye, SearchX, Columns
} from 'lucide-react';

type ViewState = 'dashboard' | 'jobs' | 'talent';

export default function HireMindPremiumDashboard() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [files, setFiles] = useState<FileList | null>(null);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({}); // Stores the actual PDF files for viewing
  
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [emiratization, setEmiratization] = useState(true);
  
  const [candidates, setCandidates] = useState<any[]>([]);
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, 'pending' | 'shortlisted' | 'rejected'>>({});
  
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'interview'>('overview');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'shortlisted' | 'pending' | 'rejected'>('all');

  const stats = useMemo(() => {
    const total = candidates.length;
    const avgScore = total > 0 ? Math.round(candidates.reduce((acc, curr) => acc + curr.match_score, 0) / total) : 0;
    const shortlisted = Object.values(candidateStatuses).filter(s => s === 'shortlisted').length;
    return { total, avgScore, shortlisted };
  }, [candidates, candidateStatuses]);

  // Apply Search and Filters
  const filteredCandidates = useMemo(() => {
    return candidates.filter(cand => {
      const matchesSearch = cand.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) || cand.role.toLowerCase().includes(searchQuery.toLowerCase());
      const status = candidateStatuses[`${cand.candidate_name}-${cand.original_filename}`] || 'pending';
      const matchesFilter = filterStatus === 'all' || status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [candidates, searchQuery, filterStatus, candidateStatuses]);

  const handleProcessHiring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || !jobTitle || !jobDesc) return;

    setLoading(true);
    const formData = new FormData();
    const urls: Record<string, string> = { ...pdfUrls };
    
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
      // Store the PDF Blob URL locally so we can view it later without needing a database!
      urls[files[i].name] = URL.createObjectURL(files[i]); 
    }
    setPdfUrls(urls);

    formData.append("job_title", jobTitle);
    formData.append("job_requirements", jobDesc);
    formData.append("emiratization_priority", emiratization.toString());

  try {
      // It will use your Render URL in production, and localhost on your computer
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_BASE_URL}/api/upload-resumes`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setCandidates(prev => [...data, ...prev]); // Append to existing for Global Talent pool
      
      const initialStatuses = { ...candidateStatuses };
      data.forEach((c: any) => initialStatuses[`${c.candidate_name}-${c.original_filename}`] = 'pending');
      setCandidateStatuses(initialStatuses);
      
    } catch (err) {
      console.error("API Error", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (filename: string, name: string, status: 'shortlisted' | 'rejected') => {
    setCandidateStatuses(prev => ({ ...prev, [`${name}-${filename}`]: status }));
  };

  const viewOriginalCV = (filename: string) => {
    const url = pdfUrls[filename];
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-[#0F172A] font-sans selection:bg-[#0F172A] selection:text-white overflow-hidden">
      
      {/* Sidebar with New Recruiting Logo */}
      <aside className="w-[280px] bg-[#020617] text-slate-300 flex flex-col hidden md:flex shrink-0 shadow-2xl z-20">
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <Network className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">HireMind<span className="text-indigo-400">.ai</span></span>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-4 mt-4">Platform</p>
          <nav className="space-y-1.5">
            <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentView === 'dashboard' ? 'bg-white/10 text-white shadow-sm' : 'hover:bg-white/5 hover:text-white text-slate-400'}`}>
              <LayoutDashboard className="w-4 h-4 mr-3" /> Intelligence Hub
            </button>
            <button onClick={() => setCurrentView('jobs')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentView === 'jobs' ? 'bg-white/10 text-white shadow-sm' : 'hover:bg-white/5 hover:text-white text-slate-400'}`}>
              <Columns className="w-4 h-4 mr-3" /> Active Requisitions
            </button>
            <button onClick={() => setCurrentView('talent')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentView === 'talent' ? 'bg-white/10 text-white shadow-sm' : 'hover:bg-white/5 hover:text-white text-slate-400'}`}>
              <Users className="w-4 h-4 mr-3" /> Global Talent Pool
            </button>
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative bg-[#F8FAFC]">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 shrink-0 sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {currentView === 'dashboard' ? 'Recruitment Intelligence' : currentView === 'jobs' ? 'Requisition Boards' : 'Talent Repository'}
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> System Operational
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm shadow-md">HR</div>
          </div>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto w-full space-y-8">

          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Resumes Processed', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Average Platform Match', value: `${stats.avgScore}%`, icon: Network, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Candidates Shortlisted', value: stats.shortlisted, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{stat.label}</p>
                      <h3 className="text-4xl font-black text-[#0F172A] tracking-tight">{stat.value}</h3>
                    </div>
                    <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color}`}><stat.icon className="w-7 h-7" /></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Configuration Panel */}
                <section className="xl:col-span-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100">
                    <h3 className="font-bold text-[#0F172A] text-lg">Campaign Parameters</h3>
                    <p className="text-sm text-slate-500 mt-1">Define the AI evaluation criteria.</p>
                  </div>
                  
                  <form onSubmit={handleProcessHiring} className="p-8 space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">Target Designation</label>
                      <input 
                        type="text" placeholder="e.g. Prompt Engineer" 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">Technical Requirements</label>
                      <textarea 
                        rows={5} placeholder="Paste core competencies..." 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} required
                      />
                    </div>
                    <div className="pt-2">
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 relative cursor-pointer">
                        <UploadCloud className="w-6 h-6 text-indigo-500 mx-auto mb-3" />
                        <span className="block text-sm font-bold">{files ? `${files.length} documents staged` : 'Drag & drop PDFs'}</span>
                        <input type="file" multiple accept=".pdf" onChange={(e) => setFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 bg-[#0F172A] hover:bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-70 flex justify-center items-center">
                      {loading ? "Initializing AI Engine..." : "Execute Pipeline Analysis"}
                    </button>
                  </form>
                </section>

                {/* Candidate Roster Table (With Active Search & Filter) */}
                <section className="xl:col-span-8 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[820px]">
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="font-bold text-[#0F172A] text-lg">Analyzed Roster</h3>
                    </div>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" placeholder="Search profiles..." 
                          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-4 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500 w-56 font-medium" 
                        />
                      </div>
                      <select 
                        value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="text-sm font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl outline-none"
                      >
                        <option value="all">All Candidates</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 p-2">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white/95 backdrop-blur z-10">
                        <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                          <th className="px-6 py-4">Applicant Profile</th>
                          <th className="px-6 py-4 text-center">Contact</th>
                          <th className="px-6 py-4 w-56">System Score</th>
                          <th className="px-6 py-4 text-right">Decision</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {filteredCandidates.map((cand, idx) => {
                          const status = candidateStatuses[`${cand.candidate_name}-${cand.original_filename}`];
                          return (
                          <tr key={idx} className={`group hover:bg-slate-50 rounded-xl transition-all ${status === 'rejected' ? 'opacity-40 grayscale' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center cursor-pointer" onClick={() => setSelectedCandidate(cand)}>
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mr-4">
                                  {cand.candidate_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-[#0F172A] text-base group-hover:text-indigo-600 transition-colors">
                                    {cand.candidate_name}
                                  </p>
                                  <p className="text-xs font-medium text-slate-500 mt-0.5">{cand.visa_status}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                    <a href={`mailto:${cand.email}`} title={cand.email} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"><Mail className="w-4 h-4"/></a>
                                    <a href={`tel:${cand.phone}`} title={cand.phone} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"><Phone className="w-4 h-4"/></a>
                                    {pdfUrls[cand.original_filename] && (
                                        <button onClick={() => viewOriginalCV(cand.original_filename)} title="View Original CV" className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"><Eye className="w-4 h-4"/></button>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-[#0F172A]">{cand.match_score}% Match</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${cand.match_score >= 80 ? 'bg-emerald-500' : cand.match_score >= 50 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                                  style={{ width: `${cand.match_score}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => updateStatus(cand.original_filename, cand.candidate_name, 'shortlisted')}
                                  className={`p-2 rounded-lg border transition-all ${status === 'shortlisted' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 bg-white'}`}
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => updateStatus(cand.original_filename, cand.candidate_name, 'rejected')}
                                  className={`p-2 rounded-lg border transition-all ${status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-slate-200 text-slate-400 hover:border-rose-500 hover:text-rose-500 bg-white'}`}
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )})}
                        {filteredCandidates.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-32">
                              <SearchX className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                              <h4 className="text-[#0F172A] font-bold text-lg mb-1">No candidates found</h4>
                              <p className="text-sm font-medium text-slate-500">Try adjusting your filters or search terms.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          )}

          {/* VIEW: ACTIVE JOBS KANBAN BOARD */}
          {currentView === 'jobs' && (
            <div className="h-full flex flex-col space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-[#0F172A]">Requisition Boards</h2>
                        <p className="text-sm text-slate-500">Pipeline stages for your active campaigns.</p>
                    </div>
                    <button className="bg-[#0F172A] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors">
                        + Create Campaign
                    </button>
                </div>
                
                {/* Kanban Simulation */}
                <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
                    {['Sourcing (AI)', 'Screening', 'Interviewing', 'Offered'].map((stage, idx) => (
                        <div key={idx} className="w-[320px] shrink-0 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200/50 p-4">
                            <h3 className="font-bold text-slate-700 mb-4 flex justify-between items-center">
                                {stage} <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs">{idx === 0 ? candidates.length : 0}</span>
                            </h3>
                            <div className="flex-1 space-y-3">
                                {idx === 0 && candidates.map((cand, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-grab hover:border-indigo-300">
                                        <p className="font-bold text-sm text-[#0F172A]">{cand.candidate_name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{cand.role}</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{cand.match_score}% Match</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* VIEW: GLOBAL TALENT POOL */}
          {currentView === 'talent' && (
            <div className="h-full flex flex-col space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-[#0F172A]">Global Talent Repository</h2>
                        <p className="text-sm text-slate-500">Consolidated database of all historic and active profiles.</p>
                    </div>
                </div>
                <div className="flex-1 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Phone</th>
                          <th className="px-6 py-4">Original Campaign</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {candidates.map((cand, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 border-b border-slate-50">
                              <td className="px-6 py-4 font-bold text-[#0F172A]">{cand.candidate_name}</td>
                              <td className="px-6 py-4 text-slate-600">{cand.email}</td>
                              <td className="px-6 py-4 text-slate-600">{cand.phone}</td>
                              <td className="px-6 py-4 font-medium text-indigo-600 bg-indigo-50/30 rounded inline-block mt-3 ml-6 px-2 py-1">{cand.role}</td>
                              <td className="px-6 py-4 text-right">
                                  <button onClick={() => setSelectedCandidate(cand)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">View Profile</button>
                              </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
            </div>
          )}

        </div>

        {/* Updated Modal with Real Text & Rejection Reasons */}
        {selectedCandidate && (
          <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-8">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              <div className="px-8 py-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-600/30">
                    {selectedCandidate.candidate_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">{selectedCandidate.candidate_name}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="bg-[#0F172A] text-white text-xs font-bold px-3 py-1 rounded-lg">AI Match: {selectedCandidate.match_score}%</span>
                      <span className="text-sm text-slate-500 font-semibold flex items-center"><Briefcase className="w-4 h-4 mr-1.5" /> {selectedCandidate.visa_status}</span>
                      {pdfUrls[selectedCandidate.original_filename] && (
                        <button onClick={() => viewOriginalCV(selectedCandidate.original_filename)} className="text-xs font-bold text-indigo-600 underline">View Original CV</button>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="flex items-center text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-all">
                  Close Profile
                </button>
              </div>

              <div className="flex px-8 bg-white border-b border-slate-100">
                {['overview', 'skills', 'interview'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-4 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    {tab === 'overview' ? 'Executive Summary' : tab === 'skills' ? 'Strengths & Fit Analysis' : 'AI Interview Guide'}
                  </button>
                ))}
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-white">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Automated Assessment</h4>
                        <p className="text-slate-700 text-base font-medium leading-relaxed">{selectedCandidate.summary}</p>
                    </div>
                    <div className={`p-6 rounded-2xl border ${selectedCandidate.match_score >= 60 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                        <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${selectedCandidate.match_score >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>System Decision Indicator</h4>
                        <p className={`text-sm font-bold ${selectedCandidate.match_score >= 60 ? 'text-emerald-800' : 'text-rose-800'}`}>{selectedCandidate.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5" /> Verified Strengths</h4>
                      <ul className="space-y-3">
                        {selectedCandidate.strengths.map((str: string, i: number) => (
                          <li key={i} className="flex items-start text-sm font-medium text-slate-700 bg-emerald-50/50 p-3 rounded-xl"><span className="text-emerald-500 mr-3 mt-0.5">•</span> {str}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5" /> Operational Risks</h4>
                      <ul className="space-y-3">
                        {selectedCandidate.risks.map((risk: string, i: number) => (
                          <li key={i} className="flex items-start bg-rose-50 p-3 rounded-xl text-rose-700 text-sm font-bold"><span className="mr-2">⚠️</span> {risk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'interview' && (
                  <div className="space-y-4">
                    {selectedCandidate.ai_interview_questions.map((q: string, i: number) => (
                      <div key={i} className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                        <p className="text-sm text-indigo-900 font-bold leading-relaxed"><span className="text-indigo-400 mr-2">Q{i + 1}.</span> {q}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}