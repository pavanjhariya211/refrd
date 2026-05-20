import OpenAI from 'openai'

// Re-exported so routes can reference OpenAI.APIError in catch blocks
// without importing the SDK directly. Referencing the class is safe at
// build time — only `new OpenAI()` throws on a missing key.
export { OpenAI }

// Lazily-constructed, memoized OpenAI client.
//
// The SDK constructor throws if OPENAI_API_KEY is missing. Constructing
// it at module scope means the route module can't even be *imported*
// without the key — which breaks `next build`'s page-data collection on
// any environment where the key isn't present (e.g. Vercel Preview when
// the var is scoped to Production only). Deferring construction to the
// first request keeps the build env-agnostic; the key is only needed at
// runtime, which is where it actually belongs.
let client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return client
}
