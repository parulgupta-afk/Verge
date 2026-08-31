/**
 * Optional vision-based media check for road evidence photos.
 * - Without OPENAI_API_KEY or GEMINI_API_KEY: returns verified: null (honest stub).
 * - With a key: asks the model if the image plausibly supports the claim type.
 */

export type MediaCheckInput = {
  mediaUrl: string
  claimType?: string
}

export type MediaCheckOutput = {
  verified: boolean | null
  note: string
  confidence?: number
  model?: string | null
  aspirational?: boolean
}

export async function checkMediaEvidence(
  input: MediaCheckInput
): Promise<MediaCheckOutput> {
  const mediaUrl = input.mediaUrl
  const claimType = input.claimType || 'blocked'

  if (!mediaUrl || typeof mediaUrl !== 'string') {
    return { verified: null, note: 'media_url required', model: null }
  }

  // blob: / data: URLs from the browser cannot be fetched by the server
  if (mediaUrl.startsWith('blob:') || mediaUrl.startsWith('data:')) {
    return {
      verified: null,
      note: 'Local blob/data URLs cannot be verified server-side. Upload to storage first, then re-check. Until then photo is evidence-only (not AI-verified).',
      model: null,
      aspirational: true,
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

  if (!openaiKey && !geminiKey) {
    return {
      verified: null,
      note: 'Vision verification is not live: set OPENAI_API_KEY or GEMINI_API_KEY on the server. Photos are stored as user evidence only; media_verified stays null in DB.',
      model: null,
      aspirational: true,
    }
  }

  const prompt = `You are checking a community road-status photo for the Verge app (India).
Claim type: ${claimType} (blocked | partial | clear).
Does this image plausibly show a road that matches the claim (e.g. blockage, flooding, construction, or a clear passable road)?
Reply with JSON only: {"supports_claim": true|false, "confidence": 0-1, "reason": "short"}`

  try {
    if (openaiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: mediaUrl } },
              ],
            },
          ],
          max_tokens: 200,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        return {
          verified: null,
          note: `OpenAI vision error: ${text.slice(0, 200)}`,
          model: 'openai',
        }
      }
      const data = (await res.json()) as any
      const raw = data.choices?.[0]?.message?.content || ''
      const parsed = parseModelJson(raw)
      return {
        verified: parsed.supports_claim,
        confidence: parsed.confidence,
        note: parsed.reason || 'Model assessed image against claim',
        model: data.model || 'openai-vision',
        aspirational: false,
      }
    }

    // Gemini (Google AI Studio)
    const model = process.env.GEMINI_VISION_MODEL || 'gemini-1.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { text: `Image URL to consider: ${mediaUrl}` },
            ],
          },
        ],
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return {
        verified: null,
        note: `Gemini error: ${text.slice(0, 200)}`,
        model: 'gemini',
      }
    }
    const data = (await res.json()) as any
    const raw =
      data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ||
      ''
    const parsed = parseModelJson(raw)
    return {
      verified: parsed.supports_claim,
      confidence: parsed.confidence,
      note: parsed.reason || 'Model assessed claim (URL-based; prefer hosted image for best results)',
      model: model,
      aspirational: false,
    }
  } catch (e: any) {
    return {
      verified: null,
      note: `Media check failed: ${e?.message || String(e)}`,
      model: null,
    }
  }
}

function parseModelJson(raw: string): {
  supports_claim: boolean | null
  confidence?: number
  reason?: string
} {
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return { supports_claim: null, reason: raw.slice(0, 120) }
    const j = JSON.parse(match[0])
    return {
      supports_claim:
        typeof j.supports_claim === 'boolean' ? j.supports_claim : null,
      confidence: typeof j.confidence === 'number' ? j.confidence : undefined,
      reason: j.reason,
    }
  } catch {
    return { supports_claim: null, reason: raw.slice(0, 120) }
  }
}
