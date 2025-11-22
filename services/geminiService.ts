import { GoogleGenAI, Type } from "@google/genai";
import { PackagingIdea, OutlinePoint } from "../types";

const BASE_SYSTEM_INSTRUCTION = `
You are an expert YouTube script writer trained on the Kallaway 5-step framework.
Your job is to help creators write killer scripts that keep viewers hooked using proven psychology principles and a structured methodology.

CORE PRINCIPLE: Expectations vs. Reality
When reality beats expectations (things go better than expected), viewers stay engaged.
When expectations beat reality (things disappoint), viewers leave. Use this psychology to guide every scripting decision.

FRAMEWORK: 5-Step Process
1. PACKAGING (Title, Idea, Thumbnail concept)
2. OUTLINE (Unique, novel points with What-Why-How)
3. INTRO (5-part hook framework that confirms + exceeds expectations)
4. BODY (Second-best first, Context-Application-Framing for each point)
5. OUTRO (High note, summary, reinforcement)

Your responses should:
- Always prioritize UNIQUENESS and NOVELTY over generic advice
- Use the What-Why-How framework for every point
- Emphasize the "second-best first" ordering principle
- Include re-hooking transitions between points
- Ensure every element beats viewer expectations
- Provide examples when applicable
- Keep language clear and actionable

When the user provides their video concept, help them through each phase systematically.
`;

const getSystemInstruction = (language: string) => {
  return `${BASE_SYSTEM_INSTRUCTION}
  
  IMPORTANT:
  You MUST write all content in the following language: ${language}.
  `;
};

const getAiClient = (apiKeyOrKeys?: string | string[]) => {
  const key = Array.isArray(apiKeyOrKeys) && apiKeyOrKeys.length > 0
    ? apiKeyOrKeys[Math.floor(Math.random() * apiKeyOrKeys.length)]
    : (typeof apiKeyOrKeys === 'string' ? apiKeyOrKeys : process.env.API_KEY);
    
  if (!key) {
    throw new Error("API Key is required");
  }
  
  return new GoogleGenAI({ apiKey: key });
};

export const generatePackaging = async (topic: string, audience: string, language: string, cta?: string, apiKey?: string | string[]): Promise<PackagingIdea[]> => {
  try {
    const ai = getAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `I'm creating a YouTube video about ${topic}.
      Target Audience: ${audience}.
      ${cta ? `Goal: Promote ${cta}` : ''}

      Help me develop 3 distinct packaging concepts. For each concept, define:
      1. VIDEO IDEA (one-line description of the pain point I'm solving)
      2. TITLE (that triggers curiosity and creates a must-click feeling)
      3. EXPECTED VIEWER EXPECTATIONS (what will viewers expect when they click?)
      4. THUMBNAIL (loose concept with key visual elements)
      
      For the title, ensure it triggers a curiosity loop.
      Ensure the output content (Title, Video Idea, etc) is in ${language}.
      `,
      config: {
        systemInstruction: getSystemInstruction(language),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Curiosity-driven title" },
              thumbnail: { type: Type.STRING, description: "Visual concept elements" },
              videoIdea: { type: Type.STRING, description: "Pain point being solved" },
              expectations: { type: Type.STRING, description: "What viewers expect from this title" },
              psychology: { type: Type.STRING, description: "Why this specific angle triggers curiosity" }
            },
            required: ["title", "thumbnail", "videoIdea", "expectations", "psychology"]
          }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Packaging gen error", error);
    throw error;
  }
};

export const generateOutline = async (topic: string, title: string, painPoint: string, expectations: string, language: string, apiKey?: string | string[]): Promise<OutlinePoint[]> => {
  try {
    const ai = getAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `I have the following video concept:
      - Topic: ${topic}
      - Pain Point: ${painPoint}
      - Title: ${title}
      - Expected Viewer Expectations: ${expectations}

      Now help me create a UNIQUE OUTLINE by:
      1. BRAINSTORMING: List 7-10 potential points/tips for the body of my video
      2. GUT-CHECK: For each point, tell me if it's unique/novel or generic
      3. ELIMINATE: Remove any generic or commonly repeated points
      4. RESEARCH: Suggest unique angles I haven't considered
      5. FRAMEWORK: For the final 4-6 points, apply What-Why-How structure:
         - What is this point/concept?
         - Why does it matter to my audience?
         - How does it fit into the overall story?

      CRITICAL: If the outline feels generic, suggest more research angles instead of proceeding with mediocre points.
      Ensure all points are written in ${language}.
      
      Return the final 4-6 points in the specified JSON format.
      `,
      config: {
        systemInstruction: getSystemInstruction(language),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              headline: { type: Type.STRING, description: "The unique angle/point name" },
              what: { type: Type.STRING, description: "What is this point/concept?" },
              why: { type: Type.STRING, description: "Why does it matter? (Psychology)" },
              how: { type: Type.STRING, description: "How does it fit/Actionable step" }
            },
            required: ["id", "headline", "what", "why", "how"]
          }
        }
      }
    });

    const raw = JSON.parse(response.text || "[]");
    return raw.map((item: any, index: number) => ({ ...item, id: item.id || `point-${index}` }));
  } catch (error) {
    console.error("Outline gen error", error);
    throw error;
  }
};

