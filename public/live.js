// Live market strip: replaces the brief's static "US close" numbers with prices from
// /api/quotes and refreshes them every minute while the page is visible.
// If the API is unreachable, the brief's own numbers stay on screen untouched.
(function () {
  const REFRESH_MS = 60 * 1000;
  const GROUPS = [
    { id: "us", label: "US" },
    { id: "rates", label: "Rates & FX" },
    { id: "commodities", label: "Commodities" },
    { id: "asia", label: "Asia" },
  ];

  const strip = document.querySelector("section.strip");
  if (!strip) return;
  const kicker = strip.querySelector(".kicker");
  const note = strip.querySelector(".note");
  const tape = strip.querySelector(".tape");
  if (!tape) return;

  const style = document.createElement("style");
  style.textContent = `
    .live-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--up); margin-right: 6px; vertical-align: 1px; }
    .live-dot.stale { background: var(--ink-2); }
    .q.grp { grid-column: 1 / -1; padding-block: 6px; background: var(--tint); }
    .q.grp .n { color: var(--accent); }
    .q .t { font: 400 0.72rem/1.3 var(--data); color: var(--ink-2); }
    @keyframes q-flash { from { background: var(--tint); } to { background: transparent; } }
    .q.changed { animation: q-flash 1.2s ease-out; }
    @media (prefers-reduced-motion: reduce) { .q.changed { animation: none; } }
  `;
  document.head.appendChild(style);

  const wib = (ms, withDay) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      ...(withDay ? { weekday: "short" } : {}),
    }).format(new Date(ms));

  function usMarketOpen(now) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      })
        .formatToParts(now)
        .map((p) => [p.type, p.value])
    );
    if (parts.weekday === "Sat" || parts.weekday === "Sun") return false;
    const mins = Number(parts.hour) * 60 + Number(parts.minute);
    return mins >= 9 * 60 + 30 && mins < 16 * 60;
  }

  function fmtPrice(q) {
    const digits = q.digits ?? (q.price >= 1000 ? 2 : 2);
    const n = q.price.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    if (q.kind === "yield") return n + "%";
    return (q.prefix || "") + n;
  }

  function fmtChange(q) {
    const sign = (v) => (v > 0 ? "+" : v < 0 ? "−" : "");
    if (q.kind === "yield") {
      const bp = Math.round(q.change * 100);
      return `${sign(bp)}${Math.abs(bp)} bp`;
    }
    if (q.pct == null) return "";
    return `${sign(q.pct)}${Math.abs(q.pct).toFixed(2)}%`;
  }

  function direction(q) {
    if (Math.abs(q.change) < 1e-9) return "flat";
    // A rising yield is bad for stocks, so it shows red, matching the brief's note.
    const good = q.kind === "yield" ? q.change < 0 : q.change > 0;
    return good ? "up" : "down";
  }

  const last = {};

  function render(data) {
    const now = Date.now();
    const ok = data.quotes.filter((q) => q.ok);
    if (!ok.length) return false;

    const frag = document.createDocumentFragment();
    for (const g of GROUPS) {
      const items = ok.filter((q) => q.group === g.id);
      if (!items.length) continue;
      const head = document.createElement("div");
      head.className = "q grp";
      head.innerHTML = `<span class="n"></span>`;
      head.firstChild.textContent = g.label;
      frag.appendChild(head);
      for (const q of items) {
        const el = document.createElement("div");
        el.className = "q";
        const price = fmtPrice(q);
        if (last[q.key] && last[q.key] !== price) el.classList.add("changed");
        last[q.key] = price;
        el.innerHTML = `<span class="n"></span><span class="v"></span><span class="c"></span><span class="t"></span>`;
        el.children[0].textContent = q.name;
        el.children[1].textContent = price;
        el.children[2].textContent = fmtChange(q);
        el.children[2].classList.add(direction(q));
        el.children[3].textContent = q.time ? `as of ${wib(q.time, now - q.time > 20 * 3600 * 1000)} WIB` : "";
        frag.appendChild(el);
      }
    }
    tape.replaceChildren(frag);

    const open = usMarketOpen(new Date(now));
    if (kicker) {
      kicker.innerHTML = `<span class="live-dot"></span><span></span>`;
      kicker.lastChild.textContent = `Markets live · updated ${wib(data.updated)} WIB · US market ${open ? "open" : "closed"}`;
    }
    if (note) {
      note.textContent =
        "Prices refresh every minute from Yahoo Finance and may be delayed up to 15 minutes. Changes are versus the previous close. A rising yield shows red because it is bad for stocks.";
    }
    return true;
  }

  let timer = null;
  async function refresh() {
    try {
      const res = await fetch("/api/quotes", { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      render(await res.json());
    } catch (e) {
      const dot = kicker && kicker.querySelector(".live-dot");
      if (dot) dot.classList.add("stale");
    }
  }

  function schedule() {
    clearInterval(timer);
    if (!document.hidden) {
      refresh();
      timer = setInterval(refresh, REFRESH_MS);
    }
  }

  document.addEventListener("visibilitychange", schedule);
  schedule();
})();
