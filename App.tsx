
import React, { useState } from 'react';
import { Wizard } from './components/Wizard';
import { BlogWizard } from './components/BlogWizard';
import { ApiKeyManager } from './components/ApiKeyManager';
import { ApiKeyConfig } from './types';
import { Sparkles, Key, Video, PenTool } from 'lucide-react';

type AppMode = 'script' | 'blog';

function App() {
  const [keys, setKeys] = useState<ApiKeyConfig[]>([]);
  const [isKeyManagerOpen, setIsKeyManagerOpen] = useState(false);
  const [mode, setMode] = useState<AppMode>('script');

  const handleAddKey = (name: string, key: string) => {
    const newKey: ApiKeyConfig = {
      id: crypto.randomUUID(),
      name,
      key,
      isEnabled: true
    };
    setKeys([...keys, newKey]);
  };

  const handleToggleKey = (id: string) => {
    setKeys(keys.map(k => k.id === id ? { ...k, isEnabled: !k.isEnabled } : k));
  };

  const handleDeleteKey = (id: string) => {
    if (confirm('Remove this API key?')) {
      setKeys(keys.filter(k => k.id !== id));
    }
  };

  // Extract only enabled keys as strings to pass to the application logic
  const activeApiKeys = keys.filter(k => k.isEnabled).map(k => k.key);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500 selection:text-white">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2 rounded-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none tracking-tight">Content Architect</h1>
                <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">AI Content Generator</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsKeyManagerOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                activeApiKeys.length > 0 
                  ? 'bg-green-900/20 border-green-500/50 text-green-400 hover:bg-green-900/30' 
                  : 'bg-red-900/20 border-red-500/50 text-red-400 hover:bg-red-900/30'
              }`}
            >
              <Key size={16} />
              <span className="text-sm font-medium">
                {activeApiKeys.length > 0 ? `${activeApiKeys.length} Keys Active` : 'Manage Keys'}
              </span>
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex gap-6">
            <button 
              onClick={() => setMode('script')}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                mode === 'script' 
                  ? 'border-indigo-500 text-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Video size={16} /> Script Architect
            </button>
            <button 
              onClick={() => setMode('blog')}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                mode === 'blog' 
                  ? 'border-green-500 text-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <PenTool size={16} /> Blog Generator
            </button>
          </div>
        </div>
      </header>

      <main>
        {mode === 'script' ? (
           <Wizard apiKeys={activeApiKeys} />
        ) : (
           <BlogWizard apiKeys={activeApiKeys} />
        )}
      </main>

      <ApiKeyManager 
        isOpen={isKeyManagerOpen}
        onClose={() => setIsKeyManagerOpen(false)}
        keys={keys}
        onAdd={handleAddKey}
        onToggle={handleToggleKey}
        onDelete={handleDeleteKey}
      />
    </div>
  );
}

export default App;
