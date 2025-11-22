import React from 'react';
import { Copy } from 'lucide-react';

interface Props {
  title: string;
  content: string;
  isLoading: boolean;
}

export const ScriptResult: React.FC<Props> = ({ title, content, isLoading }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col h-[500px]">
      <div className="bg-black/20 px-4 py-3 flex justify-between items-center border-b border-white/10">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">{title}</h3>
        <button 
          onClick={handleCopy} 
          className="text-gray-400 hover:text-white transition-colors p-1"
          title="Copy to clipboard"
        >
          <Copy size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-black/20 custom-scrollbar">
        {isLoading ? (
           <div className="h-full flex flex-col items-center justify-center space-y-3">
             <div className="w-full space-y-2 max-w-md">
               <div className="h-2 bg-white/10 rounded animate-pulse w-3/4"></div>
               <div className="h-2 bg-white/10 rounded animate-pulse"></div>
               <div className="h-2 bg-white/10 rounded animate-pulse w-5/6"></div>
             </div>
             <p className="text-xs text-gray-500 animate-pulse">Generating script using Kallaway framework...</p>
           </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-mono text-gray-300">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};
