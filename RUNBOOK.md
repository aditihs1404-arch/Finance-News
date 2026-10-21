# Runbook for the scheduled runs

The page: https://claude.ai/artifact/NuPN4PCUxinTeARjfaTZjk (private, owner only).
Reader: an individual investor in Jakarta who wants to read one page and skip every news site.

## Rules for every run

- **Sources: CNBC and Yahoo Finance only.** Use WebSearch with
  `allowed_domains: ["cnbc.com", "finance.yahoo.com"]`. WebFetch cannot reach these
  sites from the cloud container, and MarketWatch/WSJ are blocked, so don't try them.
- **Times are Jakarta time (WIB, UTC+7)** everywhere on the page.
  US Eastern is UTC−4 until 1 Nov 2026, then UTC−5 (US open 20:30 WIB, then 21:30 WIB).
- **Filter hard.** Leave out anything that doesn't affect US markets, rates, big sectors,
  or Japan / Korea / Taiwan / China. No "safe to ignore" list: unimportant news is simply left out.
- **Never invent numbers.** If sources disagree or no figure is found, describe it in words
  or mark it with ≈. Every figure must come from a CNBC or Yahoo Finance result.
- **Keep the design.** Read the live page first (Artifact tool, `action: "read"`, `url` above),
  keep its `<style>`, structure, class names and the `FEED:START` / `FEED:END` markers,
  and change only the content. Publish back to the same `url`.
- Not investment advice; keep the footer line that says so.

## Morning brief (06:30 WIB, Monday to Saturday)

Rewrite the whole page for today's date:

1. Masthead date, "Covers US session of <day date>". Monday: "Weekend recap and week ahead".
2. US close strip: Dow, S&P 500, Nasdaq, 10-yr yield, dollar index, gold, oil, Nasdaq-100 futures.
3. The one thing to know: one sentence plus up to three bullets.
4. Since this morning feed: reset to empty with
   `<p class="empty">No updates yet. First check at 13:00 WIB.</p>` (Saturday: "Next update Monday 06:30 WIB.")
5. Top stories: at most five, ranked High / Medium impact, each with what happened,
   "Why it matters", and the affected tickers or markets.
6. Asia today rail: Korea, Japan, Taiwan, Hong Kong, China — previous close and the outlook.
7. Coming up: market-moving events only, in WIB.
8. Earnings scorecard: only companies CNBC / Yahoo Finance covered; skip the section on days with none.
9. Footer: source links actually used.

Then archive the page to GitHub repo `aditihs1404-arch/Finance-News`, branch
`claude/modest-euler-fqoql0`, path `briefs/YYYY-MM-DD.html`.

## News checks (13:00, 20:30 and 01:00 WIB)

1. Read the live page. Search for news since the time in its "Last updated" stamp.
2. If there is news that passes the filter, add items to the **top** of the feed list:
   `<li><time>HH:MM</time><div><span class="tag hi|mid">High|Medium impact</span><b>Headline</b><p>Two sentences: what happened and why it matters.</p></div></li>`
   Remove the empty-state paragraph if it is there.
3. Update the stamp: `Last updated <Day DD Mon>, HH:MM WIB · Next check HH:MM WIB`.
4. If a story is **big**, also rewrite "The one thing to know" to reflect it.
5. If nothing passes the filter, change only the stamp.

**Big story** means one of: a Fed or other central-bank surprise; S&P 500, Nasdaq,
Nikkei, Kospi or Taiex moving more than 2%; a mega-cap (NVDA, AAPL, MSFT, GOOGL, AMZN,
META, TSLA, TSM, Samsung) moving more than 7% on news; a major geopolitical event
(e.g. US–Iran deal or escalation, Taiwan Strait); oil moving more than 5%.

Notifications: when there is a big story, the final reply of the run starts with
`BIG STORY:` and one line on it. Otherwise the final reply is exactly
`No big story. Page updated.`
