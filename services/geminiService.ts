
import { GoogleGenAI, Type } from "@google/genai";
import { PackagingIdea, OutlinePoint, BlogIdea, BlogOutlineSection } from "../types";

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

const BLOG_SYSTEM_INSTRUCTION = `
You are an elite SEO Content Writer who strictly adheres to "The Affiliate Lab" methodology for writing perfect blog posts.

YOUR GOAL:
Take a user-provided "Target Keyword" and generate a complete, high-ranking blog post that satisfies search intent immediately.

YOU MUST FOLLOW THIS STRICT WRITING PROCESS:

1.  **Analyze Intent:** Determine if the keyword is Informational (How-to/Guide) or Transactional (Best X for Y).
2.  **Superset Outline:** Internally generate an outline that covers all potential sub-topics a competitor might have, plus an FAQ section based on "People Also Asked" style questions.
3.  **Writing Style & Tone:**
    * **Reading Level:** 7th-8th Grade (Simple, clear English).
    * **Paragraphs:** Extremely short (1-2 sentences max). No walls of text.
    * **NLP Optimization:** Define core concepts immediately using the format: "[Keyword] IS [Definition]."
    * **No Fluff:** Do not waste time with generic intros. Start providing value immediately.

4.  **Structure Requirements:**
    * **Title:** Must include the keyword + a click element (Year, Number, or Emotional Hook).
    * **Intro:** Hook the reader with Emotion (Fear of missing out, excitement, or direct value).
    * **Body:** Use H2s for main points. Use Bullet points for lists. Suggest image placements with [Image Placeholder: Description].
    * **Tables:** **MANDATORY:** Use well-formatted Markdown Tables for the following:
        *   **Comparisons (A vs B):** Columns must be [Feature | Option A | Option B].
        *   **Pros & Cons:** Columns must be [Pros | Cons].
        *   **Pricing/Plans:** Columns must be [Plan Name | Price | Key Features].
        *   Ensure tables are strictly aligned and easy to read in raw text.
    *   **Conclusion:** Summarize the post + Add a Call to Action (CTA).
    *   **Meta Data:** At the very end, provide a Meta Title and Meta Description (under 160 chars).

5.  **Output Format:** Return the response in clean Markdown formatting.
`;

const getSystemInstruction = (language: string) => {
  return `${BASE_SYSTEM_INSTRUCTION}
  
  IMPORTANT:
  You MUST write all content in the following language: ${language}.
  `;
};

const getBlogSystemInstruction = (language: string) => {
  return `${BLOG_SYSTEM_INSTRUCTION}
  
  IMPORTANT:
  You MUST write all content in the following language: ${language}.
  `;
}

const getAiClient = (apiKeyOrKeys?: string | string[]) => {
  const key = Array.isArray(apiKeyOrKeys) && apiKeyOrKeys.length > 0
    ? apiKeyOrKeys[Math.floor(Math.random() * apiKeyOrKeys.length)]
    : (typeof apiKeyOrKeys === 'string' ? apiKeyOrKeys : process.env.API_KEY);
    
  if (!key) {
    throw new Error("API Key is required");
  }
  
  return new GoogleGenAI({ apiKey: key });
};

// --- HELPER FUNCTIONS ---

const cleanAndParseJSON = (text: string) => {
  try {
    // Remove markdown code blocks
    let clean = text.replace(/```json\n?|\n?```/g, "");
    
    // Find the first [ or {
    const firstBracket = clean.indexOf('[');
    const firstBrace = clean.indexOf('{');
    const start = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) ? firstBracket : firstBrace;
    
    if (start !== -1) {
      clean = clean.substring(start);
    }
    
    // Find the last ] or }
    const lastBracket = clean.lastIndexOf(']');
    const lastBrace = clean.lastIndexOf('}');
    const end = (lastBracket !== -1 && (lastBrace === -1 || lastBracket > lastBrace)) ? lastBracket : lastBrace;
    
    if (end !== -1) {
      clean = clean.substring(0, end + 1);
    }
    
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse JSON", text);
    return [];
  }
};

