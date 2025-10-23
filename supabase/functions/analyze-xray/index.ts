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
    const { imageUrl, imageBase64, testType } = await req.json();
    console.log('Processing X-ray analysis request:', { testType, hasUrl: !!imageUrl, hasBase64: !!imageBase64 });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Prepare the image content for the AI
    const imageContent = imageUrl 
      ? { type: "image_url", image_url: { url: imageUrl } }
      : { type: "image_url", image_url: { url: imageBase64 } };

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
            content: `You are an AI radiologist assistant. Analyze medical imaging and provide:
1. Identification of any abnormalities or areas of concern
2. Description of findings with approximate locations (percentage from top/left)
3. Severity assessment
4. Recommendations for further investigation

Format your response as JSON with the following structure:
{
  "findings": "detailed description",
  "anomalies": [
    {
      "description": "what was found",
      "location": "approximate position",
      "coordinates": { "x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100 },
      "severity": "low|medium|high"
    }
  ],
  "recommendations": "further steps"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: "text",
                text: `Analyze this ${testType || 'X-ray'} image and identify any abnormalities.`
              },
              imageContent
            ]
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
    let analysis = data.choices[0].message.content;
    console.log('X-ray analysis completed successfully');

    // Try to parse as JSON if it's in code blocks
    if (analysis.includes('```json')) {
      analysis = analysis.split('```json')[1].split('```')[0].trim();
    } else if (analysis.includes('```')) {
      analysis = analysis.split('```')[1].split('```')[0].trim();
    }

    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysis);
    } catch (e) {
      // If parsing fails, create a structured response
      parsedAnalysis = {
        findings: analysis,
        anomalies: [],
        recommendations: "Consult with a radiologist for detailed analysis"
      };
    }

    return new Response(
      JSON.stringify({
        analysis: parsedAnalysis,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in analyze-xray:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during X-ray analysis';
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