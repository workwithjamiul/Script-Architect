import React, { useState, useEffect } from 'react';
import { SavedBlog } from '../types';
import { Trash2, FileText, Download, Calendar, ChevronLeft, Search, Eye } from 'lucide-react';
import { ScriptResult } from './ScriptResult';

export const BlogHistory: React.FC = () => {
  const [history, setHistory] = useState<SavedBlog[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<SavedBlog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('blog_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history");
      }
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved blog?')) {
      const updated = history.filter(h => h.id !== id);
      setHistory(updated);
      localStorage.setItem('blog_history', JSON.stringify(updated));
      if (selectedBlog?.id === id) setSelectedBlog(null);
    }
  };

  const handleExportDoc = (blog: SavedBlog) => {
    let htmlBody = blog.content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
      .replace(/\*(.*?)\*/gim, '<i>$1</i>')
      .replace(/^\s*-\s+(.*$)/gim, '<p style="margin-left: 20px; text-indent: -20px;">• $1</p>')
      .replace(/\n\n/gim, '<br><br>')
      .replace(/\n/gim, '<br>');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${blog.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          h1 { font-size: 24px; color: #333; }
          h2 { font-size: 20px; color: #444; margin-top: 20px; }
        </style>
      </head>
      <body>${htmlBody}</body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blog.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(h => 
    h.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedBlog) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setSelectedBlog(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} /> Back to History
          </button>
          <button 
            onClick={() => handleExportDoc(selectedBlog)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <Download size={16} /> Export DOCX
          </button>
        </div>
        <ScriptResult 
          title={selectedBlog.title} 
          content={selectedBlog.content} 
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
            <FileText className="text-orange-500" /> Blog History
          </h2>
          <p className="text-gray-400 text-sm">Access your previously generated articles.</p>
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

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
          <FileText size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-300">No saved blogs yet</h3>
          <p className="text-gray-500 text-sm mt-2">Generate a blog post and click "Save to History" to see it here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((blog) => (
            <div 
              key={blog.id}
              onClick={() => setSelectedBlog(blog)}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 rounded-xl p-5 cursor-pointer transition-all relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-orange-900/20 text-orange-400 p-2 rounded-lg">
                  <FileText size={20} />
                </div>
                <button 
                  onClick={(e) => handleDelete(blog.id, e)}
                  className="text-gray-500 hover:text-red-400 p-2 hover:bg-white/5 rounded-lg transition-colors z-10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <h3 className="font-bold text-white text-lg mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors">
                {blog.title}
              </h3>
              
              <div className="text-sm text-gray-400 space-y-2">
                <p className="line-clamp-1"><span className="text-gray-600">Topic:</span> {blog.topic}</p>
                <p className="line-clamp-1"><span className="text-gray-600">Audience:</span> {blog.audience}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {new Date(blog.date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-orange-400/50 group-hover:text-orange-400">
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