import React, { useState } from 'react';
import { PackagingIdea } from '../types';
import { generatePackaging } from '../services/geminiService';
import { Lightbulb, Loader2, CheckCircle2, MousePointerClick, Target, Eye, Globe2 } from 'lucide-react';

interface Props {
  onComplete: (title: string, thumbnail: string, topic: string, audience: string, cta: string, idea: string, expectations: string, language: string) => void;
  initialTopic: string;
  initialAudience: string;
  apiKeys: string[];
}

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Spanish (Español)' },
  { code: 'Portuguese', label: 'Portuguese (Português)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'Italian', label: 'Italian (Italiano)' },
  { code: 'Hindi', label: 'Hindi (हिन्दी)' },
  { code: 'Bengali', label: 'Bengali (বাংলা)' },
  { code: 'Japanese', label: 'Japanese (日本語)' },
  { code: 'Korean', label: 'Korean (한국어)' },
  { code: 'Indonesian', label: 'Indonesian (Bahasa Indonesia)' },
  { code: 'Turkish', label: 'Turkish (Türkçe)' },
  { code: 'Russian', label: 'Russian (Русский)' },
  { code: 'Arabic', label: 'Arabic (العربية)' },
  { code: 'Chinese', label: 'Chinese (中文)' },
];

const AUDIENCE_LEVELS = ['Beginner', 'Intermediate', 'Expert'];

export const StepPackaging: React.FC<Props> = ({ onComplete, initialTopic, initialAudience, apiKeys }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [audience, setAudience] = useState(initialAudience);
  const [cta, setCta] = useState('');
  const [language, setLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [ideas, setIdeas] = useState<PackagingIdea[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!topic || !audience) return;
    if (apiKeys.length === 0) {
      alert("Please add at least one API Key to proceed.");
      return;
    }
    setIsLoading(true);
    try {
      const results = await generatePackaging(topic, audience, language, cta, apiKeys);
      setIdeas(results);
      setSelectedIdx(null);
    } catch (e) {
      alert("Failed to generate ideas. Please ensure your API keys are valid.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedIdx !== null) {
      const selected = ideas[selectedIdx];
      onComplete(
        selected.title, 
        selected.thumbnail, 
        topic, 
        audience, 
        cta, 
        selected.videoIdea, 
        selected.expectations,
        language
      );
    }
  };

  const toggleAudienceLevel = (level: string) => {
    const current = audience.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (current.includes(level)) {
      setAudience(current.filter(s => s !== level).join(', '));
    } else {
      setAudience([...current, level].join(', '));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Lightbulb className="text-yellow-400" /> Phase 1: Packaging
        </h2>
        <p className="text-gray-400 mb-6">
          Most creators fail here. We need a title and thumbnail that sets an expectation 
          we can strategically exceed.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Video Topic</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., How to learn coding fast"
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience</label>
            <input 
              type="text" 
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g., Complete beginners"
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {AUDIENCE_LEVELS.map((level) => {
                const isActive = audience.split(',').map(s => s.trim()).includes(level);
                return (
                  <button
                    key={level}
                    onClick={() => toggleAudienceLevel(level)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      isActive 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Call to Action / Product (Optional)</label>
            <input 
              type="text" 
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="e.g., My Coding Bootcamp, Newsletter Link"
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Will be natively integrated into the script (Phase 6)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
              <Globe2 size={14} /> Output Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-gray-900 text-white">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isLoading || !topic || !audience || apiKeys.length === 0}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <MousePointerClick />}
          {isLoading ? "Brainstorming Viral Concepts..." : "Generate Concepts"}
        </button>
        {apiKeys.length === 0 && (
          <p className="text-center text-red-400 text-sm mt-2">Please add an API Key in the top right to start.</p>
        )}
      </div>

      {ideas.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {ideas.map((idea, idx) => (
            <div 
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`cursor-pointer relative group p-5 rounded-xl border transition-all duration-200 flex flex-col gap-3 ${
                selectedIdx === idx 
                  ? 'bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500' 
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              {selectedIdx === idx && (
                <div className="absolute -top-3 -right-3 bg-indigo-500 text-white p-1 rounded-full">
                  <CheckCircle2 size={20} />
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-bold text-white leading-tight mb-1">
                  {idea.title}
                </h3>
                <p className="text-xs text-gray-500 italic">{idea.psychology}</p>
              </div>

              <div className="bg-black/50 p-3 rounded">
                <span className="text-xs uppercase text-blue-400 font-bold tracking-wider flex items-center gap-1">
                  <Target size={12} /> Pain Point (Video Idea)
                </span>
                <p className="text-sm text-gray-300 mt-1">{idea.videoIdea}</p>
              </div>

              <div className="bg-black/50 p-3 rounded">
                <span className="text-xs uppercase text-purple-400 font-bold tracking-wider flex items-center gap-1">
                  <Eye size={12} /> Viewer Expectations
                </span>
                <p className="text-sm text-gray-300 mt-1">{idea.expectations}</p>
              </div>

              <div className="bg-black/50 p-3 rounded">
                <span className="text-xs uppercase text-orange-400 font-bold tracking-wider">Thumbnail</span>
                <p className="text-sm text-gray-300 mt-1">{idea.thumbnail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedIdx !== null && (
        <div className="flex justify-end">
          <button 
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
          >
            Confirm & Proceed to Outline
          </button>
        </div>
      )}
    </div>
  );
};