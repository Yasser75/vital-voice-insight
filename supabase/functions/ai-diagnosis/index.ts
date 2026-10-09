import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, transcript } = await req.json();
    console.log('Processing diagnosis request:', { symptoms, hasTranscript: !!transcript });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an AI medical assistant. Analyze patient symptoms and provide:
1. Possible diagnoses (ranked by likelihood)
2. Confidence level (percentage)
3. Recommended medical tests
4. Urgency assessment

If important information is missing to narrow the diagnosis (e.g. duration, severity, fever, medications, history), end your answer with a section exactly titled "CLARIFYING QUESTIONS:" followed by up to 3 short, simple questions addressed directly to the patient, each on its own line starting with "- ". Omit that section if no more information is needed. If the transcript is in Urdu, write the questions in Urdu.

IMPORTANT: This is for medical professional assistance only. Always recommend consulting with a healthcare provider.`
          },
          {
            role: 'user',
            content: `Patient consultation transcript: ${transcript}\n\nSymptoms: ${symptoms.join(', ')}\n\nProvide a structured diagnosis analysis.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    console.log('Diagnosis generated successfully');

    // Parse the analysis to extract structured data
    const confidenceMatch = analysis.match(/(\d+)%/);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;

    let diagnosisText = analysis;
    let questions: string[] = [];
    const idx = analysis.search(/\**\s*CLARIFYING QUESTIONS:?\s*\**/i);
    if (idx >= 0) {
      diagnosisText = analysis.slice(0, idx).trim();
      questions = analysis.slice(idx).split('\n').slice(1)
        .map((l: string) => l.replace(/^\s*([-*•]|\d+[.)])\s*/, '').replace(/\*\*/g, '').trim())
        .filter((l: string) => l.length > 3).slice(0, 3);
    }

    return new Response(
      JSON.stringify({
        diagnosis: diagnosisText,
        questions,
        confidence: confidence,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in ai-diagnosis:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during diagnosis';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});