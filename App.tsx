import React, { useState } from 'react';
import { Wizard } from './components/Wizard';
import { Sparkles, Key, Plus, Trash2 } from 'lucide-react';

function App() {
  const [inputKey, setInputKey] = useState('');
  const [apiKeys, setApiKeys] = useState<string[]>([]);

  const handleAddKey = () => {
    if (inputKey.trim()) {
      setApiKeys([...apiKeys, inputKey.trim()]);
      setInputKey('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddKey();
    }
  };

  const clearKeys = () => {
    if (confirm('Are you sure you want to remove all API keys?')) {
      setApiKeys([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500 selection:text-white">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none tracking-tight">Script Architect</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Kallaway Framework</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Key size={14} className="absolute left-3 text-gray-500" />
              <input 
                type="password" 
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add Gemini API Key (Must)" 
                className="bg-black/40 border border-white/10 rounded-l-full pl-9 pr-4 py-1.5 text-sm text-white w-48 focus:w-64 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder:text-gray-600"
              />
              <button 
                onClick={handleAddKey}
                disabled={!inputKey.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-3 py-1.5 rounded-r-full border-l border-white/10 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {apiKeys.length > 0 && (
              <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/30 px-3 py-1.5 rounded-full">
                <span className="text-xs text-green-400 font-medium whitespace-nowrap">
                  {apiKeys.length} Key{apiKeys.length > 1 ? 's' : ''} Active
                </span>
                <button onClick={clearKeys} className="text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <Wizard apiKeys={apiKeys} />
      </main>
    </div>
  );
}

export default App;