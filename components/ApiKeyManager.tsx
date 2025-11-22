
import React, { useState } from 'react';
import { ApiKeyConfig } from '../types';
import { X, Plus, Trash2, Power, Key, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  keys: ApiKeyConfig[];
  onAdd: (name: string, key: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ApiKeyManager: React.FC<Props> = ({ isOpen, onClose, keys, onAdd, onToggle, onDelete }) => {
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newName.trim() && newKey.trim()) {
      onAdd(newName.trim(), newKey.trim());
      setNewName('');
      setNewKey('');
    }
  };

  const activeCount = keys.filter(k => k.isEnabled).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <ShieldCheck className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">API Key Management</h2>
              <p className="text-sm text-gray-400">
                Add multiple keys to bypass rate limits. Random rotation is applied to enabled keys.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Add New Key */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
              <Plus size={16} className="text-indigo-400" /> Add New Key
            </h3>
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Key Name (e.g. Personal Account)"
                className="flex-1 bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
              />
              <input 
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Paste Gemini API Key"
                className="flex-[2] bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-mono"
              />
              <button 
                onClick={handleAdd}
                disabled={!newName.trim() || !newKey.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Key List */}
          <div className="space-y-3">
            <div className="flex justify-between items-end pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-gray-300">Your Keys ({keys.length})</h3>
              <span className="text-xs text-green-400 font-mono bg-green-900/20 px-2 py-0.5 rounded">
                {activeCount} Active
              </span>
            </div>

            {keys.length === 0 ? (
              <div className="text-center py-8 text-gray-500 italic">
                No API keys added yet. Add one to start generating scripts.
              </div>
            ) : (
              keys.map((keyConfig) => (
                <div 
                  key={keyConfig.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    keyConfig.isEnabled 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-black/40 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`p-2 rounded-full ${keyConfig.isEnabled ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                      <Key size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{keyConfig.name}</p>
                      <p className="text-xs text-gray-500 font-mono truncate">
                        {keyConfig.key.substring(0, 8)}...{keyConfig.key.substring(keyConfig.key.length - 4)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button 
                      onClick={() => onToggle(keyConfig.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        keyConfig.isEnabled
                          ? 'bg-green-900/30 text-green-400 border border-green-500/30 hover:bg-green-900/50'
                          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      <Power size={12} />
                      {keyConfig.isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button 
                      onClick={() => onDelete(keyConfig.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end">
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">Close Manager</button>
        </div>
      </div>
    </div>
  );
};