const extractSources = (response: any): string => {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) return '';
  
  // Extract unique URLs
  const uniqueSources = new Map<string, string>();
  
  chunks.forEach((c: any) => {
    if (c.web?.uri) {
      const title = c.web.title || new URL(c.web.uri).hostname;
      uniqueSources.set(c.web.uri, title);
    }
  });

  if (uniqueSources.size === 0) return '';
  
  let sourceText = "\n\n### Sources & References\n";
  uniqueSources.forEach((title, uri) => {
    sourceText += `- [${title}](${uri})\n`;
  });
  
  return sourceText;
};

// --- VIDEO SCRIPT FUNCTIONS ---

export const generatePackaging = async (topic: string, audience: string, language: string, cta?: string, apiKey?: string | string[]): Promise<PackagingIdea[]> => {
  try {
    const ai = getAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `I'm creating a YouTube video about ${topic}.
      Target Audience: ${audience}.
      ${cta ? `Goal: Promote ${cta}` : ''}
      Current Context: The year is 2025. Use Google Search to find current trends.

      Help me develop 3 distinct packaging concepts. For each concept, define:
      1. VIDEO IDEA (one-line description of the pain point I'm solving)
      2. TITLE (that triggers curiosity and creates a must-click feeling)
      3. EXPECTED VIEWER EXPECTATIONS (what will viewers expect when they click?)
      4. THUMBNAIL (loose concept with key visual elements)
      
      For the title, ensure it triggers a curiosity loop.
      Ensure the output content (Title, Video Idea, etc) is in ${language}.
      
      RETURN THE OUTPUT AS A RAW JSON ARRAY. Each object must have these exact properties:
      - title (string)
      - thumbnail (string)
      - videoIdea (string)
      - expectations (string)
      - psychology (string)
      `,
      config: {
        systemInstruction: getSystemInstruction(language),
        tools: [{ googleSearch: {} }] // Enabled Grounding
        // responseSchema removed because it conflicts with googleSearch tool
      }
    });
    
    return cleanAndParseJSON(response.text || "[]");
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
      - Current Context: The year is 2025.

      Now help me create a UNIQUE OUTLINE by:
      1. BRAINSTORMING: List 7-10 potential points/tips for the body of my video. Use Google Search to find novel angles.
      2. GUT-CHECK: For each point, tell me if it's unique/novel or generic
      3. ELIMINATE: Remove any generic or commonly repeated points
      4. RESEARCH: Suggest unique angles I haven't considered
      5. FRAMEWORK: For the final 4-6 points, apply What-Why-How structure:
         - What is this point/concept?
         - Why does it matter to my audience?
         - How does it fit into the overall story?

      CRITICAL: If the outline feels generic, suggest more research angles instead of proceeding with mediocre points.
      Ensure all points are written in ${language}.
      
      RETURN THE FINAL 4-6 POINTS AS A RAW JSON ARRAY. Each object must have these exact properties:
      - id (string)
      - headline (string)
      - what (string)
      - why (string)
      - how (string)
      `,
      config: {
        systemInstruction: getSystemInstruction(language),
        tools: [{ googleSearch: {} }] // Enabled Grounding
      }
    });

    const parsed = cleanAndParseJSON(response.text || "[]");
    return parsed.map((item: any, index: number) => ({ ...item, id: item.id || `point-${index}` }));
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
      - Current Year: 2025
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
        tools: [{ googleSearch: {} }] // Enabled for context awareness
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
      - Current Year: 2025
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
      - Use Google Search to find real-world examples or recent stats.

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
        tools: [{ googleSearch: {} }] // Enabled for facts and examples
      }
    });
    
    // Append sources if available
    const sources = extractSources(response);
    return (response.text || "") + sources;
    
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
      - Current Year: 2025
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
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Outro gen error", error);
    throw error;
  }
};


// --- BLOG GENERATOR FUNCTIONS ---

export const generateAudienceSuggestions = async (topic: string, language: string, apiKey?: string | string[]): Promise<string[]> => {
  try {
    const ai = getAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `I am planning a blog post about "${topic}".
      Current Context: The year is 2025.
      
      Suggest 5 distinct, specific target audiences who would be interested in this content.
      Keep them concise (2-4 words max).
      
      Output strictly in ${language}.
      RETURN ONLY A RAW JSON ARRAY of strings. Example: ["Beginners", "Expert Developers", "Small Business Owners"]`,
      config: {
         systemInstruction: getBlogSystemInstruction(language),
      }
    });
    return cleanAndParseJSON(response.text || "[]");
  } catch (error) {
    console.error("Audience suggestion error", error);
    return [];
  }
};

export const generateBlogStrategy = async (topic: string, audience: string, tone: string, language: string, apiKey?: string | string[]): Promise<BlogIdea[]> => {
  try {
    const ai = getAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `I need to write a blog post about "${topic}".
      Target Audience: ${audience}.
      Desired Tone: ${tone}.
      Current Context: The year is 2025.
      
      Use Google Search to analyze current search results and intent for this topic.

      Generate 3 distinct blog post strategies that satisfy search intent.
      Analyze if the topic is Informational or Transactional.

      For each strategy provide:
      1. Catchy Title (SEO optimized + Clickworthy + includes Year (2025)/Number/Hook)
      2. SEO Hook (Why this will rank & match intent)
      3. 3-5 Target Keywords (Primary and LSI keywords)

      Output strictly in ${language}.
      
      RETURN THE OUTPUT AS A RAW JSON ARRAY. Each object must have:
      - title (string)
      - seoHook (string)
      - targetKeywords (string array)
      `,
      config: {
        systemInstruction: getBlogSystemInstruction(language),
        tools: [{ googleSearch: {} }] // Enabled for SEO analysis
      }
    });
    
    return cleanAndParseJSON(response.text || "[]");
  } catch (error) {
    console.error("Blog strategy error", error);
    throw error;
  }
};

export const generateBlogOutline = async (title: string, keywords: string[], competitorContent: string[], language: string, apiKey?: string | string[]): Promise<BlogOutlineSection[]> => {
  try {
    const ai = getAiClient(apiKey);
    const hasResearch = competitorContent.some(c => c.trim().length > 0);
    
    let prompt = `Create a "Superset Outline" for the blog post title: "${title}".
    Target Keywords: ${keywords.join(", ")}.
    Current Context: The year is 2025.
    
    Use Google Search to find "People Also Asked" questions and sub-topics missed by competitors.
    `;

    if (hasResearch) {
      prompt += `\n\nCOMPETITOR RESEARCH (Top ranking content provided by user):
      ${competitorContent.map((c, i) => c.trim() ? `--- Competitor ${i+1} ---\n${c.substring(0, 3000)}...` : '').join("\n")}
      
      INSTRUCTIONS:
      1. Analyze the competitor content to identify all key topics they cover.
      2. Create a comprehensive structure that covers EVERYTHING they cover, plus unique insights they missed.
      `;
    } else {
      prompt += `\n\nRequirements:
      - Cover all potential sub-topics a competitor might have.
      `;
    }

    prompt += `
    - **MUST INCLUDE** an FAQ section based on "People Also Asked" questions.
    - Structure with Main Headings (H2) and bullet points.
    
    Output strictly in ${language}.
    
    RETURN THE OUTPUT AS A RAW JSON ARRAY. Each object must have:
    - id (string)
    - heading (string)
    - keyPoints (string array)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: getBlogSystemInstruction(language),
        tools: [{ googleSearch: {} }] // Enabled for Superset analysis
      }
    });
    
    const parsed = cleanAndParseJSON(response.text || "[]");
    return parsed.map((item: any, index: number) => ({ ...item, id: item.id || `section-${index}` }));
  } catch (error) {
    console.error("Blog outline error", error);
    throw error;
  }
};

