import { ZHIPU_EMBEDDING_URL } from "@/lib/zhipu";

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;

  return dot / denom;
}

export function similarityToPercent(similarity: number): number {
  const clamped = Math.max(0, Math.min(1, similarity));
  return Math.round(clamped * 100);
}

interface EmbeddingResponse {
  data?: Array<{ embedding: number[]; index: number }>;
  error?: { message?: string };
}

export async function getEmbeddings(
  apiKey: string,
  inputs: string[]
): Promise<number[][]> {
  const response = await fetch(ZHIPU_EMBEDDING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "embedding-3",
      input: inputs,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding API error: ${errText}`);
  }

  const data: EmbeddingResponse = await response.json();
  const items = data.data;

  if (!items?.length) {
    throw new Error(data.error?.message || "Embedding API returned empty data");
  }

  return items
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}
