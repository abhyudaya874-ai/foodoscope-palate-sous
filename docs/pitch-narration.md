# Pitch narration — read this while recording (≈480 words ≈ 4:15 with action pauses)

Cues in [brackets] are actions, not words. Pause one breath at every ¶. Speak over visuals, never ahead of them.

---

[App idle screen]

Every team building on Foodoscope hits the same walls. The docs say one parameter name — the API rejects it. Numbers arrive as strings. RecipeDB and FlavorDB ingredient names don't line up. And with a 200-token trial and 25 requests a minute, every team burns their budget rediscovering the same bugs. ¶ We hit them too — and we kept the receipts.

[Click the goal chip "Fix the crosswalk for my ingredient CSV"]

So we built Sous. An autonomous agent that probes the Foodoscope APIs, proves every gap with recorded evidence, ships the fix, and files the report. ¶ Watch it work.

[Thinking card streams → plan fills]

That's real model reasoning, streaming live — not scripted. Then Sous plans the whole job: probe, detect, fix, verify, ship, report. Every step shows the model it used, the latency, the tokens.

[Command card: the 400 then the 200]

Here's a bug in the sponsor's own docs, caught live. The documented parameter naturalSource returns HTTP 400. The API actually wants natural_source_name. ¶ Both responses are saved as fixtures — anyone can reproduce this with one curl.

[Shim diff card → crosswalk CSV card]

And Sous doesn't just complain — it fixes. A client shim rewrites the parameter and coerces the string-encoded numbers. A crosswalk with Hindi aliases — jeera to cumin — lifted ingredient matching from nine to thirteen, out of thirty sample names.

[Test card: red → green]

Then it proves the fix. The generated contract suite fails before the shim — three passed, two failed — and passes after — five for five. ¶ Our rule: no failing-then-passing test, no verified fix.

[Approval card appears — let it sit for a beat]

Sponsor-facing writes need a human. Sous is paused right now — nothing is written until I approve. For an audit tool, that gate is the trust. [click Approve; second approval → click Approve]

[Answer settles; click citation [7] → Sources popover; hover another chip]

The answer carries receipts. Click any citation and you land on the exact source — live web results from Tavily and Exa, plus our own recorded API fixtures. Twelve real web receipts back the competitor checks. Nothing on this screen is synthesized.

[Right pane auto-follows to Browser tab; cursor clicks PRICING; extract highlight]

Sous even delegates to its own browser agent. You're watching it open Spoonacular's pricing page, click Pricing, and extract the real table — free tier, fifty points a day. It's a recorded run, clearly labelled.

[Left rail profile card → PROOF.md scroll]

Everything Sous does feeds its own profile. XP, ranks, streaks — computed from the event log, never typed by hand. And this is the proof file, regenerated from 136 events: six endpoints probed, three confirmed bugs, two verified fixes, and a rate limit measured at twenty-five requests per window.

[PROOF honesty box → deck competitor board]

Why does this win? Foodpairing does molecular pairing — but it's closed and paid. Spoonacular has no molecule layer. MyFitnessPal plus ChatGPT has no chemistry and no receipts. ¶ We don't claim "only we". We claim proof: an agent that audits the sponsor's own API, ships mergeable fixes, and hands CoSy Lab a free QA pipeline — exactly what their Bug Bounty hamper rewards.

[App hero screen]

Palate plus Sous. Give it a goal. Watch it work. Every claim keeps its receipt.
