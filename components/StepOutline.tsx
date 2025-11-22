import React, { useState, useEffect } from 'react';
import { OutlinePoint } from '../types';
import { generateOutline } from '../services/geminiService';
import { List, Loader2, ArrowRight, GripVertical, RefreshCw } from 'lucide-react';

interface Props {
  topic: string;
  title: string;
  painPoint: string;
  expectations: string;
  language: string;
  onComplete: (outline: OutlinePoint[]) => void;
  apiKeys: string[];
}

export const StepOutline: React.FC<Props> = ({ topic, title, painPoint, expectations, language, onComplete, apiKeys }) => {
  const [points, setPoints] = useState<OutlinePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchOutline = async () => {
    if (apiKeys.length === 0) {
      alert("No API Keys available.");
      return;
    }
    setIsLoading(true);
    try {
      const results = await generateOutline(topic, title, painPoint, expectations, language, apiKeys);
      setPoints(results);
      setHasFetched(true);
    } catch (e) {
      alert("Failed to generate outline. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on mount if empty
  useEffect(() => {
    if (!hasFetched && points.length === 0 && apiKeys.length > 0) {
      fetchOutline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeys.length]); // Added dependency on apiKeys length to trigger if keys added later

  const movePoint = (idx: number, direction: 'up' | 'down') => {
    const newPoints = [...points];
    if (direction === 'up' && idx > 0) {
      [newPoints[idx], newPoints[idx - 1]] = [newPoints[idx - 1], newPoints[idx]];
    } else if (direction === 'down' && idx < newPoints.length - 1) {
      [newPoints[idx], newPoints[idx + 1]] = [newPoints[idx + 1], newPoints[idx]];
    }
    setPoints(newPoints);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <List className="text-blue-400" /> Phase 2: The Outline
          </h2>
          <p className="text-gray-400 text-sm mt-1 max-w-2xl">
            We are applying the Brainstorming &#8594; Gut-Check &#8594; Eliminate process to ensure uniqueness.
          </p>
        </div>
        <button 
          onClick={fetchOutline}
          disabled={isLoading || apiKeys.length === 0}
          className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw size={14} /> Regenerate
        </button>
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
          <p>Brainstorming novel points...</p>
          <p className="text-xs mt-2">Gut-checking for generic advice...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {points.map((point, idx) => (
            <div key={point.id} className="bg-white/5 border border-white/10 p-5 rounded-xl flex gap-4 group">
              <div className="flex flex-col gap-2 pt-1 text-gray-600">
                <button onClick={() => movePoint(idx, 'up')} className="hover:text-white"><GripVertical size={16} /></button>
              </div>
              <div className="flex-1 space-y-3">
                <input 
                  className="bg-transparent text-lg font-bold text-white w-full focus:outline-none border-b border-transparent focus:border-white/20"
                  value={point.headline}
                  onChange={(e) => {
                    const newPoints = [...points];
                    newPoints[idx].headline = e.target.value;
                    setPoints(newPoints);
                  }}
                />
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-black/30 p-3 rounded">
                    <span className="text-blue-400 font-bold block text-xs uppercase mb-1">What</span>
                    <textarea 
                       className="bg-transparent w-full text-gray-300 focus:outline-none resize-none h-20"
                       value={point.what}
                       onChange={(e) => {
                         const newPoints = [...points];
                         newPoints[idx].what = e.target.value;
                         setPoints(newPoints);
                       }}
                    />
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                    <span className="text-purple-400 font-bold block text-xs uppercase mb-1">Why (Psychology)</span>
                    <textarea 
                       className="bg-transparent w-full text-gray-300 focus:outline-none resize-none h-20"
                       value={point.why}
                       onChange={(e) => {
                         const newPoints = [...points];
                         newPoints[idx].why = e.target.value;
                         setPoints(newPoints);
                       }}
                    />
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                    <span className="text-green-400 font-bold block text-xs uppercase mb-1">How (Action)</span>
                    <textarea 
                       className="bg-transparent w-full text-gray-300 focus:outline-none resize-none h-20"
                       value={point.how}
                       onChange={(e) => {
                         const newPoints = [...points];
                         newPoints[idx].how = e.target.value;
                         setPoints(newPoints);
                       }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {points.length > 0 && (
        <>
          <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-lg flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">i</div>
            <p className="text-sm text-indigo-200">
              <strong>Ordering Strategy:</strong> The scripting phase will automatically place your <span className="underline">second best</span> point first to create an upward value pattern.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={() => onComplete(points)}
              disabled={isLoading}
              className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-colors"
            >
              Generate Full Script <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};