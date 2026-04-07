// In-memory price cache — 5 min TTL to avoid hammering Yahoo Finance
const priceCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(ticker) {
  const entry = priceCache.get(ticker);
  if (entry && Date.now() < entry.expiresAt) return entry.price;
  return undefined;
}

function setCache(ticker, price) {
  priceCache.set(ticker, { price, expiresAt: Date.now() + CACHE_TTL_MS });
}

function buildTickerCandidates(raw) {
  const base = String(raw || "").trim().toUpperCase();
  if (!base) return [];

  // If user already provided exchange suffix (e.g. RELIANCE.NS or TSLA), keep it first.
  if (base.includes(".")) {
    return [base];
  }

  // Try plain first, then NSE and BSE suffixes.
  return [base, `${base}.NS`, `${base}.BO`];
}

// Fetch live price directly from Yahoo Finance Chart API.
// Uses query2 chart endpoint which is more reliable than the quote endpoint.
async function fetchQuote(ticker) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  try {
    const res = await Promise.race([
      fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000)
      ),
    ]);

    if (res.status === 429) {
      // Rate limited — wait 2s and retry once
      await new Promise((r) => setTimeout(r, 2000));
      const retry = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (!retry.ok) return null;
      const data = await retry.json();
      return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
    }

    if (!res.ok) return null;

    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch (err) {
    console.error("[stock-price] fetch failed for", ticker, ":", err.message);
    return null;
  }
}

export async function POST(req) {
  const { symbols } = await req.json();

  if (!symbols || !Array.isArray(symbols)) {
    return new Response(JSON.stringify({ error: "Missing symbols" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prices = {};

  for (let i = 0; i < symbols.length; i++) {
    const raw = symbols[i];
    if (!raw) continue;

    const candidates = buildTickerCandidates(raw);
    let resolvedPrice = null;

    for (const ticker of candidates) {
      const cached = getCached(ticker);
      if (cached !== undefined) {
        resolvedPrice = cached;
        break;
      }

      const fetched = await fetchQuote(ticker);
      if (fetched !== null) {
        resolvedPrice = fetched;
        setCache(ticker, fetched);
        break;
      }
    }

    prices[raw] = resolvedPrice;

    // 150 ms gap between requests
    if (i < symbols.length - 1) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  return new Response(JSON.stringify({ prices }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
