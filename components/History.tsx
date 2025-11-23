
import React, { useState, useEffect } from 'react';
import { SavedBlog, SavedScript } from '../types';
import { Trash2, FileText, Download, Calendar, ChevronLeft, Search, Eye, Video, PenTool } from 'lucide-react';
import { ScriptResult } from './ScriptResult';

type HistoryTab = 'scripts' | 'blogs';

export const History: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('scripts');
  const [blogHistory, setBlogHistory] = useState<SavedBlog[]>([]);
  const [scriptHistory, setScriptHistory] = useState<SavedScript[]>([]);
  
  const [selectedItem, setSelectedItem] = useState<SavedBlog | SavedScript | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedBlogs = localStorage.getItem('blog_history');
    if (savedBlogs) {
      try { setBlogHistory(JSON.parse(savedBlogs)); } catch (e) {}
    }

    const savedScripts = localStorage.getItem('script_history');
    if (savedScripts) {
      try { setScriptHistory(JSON.parse(savedScripts)); } catch (e) {}
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved item?')) {
      if (activeTab === 'blogs') {
        const updated = blogHistory.filter(h => h.id !== id);
        setBlogHistory(updated);
        localStorage.setItem('blog_history', JSON.stringify(updated));
      } else {
        const updated = scriptHistory.filter(h => h.id !== id);
        setScriptHistory(updated);
        localStorage.setItem('script_history', JSON.stringify(updated));
      }
      if (selectedItem?.id === id) setSelectedItem(null);
    }
  };

  const handleExportDoc = (item: SavedBlog | SavedScript) => {
    let content = item.content;
    let htmlBody = '';

    if (activeTab === 'blogs') {
       // Blog Formatting
       htmlBody = content
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
        .replace(/\*(.*?)\*/gim, '<i>$1</i>')
        .replace(/^\s*-\s+(.*$)/gim, '<p style="margin-left: 20px; text-indent: -20px;">• $1</p>')
        .replace(/\n\n/gim, '<br><br>')
        .replace(/\n/gim, '<br>');
    } else {
       // Script Formatting
       htmlBody = content
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
        .replace(/\*(.*?)\*/gim, '<i>$1</i>')
        .replace(/\n/gim, '<br>');
    }

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${item.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          h1 { font-size: 24px; color: #333; }
          h2 { font-size: 20px; color: #444; margin-top: 20px; }
          h3 { font-size: 16px; color: #666; margin-top: 15px; }
        </style>
      </head>
      <body>${htmlBody}</body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentList = activeTab === 'blogs' ? blogHistory : scriptHistory;
  
  const filteredList = currentList.filter(h => 
    h.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedItem) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setSelectedItem(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} /> Back to History
          </button>
          <button 
            onClick={() => handleExportDoc(selectedItem)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === 'blogs' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <Download size={16} /> Export DOCX
          </button>
        </div>
        <ScriptResult 
          title={selectedItem.title} 
          content={selectedItem.content} 
          isLoading={false} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-orange-500" /> History
          </h2>
          <p className="text-gray-400 text-sm">Access your previously generated content.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'scripts' 
                ? 'border-indigo-500 text-white' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
            <Video size={16} /> Saved Scripts ({scriptHistory.length})
        </button>
        <button
            onClick={() => setActiveTab('blogs')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'blogs' 
                ? 'border-green-500 text-white' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
        >
            <PenTool size={16} /> Saved Blogs ({blogHistory.length})
        </button>
      </div>

      {currentList.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
          <FileText size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-300">No saved {activeTab} yet</h3>
          <p className="text-gray-500 text-sm mt-2">
            {activeTab === 'scripts' ? "Generate a script and click 'Save' to see it here." : "Generate a blog post and click 'Save' to see it here."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-5 cursor-pointer transition-all relative overflow-hidden ${
                activeTab === 'blogs' ? 'hover:border-green-500/50' : 'hover:border-indigo-500/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${activeTab === 'blogs' ? 'bg-green-900/20 text-green-400' : 'bg-indigo-900/20 text-indigo-400'}`}>
                  <FileText size={20} />
                </div>
                <button 
                  onClick={(e) => handleDelete(item.id, e)}
                  className="text-gray-500 hover:text-red-400 p-2 hover:bg-white/5 rounded-lg transition-colors z-10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <h3 className={`font-bold text-white text-lg mb-2 line-clamp-2 transition-colors ${
                activeTab === 'blogs' ? 'group-hover:text-green-400' : 'group-hover:text-indigo-400'
              }`}>
                {item.title}
              </h3>
              
              <div className="text-sm text-gray-400 space-y-2">
                <p className="line-clamp-1"><span className="text-gray-600">Topic:</span> {item.topic}</p>
                <p className="line-clamp-1"><span className="text-gray-600">Audience:</span> {item.audience}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {new Date(item.date).toLocaleDateString()}
                </span>
                <span className={`flex items-center gap-1 group-hover:translate-x-1 transition-transform ${
                     activeTab === 'blogs' ? 'group-hover:text-green-400' : 'group-hover:text-indigo-400'
                }`}>
                  View <Eye size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
