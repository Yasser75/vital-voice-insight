const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_BYTES = 20 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'LOVABLE_API_KEY is not configured' }, 500);
    const len = Number(req.headers.get('content-length') || 0);
    if (len > MAX_BYTES) return json({ error: 'Audio too large' }, 413);

    const form = await req.formData();
    const file = form.get('file');
    const lang = String(form.get('language') || '');
    if (!(file instanceof File) || !file.size || file.size > MAX_BYTES) return json({ error: 'Invalid audio file' }, 400);

    const up = new FormData();
    up.append('model', 'openai/gpt-transcribe');
    up.append('file', new File([file], 'audio.webm', { type: 'audio/webm' }));
    up.append('response_format', 'json');
    up.append('stream', 'true');
    if (lang) up.append('languages', lang);
    up.append('prompt', 'Doctor-patient medical consultation. May be in English or Urdu.');

    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: up,
    });
    if (!res.ok) {
      const details = await res.text();
      console.error('Transcription failed', res.status, details);
      return json({ error: 'Transcription failed', status: res.status, details }, res.status);
    }

    const raw = await res.text();
    let text = '';
    let deltas = '';
    for (const line of raw.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === 'transcript.text.delta') deltas += ev.delta || '';
        if (ev.type === 'transcript.text.done') text = ev.text || '';
        if (ev.type === 'error') return json({ error: ev.error?.message || 'Transcription error' }, 502);
      } catch { /* ignore */ }
    }
    return json({ text: (text || deltas).trim() });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
