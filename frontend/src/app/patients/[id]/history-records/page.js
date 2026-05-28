'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import { useAuth } from '@/context/AuthContext';
import { FileText, ArrowLeft, Calendar, User, Phone, Activity } from 'lucide-react';
import Link from 'next/link';

export default function HistoryRecordsPage({ params }) {
  // Use React.use() to unwrap params in Next.js 15+ if needed, but standard params.id is fine.
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const router = useRouter();
  const { token, user } = useAuth();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:5000/api');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchPatientData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch patient records. They may not exist.');
        }
        
        const data = await res.json();
        setPatient(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, token, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 mt-8 flex flex-col items-center justify-center space-y-4">
          <div className="pulse-loader">
            <div></div><div></div>
          </div>
          <p className="text-slate-400 font-semibold animate-pulse">Retrieving diagnostic records...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 mt-8 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200">
            <h2 className="text-2xl font-black text-rose-600 mb-2">Record Not Found</h2>
            <p className="text-slate-500 mb-6">{error || 'The requested patient profile could not be located.'}</p>
            <Link href="/dashboard" className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-5xl mx-auto p-6 py-12">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-slate-800 px-8 py-6 text-white flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black">{patient.name}</h1>
              <p className="text-slate-300 mt-1 font-medium text-sm flex items-center gap-4">
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> {patient.age} yrs / {patient.gender}</span>
                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {patient.phoneNumber}</span>
              </p>
            </div>
            <FileText className="w-12 h-12 text-slate-600 opacity-50" />
          </div>

          {/* Body Section */}
          <div className="p-8 space-y-8">
            
            {/* Clinical History */}
            <section>
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Diagnostic Clinical History
              </h3>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <p className="text-slate-700 whitespace-pre-wrap font-medium">
                  {patient.medicalHistory || 'No previous medical history has been recorded for this patient.'}
                </p>
              </div>
            </section>

            {/* Past Appointments */}
            <section>
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Appointment History
              </h3>
              
              {patient.appointments && patient.appointments.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {patient.appointments.map((apt) => (
                    <div key={apt.id} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xxs font-extrabold uppercase ${
                          apt.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-600' :
                          apt.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 font-semibold mb-1">
                        {apt.reason || 'Routine Checkup'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  No previous appointments found.
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
