# Runbook for the scheduled runs (Markets & Finance)

The page: https://claude.ai/artifact/NuPN4PCUxinTeARjfaTZjk (private, owner only).
Reader: an individual investor in Jakarta who wants to read one page and skip every news site.

## Rules for every run

- **Sources: CNBC and Yahoo Finance only.** Use WebSearch with
  `allowed_domains: ["cnbc.com", "finance.yahoo.com"]`. WebFetch cannot reach these
  sites from the cloud container, and MarketWatch/WSJ are blocked, so don't try them.
- **Times are Jakarta time (WIB, UTC+7)** everywhere on the page.
  US Eastern is UTC−4 until 1 Nov 2026, then UTC−5 (US open 20:30 WIB, then 21:30 WIB).
- **Check market hours.** US stocks trade only about 20:30–03:00 WIB (21:30–04:00 after 1 Nov),
  Monday–Friday US time. Outside those hours there is no US intraday move: only futures or the
  previous close. Check the date on every figure, and don't repeat numbers already on the page.
- **Filter hard.** Leave out anything that doesn't affect US markets, rates, big sectors,
  or Japan / Korea / Taiwan / China. No "safe to ignore" list: unimportant news is simply left out.
- **Never invent numbers.** If sources disagree or no figure is found, describe it in words
  or mark it with ≈. Every figure must come from a CNBC or Yahoo Finance result.
- **Keep the design.** Read the live page first (Artifact tool, `action: "read"`, `url` above),
  keep its `<style>`, structure, class names and the `FEED:START` / `FEED:END` markers,
  and change only the content. Publish back to the same `url`.
- Not investment advice; keep the footer line that says so.

## Morning brief (06:30 WIB, Monday to Saturday)

Before rewriting, archive yesterday's final page (see "Website" below). Then rewrite the
whole page for today's date. The page title stays **Markets & Finance**.

1. Masthead date, "Covers US session of <day date>". Monday: "Weekend recap and week ahead".
2. US close strip: Dow, S&P 500, Nasdaq, 10-yr yield, dollar index, gold, oil, Nasdaq-100 futures.
3. The one thing to know: one sentence plus up to three bullets. Its kicker carries
   `<span class="asof">· updated <Ddd DD Mon>, HH:MM WIB</span>` with the brief's time.
4. Since this morning feed: reset to empty with
   `<p class="empty">No updates yet. First check at 13:00 WIB.</p>` (Saturday: "Next update Monday 06:30 WIB.")
5. Top stories: at most five, ranked High / Medium impact, under the kicker
   "Morning brief · top stories, ranked by impact" and the line
   `<p class="written">Written <Day DD Mon>, HH:MM WIB. For anything newer, see "Since this morning" above.</p>`.
   Each story opens with `<p class="meta"><span class="tag hi|mid">High|Medium impact</span><span class="when">Written <Ddd DD Mon>, HH:MM WIB · about <the day or period the story covers, e.g. "Fri 23 Oct" or "this week, 26–30 Oct"></span></p>`.
   Each story has what happened,
   "Why it matters", and the affected tickers or markets.
6. Asia today rail: Korea, Japan, Taiwan, Hong Kong, China — previous close and the outlook.
7. Coming up: market-moving events only, in WIB.
8. Earnings scorecard: only companies CNBC / Yahoo Finance covered; skip the section on days with none.
9. Footer: source links actually used.

Then update the website (see "Website" below), including `public/briefs/YYYY-MM-DD.html`.

## News checks (13:00, 20:30 and 01:00 WIB)

1. Read the live page. Search for news since the time in its "Last updated" stamp.
2. If there is news that passes the filter, add items to the **top** of the feed list:
   `<li class="new"><time>Ddd<br>HH:MM</time><div><span class="tag hi|mid">High|Medium impact</span><b>Headline</b><p>Two sentences: what happened and why it matters.</p></div></li>`
   (Ddd = Mon, Tue…, the Jakarta day). Remove `class="new"` from all older items first, so only
   the latest check's items show NEW. Remove the empty-state paragraph if it is there.
3. Update the stamp: `Last updated <Day DD Mon>, HH:MM WIB · Next check HH:MM WIB`.
4. Refresh "The one thing to know" at every check:
   - **Bullets (always):** rewrite the three bullets so they describe the market as it is now.
     Keep a bullet that is still true (update its figures if newer ones exist); replace one that is
     out of date. The first bullet starts "Today:" and sums up the latest moves.
   - **Big sentence (only when needed):** rewrite it only when there is a **big** story or it has
     become wrong or misleading. Otherwise keep it, trimming any clause that is no longer true.
   - Set its `asof` label to the check's time.
5. If nothing passes the filter, add no feed items, but still refresh the bullets and stamp.

**Big story** means one of: a Fed or other central-bank surprise; S&P 500, Nasdaq,
Nikkei, Kospi or Taiex moving more than 2%; a mega-cap (NVDA, AAPL, MSFT, GOOGL, AMZN,
META, TSLA, TSM, Samsung) moving more than 7% on news; a major geopolitical event
(e.g. US–Iran deal or escalation, Taiwan Strait); oil moving more than 5%.

After publishing, update the website (see "Website" below), `public/index.html` only.

## Website (Cloudflare)

The same page is served at https://finance-news.aditihs1404.workers.dev by the Cloudflare Worker `finance-news` (static files in `public/`,
config in `wrangler.jsonc`), built from repo `aditihs1404-arch/Finance-News`,
branch `claude/modest-euler-fqoql0`. Cloudflare redeploys on every push. Every run updates it after publishing:

1. **Call `add_repo` (owner `aditihs1404-arch`, repo `Finance-News`, access `push`) BEFORE cloning.**
   Without it the clone works but the push is refused. Then
   `git clone --depth 1 -b claude/modest-euler-fqoql0 https://github.com/aditihs1404-arch/Finance-News`.
   If the push is still refused, call `add_repo` again and retry the push once.
2. Write `public/index.html` as the published page wrapped in a full document:
   `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>`
   + the page content exactly as published + `</body></html>`.
   **Morning brief only, before overwriting `public/index.html`:** copy the current
   `public/index.html` to `public/briefs/YYYY-MM-DD.html`, where the date is the edition date in
   that page's masthead (yesterday's, or Saturday's on Monday). Then add a line at the top of the
   list between `ARCHIVE:START` and `ARCHIVE:END` in `public/briefs/index.html`:
   `<li><a href="/briefs/YYYY-MM-DD.html">Weekday, DD Month YYYY</a><span>N updates</span></li>`
   (N = number of feed items on that page) and delete the `<p class="empty">` line if present.
3. Commit ("Brief YYYY-MM-DD" or "News check YYYY-MM-DD HH:MM WIB") and
   `git push origin claude/modest-euler-fqoql0`.
4. If any of this fails, the claude.ai page still counts as done; say so in one line of the final reply.

Live prices: on the website, `public/live.js` (loaded by `worker/index.js`) replaces the
numbers in `section.strip` with prices from `/api/quotes` every minute. Keep that section's
markup (`section.strip`, `.kicker`, `.tape`, `.note`) so it keeps working. Don't edit
`public/live.js`, `worker/` or `wrangler.jsonc` during scheduled runs.

## Notifications

When there is a big story, the final reply of the run starts with
`BIG STORY:` and one line on it. Otherwise the final reply is exactly
`No big story. Page updated.`
