// Serves the static brief from public/ and adds a small live-prices API.
// GET /api/quotes returns the latest price and daily change for each symbol below,
// fetched from Yahoo Finance's chart endpoint and cached for 60 seconds.
// HTML pages get /live.js injected so the market strip refreshes itself.

const SYMBOLS = [
  { key: "dow", name: "Dow", symbol: "^DJI", group: "us" },
  { key: "spx", name: "S&P 500", symbol: "^GSPC", group: "us" },
  { key: "ndx", name: "Nasdaq", symbol: "^IXIC", group: "us" },
  { key: "nqf", name: "Nasdaq-100 fut.", symbol: "NQ=F", group: "us" },
  { key: "tnx", name: "10-yr yield", symbol: "^TNX", group: "rates", kind: "yield" },
  { key: "dxy", name: "Dollar index", symbol: "DX-Y.NYB", group: "rates" },
  { key: "idr", name: "USD/IDR", symbol: "IDR=X", group: "rates", digits: 0 },
  { key: "gold", name: "Gold", symbol: "GC=F", group: "commodities", prefix: "$" },
  { key: "wti", name: "Oil (WTI)", symbol: "CL=F", group: "commodities", prefix: "$" },
  { key: "brent", name: "Oil (Brent)", symbol: "BZ=F", group: "commodities", prefix: "$" },
  { key: "n225", name: "Nikkei 225", symbol: "^N225", group: "asia" },
  { key: "kospi", name: "Kospi", symbol: "^KS11", group: "asia" },
  { key: "twii", name: "Taiex", symbol: "^TWII", group: "asia" },
  { key: "hsi", name: "Hang Seng", symbol: "^HSI", group: "asia" },
  { key: "csi", name: "CSI 300", symbol: "000300.SS", group: "asia" },
];

const CACHE_SECONDS = 60;

async function fetchQuote(item) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?range=1d&interval=5m`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (finance-news brief)" },
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const prev = meta?.chartPreviousClose ?? meta?.previousClose;
    if (typeof price !== "number" || typeof prev !== "number") throw new Error("no price");
    return {
      ...item,
      price,
      prevClose: prev,
      change: price - prev,
      pct: prev ? ((price - prev) / prev) * 100 : null,
      time: meta.regularMarketTime ? meta.regularMarketTime * 1000 : null,
      ok: true,
    };
  } catch (err) {
    return { ...item, ok: false, error: String(err.message || err) };
  }
}

async function quotes() {
  const results = await Promise.all(SYMBOLS.map(fetchQuote));
  return new Response(JSON.stringify({ updated: Date.now(), quotes: results }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${CACHE_SECONDS / 2}`,
    },
  });
}

class InjectLiveScript {
  element(el) {
    el.append('<script src="/live.js" defer></script>', { html: true });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/quotes") return quotes();

    const res = await env.ASSETS.fetch(request);
    const type = res.headers.get("content-type") || "";
    if (url.pathname === "/" || url.pathname === "/index.html") {
      if (type.includes("text/html")) return new HTMLRewriter().on("head", new InjectLiveScript()).transform(res);
    }
    return res;
  },
};
