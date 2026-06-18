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

function tokenize(text: string): string[] {
  const normalized = text.toLowerCase().trim();
  const tokens: string[] = [];

  const cjk = normalized.match(/[\u4e00-\u9fff]/g) ?? [];
  tokens.push(...cjk);
  for (let i = 0; i < cjk.length - 1; i++) {
    tokens.push(cjk[i] + cjk[i + 1]);
  }

  const words = normalized.match(/[a-z0-9]{2,}/g) ?? [];
  tokens.push(...words);

  return tokens;
}

function buildTfidfVector(text: string, corpus: string[]): number[] {
  const docTokens = tokenize(text);
  const docFreq = new Map<string, number>();

  for (const doc of corpus) {
    const unique = new Set(tokenize(doc));
    for (const token of unique) {
      docFreq.set(token, (docFreq.get(token) ?? 0) + 1);
    }
  }

  const termFreq = new Map<string, number>();
  for (const token of docTokens) {
    termFreq.set(token, (termFreq.get(token) ?? 0) + 1);
  }

  const totalTerms = docTokens.length || 1;
  const vocab = Array.from(
    new Set(corpus.flatMap((doc) => tokenize(doc)))
  ).sort();

  return vocab.map((token) => {
    const tf = (termFreq.get(token) ?? 0) / totalTerms;
    const df = docFreq.get(token) ?? 0;
    const idf = Math.log((corpus.length + 1) / (df + 1)) + 1;
    return tf * idf;
  });
}

export function computeSemanticSimilarityPercent(
  websiteText: string,
  keyword: string
): number {
  const corpus = [websiteText, keyword];
  const websiteVector = buildTfidfVector(websiteText, corpus);
  const keywordVector = buildTfidfVector(keyword, corpus);
  return similarityToPercent(
    cosineSimilarity(websiteVector, keywordVector)
  );
}
