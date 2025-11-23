
import React, { useState } from 'react';
import { BlogData, BlogStep, BlogIdea, BlogOutlineSection, SavedBlog } from '../types';
import { generateBlogStrategy, generateBlogOutline, generateBlogContent, generateBlogIntro, generateAudienceSuggestions } from '../services/geminiService';
import { PenTool, Loader2, CheckCircle2, FileText, ArrowRight, Download, RefreshCw, Search, ChevronRight, Trash2, Sparkles, Save } from 'lucide-react';
import { ScriptResult } from './ScriptResult';

interface Props {
  apiKeys: string[];
}

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Spanish (Español)' },
  { code: 'Portuguese', label: 'Portuguese (Português)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'Hindi', label: 'Hindi (हिन्दी)' },
  { code: 'Bengali', label: 'Bengali (বাংলা)' },
  { code: 'Japanese', label: 'Japanese (日本語)' },
  { code: 'Chinese', label: 'Chinese (中文)' },
];

const TONES = ['Professional', 'Casual', 'Authoritative', 'Friendly', 'Controversial', 'Inspirational'];

export const BlogWizard: React.FC<Props> = ({ apiKeys }) => {
  const [step, setStep] = useState<BlogStep>(BlogStep.STRATEGY);
  const [data, setData] = useState<BlogData>({
    topic: '',
    targetAudience: '',
    tone: 'Professional',
    language: 'English',
    selectedTitle: '',
    seoKeywords: [],
    competitorContent: ['', '', '', '', ''], // 5 Slots
    outline: [],
    fullContent: ''
  });
  
  const [ideas, setIdeas] = useState<BlogIdea[]>([]);
  const [selectedIdeaIdx, setSelectedIdeaIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audienceSuggestions, setAudienceSuggestions] = useState<string[]>([]);
  const [isSuggestingAudience, setIsSuggestingAudience] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);

  // --- STEP 1: STRATEGY ---
  const handleGenerateIdeas = async () => {
    if (!data.topic || !data.targetAudience || apiKeys.length === 0) {
      if (apiKeys.length === 0) alert("Please add an API Key.");
      return;
    }
    setIsLoading(true);
    try {
      const results = await generateBlogStrategy(data.topic, data.targetAudience, data.tone, data.language, apiKeys);
      setIdeas(results);
      setSelectedIdeaIdx(null);
    } catch (e) {
      alert("Failed to generate blog ideas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestAudience = async () => {
    if (!data.topic || apiKeys.length === 0) return;
    setIsSuggestingAudience(true);
    try {
        const suggestions = await generateAudienceSuggestions(data.topic, data.language, apiKeys);
        setAudienceSuggestions(suggestions);
    } catch(e) {
        console.error(e);
    } finally {
        setIsSuggestingAudience(false);
    }
  };

  const handleSelectIdea = () => {
    if (selectedIdeaIdx === null) return;
    const idea = ideas[selectedIdeaIdx];
    
    setData(prev => ({ 
      ...prev, 
      selectedTitle: idea.title,
      seoKeywords: idea.targetKeywords 
    }));
    
    // Navigate to Research Step
    setStep(BlogStep.RESEARCH);
  };

  // --- STEP 2: RESEARCH ---
  const handleResearchUpdate = (index: number, content: string) => {
    const newContent = [...data.competitorContent];
    newContent[index] = content;
    setData(prev => ({ ...prev, competitorContent: newContent }));
  };

  const handleGenerateOutline = async () => {
    setIsLoading(true);
    try {
      const outline = await generateBlogOutline(
        data.selectedTitle, 
        data.seoKeywords, 
        data.competitorContent, 
        data.language, 
        apiKeys
      );
      setData(prev => ({ ...prev, outline }));
      setStep(BlogStep.OUTLINE);
    } catch (e) {
      console.error(e);
      alert("Failed to generate outline. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 3: OUTLINE EDIT ---
  const handleGenerateContent = async () => {
    setStep(BlogStep.RESULT);
    setIsLoading(true);
    try {
      const content = await generateBlogContent(data.selectedTitle, data.outline, data.language, apiKeys);
      setData(prev => ({ ...prev, fullContent: content }));
      setSavedToHistory(false); // Reset save state
    } catch (e) {
      alert("Failed to write article.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- REGENERATE INTRO LOGIC ---
  const handleRegenerateIntro = async () => {
    if (!data.fullContent) return;
    setIsLoading(true);
    
    try {
      // Find the start of the body (first H2)
      // We assume the generated content uses "## " for main sections
      const match = data.fullContent.match(/^##\s/m);
      
      if (!match) {
        alert("Could not identify structure (missing H2s). Cannot regenerate intro separately.");
        setIsLoading(false);
        return;
      }

      const bodyIndex = match.index;
      const bodyContent = data.fullContent.substring(bodyIndex!);
      
      // Try to find existing title to preserve it if it's at the top
      const titleMatch = data.fullContent.match(/^#\s.*$/m);
      const existingTitle = titleMatch ? titleMatch[0] : `# ${data.selectedTitle}`;
      
      const newIntro = await generateBlogIntro(
        data.selectedTitle, 
        bodyContent, 
        data.tone, 
        data.language, 
        apiKeys
      );
      
      const newFullContent = `${existingTitle}\n\n${newIntro.trim()}\n\n${bodyContent}`;
      setData(prev => ({ ...prev, fullContent: newFullContent }));
      setSavedToHistory(false); // content changed
      
    } catch(e) {
      alert("Failed to regenerate intro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToHistory = () => {
    if (savedToHistory) return;
    
    const newBlog: SavedBlog = {
      id: crypto.randomUUID(),
      title: data.selectedTitle,
      topic: data.topic,
      audience: data.targetAudience,
      content: data.fullContent,
      date: new Date().toISOString()
    };

    const existingHistory = JSON.parse(localStorage.getItem('blog_history') || '[]');
    localStorage.setItem('blog_history', JSON.stringify([newBlog, ...existingHistory]));
    setSavedToHistory(true);
  };

  // --- EXPORTS ---
  const handleExportDoc = () => {
    // Basic Markdown to HTML conversion for Word compatibility
    // this is a lightweight way to generate a "doc" file without heavy libraries
    let htmlBody = data.fullContent
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold/Italic
      .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
      .replace(/\*(.*?)\*/gim, '<i>$1</i>')
      // Lists (visual approximation for Word)
      .replace(/^\s*-\s+(.*$)/gim, '<p style="margin-left: 20px; text-indent: -20px;">• $1</p>')
      // Paragraphs & Line breaks
      .replace(/\n\n/gim, '<br><br>')
      .replace(/\n/gim, '<br>');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${data.selectedTitle}</title>
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

    // Using application/msword and .doc extension ensures Word opens it correctly as HTML-based doc
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.selectedTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50) || 'blog_post'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportOutlineDoc = () => {
    let htmlBody = `<h1>Outline: ${data.selectedTitle}</h1>`;
    
    data.outline.forEach(section => {
      htmlBody += `<h2>${section.heading}</h2>`;
      if (section.keyPoints && section.keyPoints.length > 0) {
        htmlBody += `<ul>`;
        section.keyPoints.forEach(point => {
          htmlBody += `<li>${point}</li>`;
        });
        htmlBody += `</ul>`;
      }
    });

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${data.selectedTitle} - Outline</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          h1 { font-size: 24px; color: #333; }
          h2 { font-size: 20px; color: #444; margin-top: 20px; }
          ul { margin-top: 10px; }
          li { margin-bottom: 5px; }
        </style>
      </head>
      <body>${htmlBody}</body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.selectedTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50) || 'outline'}_outline.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportTxt = () => {
    const blob = new Blob([data.fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.selectedTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50) || 'blog_post'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-[600px]">
      
      {/* Header / Progress */}
      <div className="mb-8 border-b border-white/10 pb-4">
         <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <PenTool className="text-green-500" /> Blog Generator
         </h2>
         <div className="flex items-center gap-4 text-sm text-gray-400 mt-2 overflow-x-auto whitespace-nowrap">
            <span className={step >= BlogStep.STRATEGY ? "text-green-400 font-bold" : ""}>1. Strategy</span>
            <span>→</span>
            <span className={step >= BlogStep.RESEARCH ? "text-green-400 font-bold" : ""}>2. Research</span>
            <span>→</span>
            <span className={step >= BlogStep.OUTLINE ? "text-green-400 font-bold" : ""}>3. Outline</span>
            <span>→</span>
            <span className={step >= BlogStep.RESULT ? "text-green-400 font-bold" : ""}>4. Article</span>
         </div>
      </div>

      {/* STEP 1: STRATEGY INPUTS */}
      {step === BlogStep.STRATEGY && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target Keyword / Topic</label>
                    <input 
                        type="text" 
                        value={data.topic}
                        onChange={(e) => setData({...data, topic: e.target.value})}
                        placeholder="e.g., Best Gaming Laptops 2025"
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-300">Target Audience</label>
                        <button 
                            onClick={handleSuggestAudience}
                            disabled={!data.topic || isSuggestingAudience || apiKeys.length === 0}
                            className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSuggestingAudience ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                            {isSuggestingAudience ? 'Thinking...' : 'Auto-Suggest'}
                        </button>
                    </div>
                    <input 
                        type="text" 
                        value={data.targetAudience}
                        onChange={(e) => setData({...data, targetAudience: e.target.value})}
                        placeholder="e.g., Software Engineers, Remote Workers"
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                    />
                    {audienceSuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                            {audienceSuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setData({...data, targetAudience: suggestion})}
                                    className="px-3 py-1 text-xs rounded-full bg-green-900/20 border border-green-500/30 text-green-300 hover:bg-green-900/40 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tone of Voice</label>
                    <select
                        value={data.tone}
                        onChange={(e) => setData({...data, tone: e.target.value})}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none appearance-none"
                    >
                        {TONES.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
                    <select
                        value={data.language}
                        onChange={(e) => setData({...data, language: e.target.value})}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none appearance-none"
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-gray-900">{l.label}</option>)}
                    </select>
                </div>
            </div>
            <button 
                onClick={handleGenerateIdeas}
                disabled={isLoading || !data.topic || !data.targetAudience || apiKeys.length === 0}
                className="mt-6 w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <FileText />}
                Generate SEO Strategies
            </button>
            {apiKeys.length === 0 && <p className="text-red-400 text-sm mt-2 text-center">Add API Key to start.</p>}
          </div>

          {ideas.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
                {ideas.map((idea, idx) => (
                    <div 
                        key={idx}
                        onClick={() => setSelectedIdeaIdx(idx)}
                        className={`cursor-pointer p-5 rounded-xl border transition-all relative ${
                            selectedIdeaIdx === idx 
                            ? 'bg-green-900/20 border-green-500 ring-1 ring-green-500' 
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                    >
                        {selectedIdeaIdx === idx && <div className="absolute top-2 right-2 text-green-500"><CheckCircle2 size={20} /></div>}
                        <h3 className="font-bold text-white mb-2">{idea.title}</h3>
                        <p className="text-xs text-gray-400 mb-3">{idea.seoHook}</p>
                        <div className="flex flex-wrap gap-1">
                            {idea.targetKeywords.map((k, i) => (
                                <span key={i} className="text-[10px] bg-black/50 px-2 py-1 rounded text-gray-300">{k}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}

          {selectedIdeaIdx !== null && (
             <div className="flex justify-end">
                <button onClick={handleSelectIdea} className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors">
                    Next: Add Research
                </button>
             </div>
          )}
        </div>
      )}

      {/* STEP 2: RESEARCH --- */}
      {step === BlogStep.RESEARCH && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
               <div className="mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Search className="text-green-500" /> Competitor Analysis
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Paste content or outlines from top ranking articles on Google. 
                    The AI will use this to create a "Superset Outline" that covers all these points + unique gaps.
                  </p>
               </div>

               <div className="grid gap-6">
                  {data.competitorContent.map((content, idx) => (
                    <div key={idx} className="bg-black/20 p-4 rounded-lg border border-white/5 hover:border-white/10 transition-colors group">
                       <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-green-400 uppercase flex items-center gap-2">
                            <Search size={12} /> Competitor #{idx + 1}
                          </label>
                          {content && (
                            <button onClick={() => handleResearchUpdate(idx, '')} className="text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                               <Trash2 size={10} /> Clear
                            </button>
                          )}
                       </div>
                       <textarea 
                          value={content}
                          onChange={(e) => handleResearchUpdate(idx, e.target.value)}
                          placeholder={`Paste the full content or headers from Google Result #${idx + 1} here...\n\nExample Structure:\n- Intro\n- Key Heading 1\n- Key Heading 2\n- Conclusion`}
                          className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-gray-300 focus:ring-1 focus:ring-green-500 outline-none resize-none placeholder:text-gray-600"
                       />
                    </div>
                  ))}
               </div>
               
               <div className="flex justify-end mt-8 gap-4 sticky bottom-4 bg-black/80 backdrop-blur p-4 border border-white/10 rounded-xl">
                  <button onClick={() => setStep(BlogStep.STRATEGY)} className="text-gray-400 hover:text-white px-4 py-2">
                    Back
                  </button>
                  <button 
                    onClick={handleGenerateOutline}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-green-900/50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <ChevronRight />}
                    Generate Superset Outline
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* STEP 3: OUTLINE EDIT */}
      {step === BlogStep.OUTLINE && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Review Superset Outline</h3>
                <div className="flex items-center gap-3">
                   <button 
                      onClick={handleExportOutlineDoc} 
                      className="flex items-center gap-2 bg-green-900/30 hover:bg-green-900/50 text-green-300 px-3 py-2 rounded-lg text-xs font-medium border border-green-500/30 transition-colors"
                   >
                      <Download size={14} /> Export Outline (DOCX)
                   </button>
                   <button onClick={() => setStep(BlogStep.RESEARCH)} className="text-sm text-gray-400 hover:text-white">Back to Research</button>
                </div>
            </div>
            <div className="space-y-4">
                {data.outline.map((section, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-lg">
                        <input 
                            value={section.heading}
                            onChange={(e) => {
                                const newOutline = [...data.outline];
                                newOutline[idx].heading = e.target.value;
                                setData({...data, outline: newOutline});
                            }}
                            className="bg-transparent w-full text-lg font-bold text-white mb-2 focus:outline-none border-b border-transparent focus:border-white/20"
                        />
                        <div className="space-y-1 pl-4 border-l-2 border-green-500/30">
                            {section.keyPoints.map((point, pIdx) => (
                                <p key={pIdx} className="text-sm text-gray-400">• {point}</p>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end pt-4">
                <button 
                    onClick={handleGenerateContent}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2"
                >
                    Write Full Article (Affiliate Lab Style) <ArrowRight size={18} />
                </button>
            </div>
         </div>
      )}

      {/* STEP 4: RESULT */}
      {step === BlogStep.RESULT && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h3 className="text-xl font-bold text-white">Final Article</h3>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setStep(BlogStep.OUTLINE)} className="text-sm text-gray-400 hover:text-white px-3">Back</button>
                    
                    <button onClick={handleRegenerateIntro} disabled={isLoading} className="flex items-center gap-1 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 px-3 py-2 rounded-lg text-sm font-medium border border-indigo-500/30 transition-colors">
                       {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Intro
                    </button>
                    
                    <button onClick={handleSaveToHistory} disabled={isLoading || savedToHistory} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${savedToHistory ? 'bg-orange-900/50 text-orange-300 border-orange-500/30 cursor-default' : 'bg-orange-900/30 hover:bg-orange-900/50 text-orange-300 border-orange-500/30'}`}>
                        {savedToHistory ? <CheckCircle2 size={14} /> : <Save size={14} />} {savedToHistory ? 'Saved' : 'Save'}
                    </button>

                    <button onClick={handleExportTxt} disabled={isLoading} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium border border-white/10 transition-colors">
                        <FileText size={16} /> TXT
                    </button>
                    <button onClick={handleExportDoc} disabled={isLoading} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-green-900/20">
                        <Download size={16} /> DOCX
                    </button>
                </div>
            </div>
            
            <ScriptResult 
                title={data.selectedTitle}
                content={data.fullContent}
                isLoading={isLoading}
            />
        </div>
      )}
    </div>
  );
};