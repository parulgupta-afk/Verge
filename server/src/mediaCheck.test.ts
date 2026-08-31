import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { checkMediaEvidence } from './mediaCheck.js'

describe('checkMediaEvidence', () => {
  it('returns null verified without API keys', async () => {
    delete process.env.OPENAI_API_KEY
    delete process.env.GEMINI_API_KEY
    delete process.env.GOOGLE_API_KEY
    const r = await checkMediaEvidence({
      mediaUrl: 'https://example.com/road.jpg',
      claimType: 'blocked',
    })
    assert.equal(r.verified, null)
    assert.equal(r.aspirational, true)
    assert.ok(r.note.length > 10)
  })

  it('rejects missing url', async () => {
    const r = await checkMediaEvidence({ mediaUrl: '' })
    assert.equal(r.verified, null)
    assert.match(r.note, /required/i)
  })

  it('handles blob urls without claiming verification', async () => {
    const r = await checkMediaEvidence({
      mediaUrl: 'blob:http://localhost/abc',
      claimType: 'blocked',
    })
    assert.equal(r.verified, null)
    assert.match(r.note, /blob/i)
  })
})
