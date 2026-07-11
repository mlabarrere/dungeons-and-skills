/* stats.mjs — the statistics the reports need: percentiles, and bootstrap confidence
   intervals for a mean (seeded, so runs are reproducible). Paired comparison works on the
   SAME tasks across two conditions (spec §11). No significance is claimed here — the report
   states n and the interval and lets the reader judge; small pilots are flagged exploratory. */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export function median(xs) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
export function std(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}
export function percentile(xs, p) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const idx = (p / 100) * (s.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

/** 95% bootstrap CI of the mean. Returns {mean, lo, hi, n, iters}. Seeded. */
export function bootstrapCI(xs, { iters = 2000, alpha = 0.05, seed = 1 } = {}) {
  const n = xs.length;
  if (n === 0) return { mean: NaN, lo: NaN, hi: NaN, n: 0, iters };
  if (n === 1) return { mean: xs[0], lo: xs[0], hi: xs[0], n: 1, iters };
  const rnd = mulberry32(seed);
  const means = new Array(iters);
  for (let b = 0; b < iters; b++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += xs[(rnd() * n) | 0];
    means[b] = s / n;
  }
  means.sort((a, b) => a - b);
  return { mean: mean(xs), lo: percentile(means, 100 * (alpha / 2)), hi: percentile(means, 100 * (1 - alpha / 2)), n, iters };
}

/** Paired difference b - a over aligned samples (same tasks). */
export function pairedDiff(a, b, opts = {}) {
  const k = Math.min(a.length, b.length);
  const diffs = [];
  for (let i = 0; i < k; i++) diffs.push(b[i] - a[i]);
  const ci = bootstrapCI(diffs, opts);
  return { n: k, mean_diff: mean(diffs), ci };
}

export const percentiles = (xs) => ({ p50: percentile(xs, 50), p90: percentile(xs, 90), p95: percentile(xs, 95),
  mean: mean(xs), median: median(xs), std: std(xs) });