export const generateBlogContent = async (title: string, outline: BlogOutlineSection[], language: string, apiKey?: string | string[]): Promise<string> => {
  try {
    const ai = getAiClient(apiKey);
    const outlineStr = JSON.stringify(outline);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a complete, high-quality blog post based on this outline.
      
      Title: ${title}
      Outline: ${outlineStr}
      Current Context: The year is 2025.
      
      Use Google Search to verify facts, find recent statistics, and ensure content is up-to-date.

      STRICT WRITING GUIDELINES:
      1. **Sentence Length:** Short. 1-2 sentences per paragraph maximum. No walls of text.
      2. **Structure:** 
         - Engaging Intro (Hook with emotion).
         - Body paragraphs based on outline (H2s, bullets).
         - Conclusion with CTA.
         - **META DATA** section at the very end (Title & Description).
      3. **Formatting:** Use Markdown. Include [Image Placeholder: Description] where relevant.
      4. **Tables:** MANDATORY: Use well-formatted Markdown Tables for:
         - **Comparisons:** Columns: [Feature | Option A | Option B]
         - **Pros & Cons:** Columns: [Pros | Cons]
         - **Pricing:** Columns: [Plan | Price | Key Features]
         Ensure tables are readable and alignment is correct.
      5. **NLP:** Define core keywords simply early on (e.g., "[Keyword] IS [Definition]").
      6. **FAQ SCHEMA:** At the very bottom of the response, generate valid JSON-LD Schema markup for \`FAQPage\` based on the FAQ section of the article. Wrap it in a \`\`\`json code block.
      
      **SEO & KEYWORD OPTIMIZATION (CRITICAL):**
      - **Keyword Density:** Maintain a strict keyword density of **1.5% to 2%** for the primary keyword. Do not go below or above this range.
      - **Semantic SEO:** Naturally weave in LSI keywords and secondary keywords found via Google Search or provided in the strategy phase.
      - **Placement:** Ensure keywords appear naturally in the H1, Introduction, Conclusion, and distributed throughout H2s and body text. **DO NOT SPAM**; they must fit the context perfectly.

      Output the full blog post in ${language}.
      `,
      config: {
        systemInstruction: getBlogSystemInstruction(language),
        tools: [{ googleSearch: {} }] // Enabled for factual accuracy
      }
    });
    
    const sources = extractSources(response);
    return (response.text || "") + sources;
  } catch (error) {
    console.error("Blog content error", error);
    throw error;
  }
};

export const generateBlogIntro = async (title: string, bodyContent: string, tone: string, language: string, apiKey?: string | string[]): Promise<string> => {
  try {
    const ai = getAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a PERFECT blog post introduction for the following article.
      
      TITLE: ${title}
      
      ARTICLE BODY (For context):
      ${bodyContent.substring(0, 5000)}... (truncated for context)
      
      Current Context: The year is 2025.
      Tone: ${tone}
      
      STRICT REQUIREMENTS (Affiliate Lab Style):
      1. **Hook:** Start with an emotional hook (Fear, Excitement, FOMO) or a direct question.
      2. **The "Good News":** Pivot to the solution immediately.
      3. **Proof/Credibility:** Briefly mention why this advice works.
      4. **The Plan:** bullet point what they will learn.
      5. **Length:** Short, punchy paragraphs (1-2 sentences).
      
      Output ONLY the introduction text in Markdown. Do not include the title.
      Write in ${language}.
      `,
      config: {
        systemInstruction: getBlogSystemInstruction(language),
        tools: [{ googleSearch: {} }] // Enabled for context
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Blog intro error", error);
    throw error;
  }
};
