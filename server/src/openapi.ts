/** Minimal OpenAPI 3.0 document for Verge server */

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Verge Server API',
    version: '1.2.1',
    description:
      'Optional orchestration API. Confidence source of truth is Postgres RPC recalculate_segment_confidence — not client-supplied counts.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    service: { type: 'string' },
                    confidenceSourceOfTruth: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/confidence/recalculate': {
      post: {
        summary: 'Recalculate confidence for a segment (segment_id only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['segment_id'],
                properties: {
                  segment_id: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Recalculated via Supabase RPC when configured' },
          '400': { description: 'Missing segment_id' },
        },
      },
    },
    '/api/confidence/calculate': {
      post: {
        summary: 'Removed — returns 410',
        responses: {
          '410': {
            description: 'Gone. Do not POST confirms/refutes.',
          },
        },
      },
    },
    '/api/media/check': {
      post: {
        summary: 'Optional vision check of road evidence photo',
        description:
          'Without OPENAI_API_KEY or GEMINI_API_KEY returns verified: null (aspirational). With a key, attempts model judgment.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['media_url'],
                properties: {
                  media_url: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['blocked', 'partial', 'clear'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Check result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    verified: { type: 'boolean', nullable: true },
                    note: { type: 'string' },
                    confidence: { type: 'number' },
                    model: { type: 'string', nullable: true },
                    aspirational: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/routing/reroute': {
      post: {
        summary: 'Reroute orchestration stub',
        responses: { '200': { description: 'Stub response' } },
      },
    },
    '/openapi.json': {
      get: {
        summary: 'This OpenAPI document',
        responses: { '200': { description: 'OpenAPI JSON' } },
      },
    },
  },
} as const
