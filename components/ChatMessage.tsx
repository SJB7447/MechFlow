
import React from 'react';
import { Message } from '../types';
import { Icons } from '../constants';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  const processContent = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        // Highlighting technical terms and emoji headers
        const processedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
          .replace(/🚨 (.*?):/g, '<span class="flex items-center gap-2 mb-1 mt-2 font-bold text-red-600"><span class="text-xl">🚨</span> $1</span>')
          .replace(/🛠 (.*?):/g, '<span class="flex items-center gap-2 mb-1 mt-2 font-bold text-blue-600"><span class="text-xl">🛠</span> $1</span>')
          .replace(/✅ (.*?):/g, '<span class="flex items-center gap-2 mb-1 mt-2 font-bold text-green-600"><span class="text-xl">✅</span> $1</span>')
          .replace(/⚠️ (.*?):/g, '<span class="flex items-center gap-2 mb-1 mt-2 font-bold text-amber-600"><span class="text-xl">⚠️</span> $1</span>')
          .replace(/<br\s*\/?>/gi, '<br/>');
          
        return <p key={i} className="mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />;
      });
  };

  return (
    <div className={`flex w-full mb-8 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex gap-4 max-w-[90%] lg:max-w-[80%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 ${
          isAssistant ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-blue-400 border border-slate-700' : 'bg-blue-600 text-white'
        }`}>
          {isAssistant ? <Icons.Wrench /> : <span className="font-bold text-lg">USER</span>}
        </div>
        
        <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
          <div className={`px-6 py-5 rounded-3xl shadow-md border transition-all ${
            isAssistant 
              ? 'bg-white border-slate-200 text-slate-700 rounded-tl-none' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500 text-white rounded-tr-none'
          }`}>
            {message.image && (
              <div className="mb-4 rounded-xl overflow-hidden border-2 border-slate-100 shadow-inner group relative">
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-[10px] text-white rounded font-bold uppercase tracking-widest z-10">
                  Diagnostic Input
                </div>
                <img 
                  src={`data:image/jpeg;base64,${message.image}`} 
                  alt="User upload" 
                  className="max-w-full h-auto block transition-transform group-hover:scale-105 duration-500"
                />
              </div>
            )}
            <div className={`prose prose-slate max-w-none ${!isAssistant ? 'prose-invert' : ''}`}>
              {processContent(message.content)}
            </div>

            {isAssistant && message.sources && message.sources.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Icons.Alert /> 참조 문서 (Technical Sources)
                </p>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all truncate max-w-xs"
                    >
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold">
            {isAssistant ? 'MechFlow Engine v3' : 'User Terminal'} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
