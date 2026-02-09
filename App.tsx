
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import { Message, Source, DiagnosticMode } from './types';
import { Icons, INITIAL_MESSAGE } from './constants';
import { geminiService } from './services/geminiService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authNickname, setAuthNickname] = useState('');
  const [authRole, setAuthRole] = useState<'Barista' | 'Engineer'>('Barista');
  const [authError, setAuthError] = useState('');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: INITIAL_MESSAGE,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [diagnosticMode, setDiagnosticMode] = useState<DiagnosticMode>('general');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; preview: string; mimeType: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.role) {
        setDiagnosticMode(session.user.user_metadata.role === 'Engineer' ? 'expert' : 'general');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.role) {
        setDiagnosticMode(session.user.user_metadata.role === 'Engineer' ? 'expert' : 'general');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authView === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              nickname: authNickname,
              role: authRole,
            },
          },
        });
        if (error) throw error;
        alert('회원가입 성공! 이제 로그인해 주세요.');
        setAuthView('login');
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedImage({
        base64: base64String,
        preview: reader.result as string,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && !selectedImage) || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue || "이미지 분석 요청",
      image: selectedImage?.base64,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    const imageToSubmit = selectedImage;
    setSelectedImage(null);
    setIsGenerating(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      sources: []
    };
    
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const history = messages.slice(1).map(m => {
        const parts: any[] = [{ text: m.content }];
        if (m.image) {
          parts.push({
            inlineData: {
              data: m.image,
              mimeType: 'image/jpeg'
            }
          });
        }
        return {
          role: m.role,
          parts: parts
        };
      });

      let accumulatedResponse = '';
      let accumulatedSources: Source[] = [];
      const stream = geminiService.streamDiagnostic(
        userMessage.content, 
        history,
        diagnosticMode,
        imageToSubmit ? { data: imageToSubmit.base64, mimeType: imageToSubmit.mimeType } : undefined
      );
      
      for await (const chunk of stream) {
        accumulatedResponse += chunk.text;
        
        if (chunk.sources.length > 0) {
           const newSources = chunk.sources.filter(ns => 
             !accumulatedSources.some(as => as.url === ns.url)
           );
           if (newSources.length > 0) {
             accumulatedSources = [...accumulatedSources, ...newSources];
           }
        }

        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantId 
              ? { ...msg, content: accumulatedResponse, sources: accumulatedSources } 
              : msg
          )
        );
      }
    } catch (error) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantId 
            ? { ...msg, content: "⚠️ 진단 중 오류가 발생했습니다. AI 엔진 상태를 확인해 주세요." } 
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 lg:p-12 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-blue-400 mb-4 shadow-xl">
              <Icons.Gear />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">MechFlow <span className="text-blue-600 font-normal">Cloud</span></h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Professional Maintenance Terminal</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operator ID (Email)</label>
              <input 
                type="email" 
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-bold"
                placeholder="tech@mechflow.ai"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Security Key (Password)</label>
              <input 
                type="password" 
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-bold"
                placeholder="••••••••"
              />
            </div>

            {authView === 'signup' && (
              <>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technician Name</label>
                  <input 
                    type="text" 
                    required
                    value={authNickname}
                    onChange={(e) => setAuthNickname(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-bold"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Access Level</label>
                  <select 
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value as any)}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
                  >
                    <option value="Barista">Barista (General)</option>
                    <option value="Engineer">Engineer (Expert)</option>
                  </select>
                </div>
              </>
            )}

            {authError && <p className="text-red-500 text-xs font-bold text-center animate-pulse">{authError}</p>}

            <button 
              type="submit"
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10"
            >
              {authView === 'login' ? 'Establish Connection' : 'Register Operator'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setAuthView(authView === 'login' ? 'signup' : 'login')}
              className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              {authView === 'login' ? "Need a technician account? Sign up" : "Already registered? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        mode={diagnosticMode}
        setMode={setDiagnosticMode}
        messages={messages}
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col min-w-0 relative bg-white lg:bg-transparent">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 lg:hidden text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Icons.Menu />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-blue-400 shadow-lg shadow-slate-900/20">
                <Icons.Gear />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-xl tracking-tighter">MechFlow <span className="text-blue-600">{diagnosticMode === 'expert' ? 'Expert' : 'User'}</span></h2>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Technician: {user.user_metadata?.nickname || user.email}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Level</p>
                <p className={`text-xs font-bold ${diagnosticMode === 'expert' ? 'text-slate-900' : 'text-blue-600'}`}>
                   {diagnosticMode === 'expert' ? 'Precision Engineering' : 'Operator Guidance'}
                </p>
             </div>
             <div className="h-10 w-[1px] bg-slate-200"></div>
             <button onClick={handleLogout} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors">Terminate Session</button>
          </div>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 space-y-2 scroll-smooth bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]"
        >
          <div className="max-w-4xl mx-auto">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isGenerating && (
              <div className="flex justify-start items-center gap-4 mb-8 animate-in fade-in slide-in-from-left-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <div className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-600 font-black uppercase tracking-widest animate-pulse">Analyzing Data...</span>
                  <span className="text-[10px] text-slate-400 font-bold">장비 매뉴얼 분석 및 실시간 솔루션 생성 중</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="px-4 pb-8 sm:px-8 lg:px-12 bg-white/50 backdrop-blur-sm lg:bg-transparent">
          <div className="max-w-4xl mx-auto">
            <form 
              onSubmit={handleSubmit}
              className="flex flex-col gap-2 relative bg-white border-2 border-slate-200 rounded-[2.5rem] shadow-2xl p-2 transition-all focus-within:border-blue-500/50 focus-within:ring-8 focus-within:ring-blue-500/5"
            >
              {selectedImage && (
                <div className="flex items-center gap-4 p-3 m-2 bg-slate-50 rounded-3xl border border-slate-200 animate-in zoom-in-95 duration-300">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md">
                    <img src={selectedImage.preview} alt="Target equipment" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-xl"
                    >
                      <Icons.X />
                    </button>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Visual Input</span>
                    <span className="text-xs font-bold text-slate-700">장비 상태 확인됨</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 items-center px-4 py-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
                    ${selectedImage 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                  `}
                  title="사진 촬영 및 업로드"
                >
                  <Icons.Camera />
                </button>
                
                <div className="flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={selectedImage ? "기기 증상을 입력하세요..." : "모델명과 에러코드를 입력하세요..."}
                    className="w-full px-4 py-4 bg-transparent focus:outline-none text-slate-900 placeholder-slate-400 font-bold text-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || (!inputValue.trim() && !selectedImage)}
                  className={`
                    w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all shadow-xl
                    ${isGenerating || (!inputValue.trim() && !selectedImage)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                      : 'bg-slate-900 text-white hover:bg-black active:scale-95'}
                  `}
                >
                  <Icons.Send />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
