import React, { useState } from 'react';
import { AppStep, ScriptData, OutlinePoint } from '../types';
import { StepPackaging } from './StepPackaging';
import { StepOutline } from './StepOutline';
import { ScriptResult } from './ScriptResult';
import { generateIntro, generateBody, generateOutro } from '../services/geminiService';
import { Check, PlayCircle, Layout, Type, Mic, Download } from 'lucide-react';

interface Props {
  apiKeys: string[];
}

export const Wizard: React.FC<Props> = ({ apiKeys }) => {
  const [step, setStep] = useState<AppStep>(AppStep.PACKAGING);
  const [data, setData] = useState<ScriptData>({
    topic: '',
    targetAudience: '',
    language: 'English',
    cta: '',
    selectedTitle: '',
    selectedThumbnail: '',
    selectedVideoIdea: '',
    selectedExpectations: '',
    outline: [],
    introScript: '',
    bodyScript: '',
    outroScript: ''
  });
  const [loadingScript, setLoadingScript] = useState({
    intro: false,
    body: false,
    outro: false
  });

  const handlePackagingComplete = (title: string, thumb: string, topic: string, audience: string, cta: string, idea: string, expectations: string, language: string) => {
    setData(prev => ({ 
      ...prev, 
      selectedTitle: title, 
      selectedThumbnail: thumb, 
      topic, 
      targetAudience: audience,
      cta,
      language,
      selectedVideoIdea: idea,
      selectedExpectations: expectations
    }));
    setStep(AppStep.OUTLINE);
  };

  const handleOutlineComplete = async (outline: OutlinePoint[]) => {
    setData(prev => ({ ...prev, outline }));
    setStep(AppStep.INTRO);
    
    // Sequential generation to maintain context flow
    await generateFullScript(outline);
  };

  const generateFullScript = async (outline: OutlinePoint[]) => {
    const { topic, selectedTitle, selectedExpectations, language, selectedVideoIdea, cta } = data;
    
    if (apiKeys.length === 0) {
      alert("No API Keys available for script generation.");
      return;
    }

    // 1. Generate Intro (Phase 3)
    setLoadingScript(prev => ({ ...prev, intro: true }));
    let intro = "";
    try {
      intro = await generateIntro(topic, selectedTitle, selectedExpectations, outline, language, apiKeys);
      setData(prev => ({ ...prev, introScript: intro }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingScript(prev => ({ ...prev, intro: false }));
    }

    // 2. Generate Body (Phase 4) - Requires Intro context
    setLoadingScript(prev => ({ ...prev, body: true }));
    try {
      const body = await generateBody(selectedTitle, intro, outline, language, cta, apiKeys);
      setData(prev => ({ ...prev, bodyScript: body }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingScript(prev => ({ ...prev, body: false }));
    }

    // 3. Generate Outro (Phase 5)
    setLoadingScript(prev => ({ ...prev, outro: true }));
    try {
      const outro = await generateOutro(selectedTitle, selectedVideoIdea, outline, language, apiKeys);
      setData(prev => ({ ...prev, outroScript: outro }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingScript(prev => ({ ...prev, outro: false }));
    }
  };

  const handleExport = () => {
    const fullScript = `TITLE: ${data.selectedTitle}
TOPIC: ${data.topic}
TARGET AUDIENCE: ${data.targetAudience}
${data.cta ? `CTA: ${data.cta}` : ''}

=== PART 1: INTRO ===
${data.introScript}

=== PART 2: BODY ===
${data.bodyScript}

=== PART 3: OUTRO ===
${data.outroScript}
`;

    const blob = new Blob([fullScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.selectedTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50) || 'script'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const steps = [
    { id: AppStep.PACKAGING, label: 'Packaging', icon: Layout },
    { id: AppStep.OUTLINE, label: 'Outline', icon: Type },
    { id: AppStep.INTRO, label: 'Scripting', icon: Mic },
  ];

  const isGenerating = loadingScript.intro || loadingScript.body || loadingScript.outro;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Progress Header */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center gap-4">
          {steps.map((s, idx) => {
            const isActive = step === s.id || (s.id === AppStep.INTRO && step > AppStep.INTRO);
            const isCompleted = step > s.id;
            const Icon = s.icon;

            return (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isActive ? 'border-indigo-500 bg-indigo-900/20 text-indigo-400' : 
                    isCompleted ? 'border-green-500 bg-green-900/20 text-green-400' : 'border-gray-700 bg-gray-800'
                  }`}>
                    {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <span className="font-medium hidden sm:block">{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-12 h-0.5 bg-gray-800">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{ width: isCompleted ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        {step === AppStep.PACKAGING && (
          <StepPackaging 
            onComplete={handlePackagingComplete} 
            initialTopic={data.topic}
            initialAudience={data.targetAudience}
            apiKeys={apiKeys}
          />
        )}
        
        {step === AppStep.OUTLINE && (
          <StepOutline 
            topic={data.topic}
            title={data.selectedTitle}
            painPoint={data.selectedVideoIdea}
            expectations={data.selectedExpectations}
            language={data.language}
            onComplete={handleOutlineComplete}
            apiKeys={apiKeys}
          />
        )}

        {step >= AppStep.INTRO && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
               <div className="flex items-center gap-4">
                 <h2 className="text-2xl font-bold text-white">The Script</h2>
                 <div className="bg-indigo-600 px-3 py-1 rounded text-xs font-bold text-white hidden sm:block">
                   {data.selectedTitle}
                 </div>
               </div>
               
               <button 
                 onClick={handleExport}
                 disabled={isGenerating}
                 className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10"
               >
                 <Download size={16} /> Export as Text
               </button>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              <ScriptResult 
                title="Phase 3: The Hook" 
                content={data.introScript} 
                isLoading={loadingScript.intro} 
              />
              <ScriptResult 
                title="Phase 4: The Body" 
                content={data.bodyScript} 
                isLoading={loadingScript.body} 
              />
              <ScriptResult 
                title="Phase 5: The Outro" 
                content={data.outroScript} 
                isLoading={loadingScript.outro} 
              />
            </div>

             <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-black border border-white/10 rounded-xl">
               <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                 <PlayCircle className="text-red-500" /> Final Script Review (Phase 7)
               </h3>
               <div className="grid md:grid-cols-2 gap-4 text-gray-400 text-sm">
                 <ul className="space-y-2">
                   <li className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                     Does the Intro confirm the title's promise immediately?
                   </li>
                   <li className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                     Is the second best point first in the body?
                   </li>
                 </ul>
                 <ul className="space-y-2">
                   <li className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                     Are there visual pattern interrupts every 30-60 seconds?
                   </li>
                   {data.cta && (
                     <li className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                       Is the CTA integrated naturally as a solution?
                     </li>
                   )}
                 </ul>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};