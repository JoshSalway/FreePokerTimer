export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { prompt } = await req.json()
  if (!prompt || typeof prompt !== 'string' || prompt.length > 500) {
    return new Response(JSON.stringify({ error: 'Invalid prompt' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const systemPrompt = `You are a poker tournament blind structure generator. Given a natural language description of a tournament, return ONLY a valid JSON array of level and break objects.

Each level object: { "type": "level", "small": <number>, "big": <number>, "ante": <number>, "duration": <seconds> }
Each break object: { "type": "break", "duration": <seconds> }

Rules:
- Blinds should be round numbers (25, 50, 100, 200, 500, 1000, etc.)
- Big blind is typically 2x small blind
- Antes are optional, usually 10% of big blind, starting mid-tournament
- Level durations are in SECONDS (e.g. 15 minutes = 900)
- Break durations are in SECONDS (e.g. 10 minutes = 600)
- Include breaks every 4-6 levels for tournaments over 1 hour
- Standard tournament: 15-30 levels, escalating blinds
- If the user doesn't specify details, use sensible poker tournament defaults
- Blinds should increase smoothly (roughly 1.5-2x per level)
- Return ONLY the JSON array, no markdown, no explanation`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(JSON.stringify({ error: 'AI request failed', details: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    const text = data.content[0].text.trim()

    // Parse the JSON - strip markdown fences if present
    const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    const structure = JSON.parse(cleaned)

    // Validate structure
    if (!Array.isArray(structure) || structure.length === 0) {
      throw new Error('Invalid structure returned')
    }

    for (const item of structure) {
      if (item.type === 'level') {
        if (typeof item.small !== 'number' || typeof item.big !== 'number' || typeof item.duration !== 'number') {
          throw new Error('Invalid level object')
        }
        if (item.ante === undefined) item.ante = 0
      } else if (item.type === 'break') {
        if (typeof item.duration !== 'number') throw new Error('Invalid break object')
      } else {
        throw new Error('Unknown item type')
      }
    }

    return new Response(JSON.stringify({ structure }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
