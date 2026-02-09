
import React, { useState } from 'react';
import { Icons } from '../constants';
import { DiagnosticMode, Message } from '../types';
import { saveDiagnosticReport, supabase } from '../services/supabaseClient';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mode: DiagnosticMode;
  setMode: (mode: DiagnosticMode) => void;
  messages: Message[];
  user: any;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, mode, setMode, messages, user, onLogout }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      await saveDiagnosticReport({
        mode,
        history: messages,
        timestamp: new Date().toISOString(),
        userId: user?.id
      });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-slate-900 text-white z-30 transition-transform duration-300 transform
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Icons.Gear />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">MechFlow</h1>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
            <section>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Operator Profile</h2>
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                <p className="text-xs font-black text-white mb-1 truncate">{user?.user_metadata?.nickname || 'Technician'}</p>
                <p className="text-[10px] text-slate-500 truncate mb-4">{user?.email}</p>
                <div className="inline-flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-black text-blue-400 uppercase">
                   Access: {user?.user_metadata?.role || 'Barista'}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Diagnostic Protocol</h2>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setMode('general')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    mode === 'general' 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">☕</span>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase">Standard</p>
                    <p className="text-[10px] opacity-60">Barista Guidance</p>
                  </div>
                </button>
                <button 
                  onClick={() => setMode('expert')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    mode === 'expert' 
                      ? 'bg-slate-100 border-white text-slate-900 shadow-lg' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">🔧</span>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase">Precision</p>
                    <p className="text-[10px] opacity-60">Expert Engineering</p>
                  </div>
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Cloud Sync</h2>
              <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 space-y-4">
                 <button 
                   onClick={handleCloudSync}
                   disabled={isSyncing || messages.length <= 1}
                   className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                     syncStatus === 'success' 
                       ? 'bg-green-600 text-white' 
                       : syncStatus === 'error'
                       ? 'bg-red-600 text-white'
                       : 'bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50'
                   }`}
                 >
                   {isSyncing ? (
                     <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                   ) : syncStatus === 'success' ? (
                     'Synced'
                   ) : syncStatus === 'error' ? (
                     'Sync Failed'
                   ) : (
                     'Push to Cloud'
                   )}
                 </button>
                 <div className="space-y-2">
                   <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase">
                      <span>Sync Status</span>
                      <span className="text-green-500">ENCRYPTED</span>
                   </div>
                   <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase">
                      <span>Session Logs</span>
                      <span className="text-white font-mono">{messages.length - 1}</span>
                   </div>
                 </div>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Safety Guide</h2>
              <div className="p-4 bg-red-900/10 border border-red-900/20 rounded-2xl">
                <div className="flex items-center gap-2 text-red-500 mb-2 font-black text-[9px] uppercase tracking-widest">
                  <Icons.Alert />
                  <span>Safety Lock</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  모든 작업 전 전원을 차단하십시오. 보일러 압력이 0 bar인지 반드시 확인해야 합니다.
                </p>
              </div>
            </section>
          </div>

          <div className="pt-6 border-t border-slate-800 mt-auto">
            <button 
              onClick={onLogout}
              className="w-full py-3 text-slate-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              Terminate Session
            </button>
            <p className="text-[8px] text-slate-700 text-center font-bold tracking-[0.3em] uppercase mt-4">
              MechFlow Cloud v3.0.1
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