export const generateIntro = async (topic: string, title: string, expectations: string, outline: OutlinePoint[], language: string, apiKey?: string | string[]): Promise<string> => {
  try {
    const ai = getAiClient(apiKey);
    const outlineSummary = outline.map(p => `- ${p.headline}: ${p.what}`).join("\n");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Using the 5-Part Intro Hook Framework, write my video intro:

      CONTEXT:
      - Video Topic: ${topic}
      - Title: ${title}
      - Viewer Expectations from title: ${expectations}
      - Outline Points: 
      ${outlineSummary}

      Write the intro with these 5 parts:

      1. IMMEDIATE CONTEXT (first 3 lines)
      - Bluntly state what the video is about
      - Confirm the click they made was right

      2. ESTABLISH COMMON BELIEF
      - State the conventional wisdom they already believe
      - Build emotional connection

      3. CREATE CONTRARIAN TAKE
      - Offer a perspective that contradicts the common belief
      - Use language like: "But the good news is..." or "Here's what actually works..."

      4. ESTABLISH PROOF/CREDIBILITY
      - Share relevant credentials or results
      - Prove why they should trust this approach

      5. GIVE THEM A PLAN
      - State the steps/framework you'll cover
      - Create anticipation

      The intro should be punchy, concise, and create an irresistible curiosity loop.
      Write the intro in ${language}.
      `,
      config: {
        systemInstruction: getSystemInstruction(language),
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Intro gen error", error);
    throw error;
  }
};

export const generateBody = async (title: string, intro: string, outline: OutlinePoint[], language: string, cta?: string, apiKey?: string | string[]): Promise<string> => {
  try {
    const ai = getAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Help me write the BODY of my script using the following:

      VIDEO CONTEXT:
      - Title: ${title}
      - Intro: ${intro}
      - Outline Points: ${JSON.stringify(outline)}
      ${cta ? `- CTA Requirement: Integrate a native mention of "${cta}" where it fits naturally as a solution.` : ''}

      ORDERING STRATEGY:
      Rank my points by shock value, novelty, and uniqueness:
      - Best Point (overall strongest)
      - Second-Best Point (strong, but not the strongest)
      - Third-Best Point
      - Etc.

      Then write the body with this ordering:
      1. SECOND-BEST POINT FIRST (creates upward value pattern)
      2. BEST POINT SECOND (peaks the viewer's interest)
      3. Continue with remaining points

      FOR EACH POINT, INCLUDE:
      **Context** (Say what it is)
      - Explain clearly and simply
      - Keep digestible
      - Provide foundational understanding

      **Application** (Say how to do it)
      - Explain how to apply the concept
      - Use multiple relevant examples
      - Make it actionable

      **Framing** (Say why it matters)
      - Explain the importance
      - Connect to overall story
      - Show why they should keep watching

      TRANSITIONS & RE-HOOKING:
      Between each point, add re-hooking language that compels continued watching.
      Example: "But here's the thing—if you don't also [NEXT POINT], then..."

      PACING:
      Use a "zoom in/zoom out" wave pattern - balance big picture with tactics.
      
      ${cta ? `NATIVE CTA INSTRUCTION: Frame the pain point, offer ${cta} as solution, explain why it helps, then move on naturally.` : ''}

      Write the body in ${language}.
      `,
      config: {
        systemInstruction: getSystemInstruction(language),
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Body gen error", error);
    throw error;
  }
};

export const generateOutro = async (title: string, painPoint: string, outline: OutlinePoint[], language: string, apiKey?: string | string[]): Promise<string> => {
  try {
    const ai = getAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Help me write a HIGH-NOTE OUTRO that maximizes engagement:

      CONTEXT:
      - Video Title: ${title}
      - Main Pain Point: ${painPoint}
      - Key Points Covered: ${outline.map(p => p.headline).join(", ")}

      Write an outro that:

      1. SUMMARIZES KEY POINTS
      - Recap the main insights briefly
      - Remind them of the pain point you solved

      2. CREATES THE HIGH NOTE
      - End on a strong, memorable statement
      - Reinforce that their expectations were exceeded
      - Make them feel: "Wow, that was amazing!"

      3. DRIVES ENGAGEMENT
      - Include language that encourages likes, comments, shares
      - Create curiosity about your next video
      - Leave them wanting more

      Keep it clean, conclusive, and emotionally resonant.
      Write the outro in ${language}.
      `,
      config: {
        systemInstruction: getSystemInstruction(language),
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Outro gen error", error);
    throw error;
  }
};