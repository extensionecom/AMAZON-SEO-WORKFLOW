const PROHIBITED = `PROHIBITED WORDS — fix silently, never flag:
Substring matches: night, use, best, free, care, evening, fast, reduce, certified, tested, quick, ease, adult, pill, cuffs, better, new
Health: pain relief, stress relief, anxiety, immune support, sleep aid, mood booster, calm, soothing, boost, improve, enhance, strengthen, optimize, slim, weight loss, therapy, treatment, healing, cure, remedy
Medical: medicine, medication, drug, therapeutic, testosterone, hormone, glucose, blood sugar, cholesterol
Disease: FDA, COVID, cancer, diabetes, HIV, disease, infection
Exaggerated: top-rated, world's #1, 100% effective, miraculous, revolutionary, breakthrough, ultimate, strongest, most powerful, guaranteed results, award-winning, perfect
Pricing: % less, % cheaper, % off, less than, cheaper than, compared to, better value, saves you, lower cost
Promotional: discount, sale, cheap, limited time, urgent, act now, hurry
Guarantee: guarantee, proven, recommended by, clinically proven, doctor recommended, FDA approved
Formatting: em dashes, emojis, HTML tags`;

const PROMPTS = {
  review_analysis: (d) => `You are an Amazon listing specialist. Analyze reviews and output structured buyer insights using ALLCAPS labels, no markdown.

REVIEW SOURCE: ${d.reviewSource === 'own' ? 'OWN PRODUCT' : 'COMPETITOR — use only for language patterns, not claims'}
PRODUCT INFO: ${d.productInfo}
REVIEWS: ${d.reviews}

Output exactly:
${d.reviewSource === 'competitor' ? 'Note: Competitor reviews. All claims from product info only.\n\n' : ''}WHY PEOPLE BUY THIS PRODUCT (frequency order)
• [reason 1-5]

WHY PEOPLE ARE DISSATISFIED
• [complaint 1-3]

TOP 3 BENEFITS / DIFFERENTIATORS
1-3. [benefit]

TOP 3 PAIN POINTS / OBJECTIONS
1-3. [pain point]

CUSTOMER LANGUAGE — 8-10 exact phrases
• "[phrase]"`,

  usp: (d) => `Amazon listing specialist. Identify 5 USPs from product info only. ${PROHIBITED}

PRODUCT INFO: ${d.productInfo}
REVIEW ANALYSIS: ${d.reviewAnalysis}

Rules: grounded in product info only, no invented claims, product is subject not buyer, no prohibited words.

USP 1: [top buying reason grounded in product info]
USP 2: [second buying reason]
USP 3: [third buying reason]
USP 4: [key specification]
USP 5: [second specification or trust signal]
VALIDATION: All checked — grounded in product info, no prohibited words.`,

  keywords: (d) => `Amazon SEO analyst. Sort keywords by search volume, identify coverage gaps.

KEYWORDS: ${d.keywords}
EXISTING BULLETS: ${d.existingBullets}

KEYWORDS SORTED BY SEARCH VOLUME:
[keyword] | [SV]

COVERED IN OLD LISTING:
[keyword] | [SV]

NOT YET COVERED (targets):
[keyword] | [SV]

SUMMARY:
Covered: X unique | X,XXX SV
Targets: X unique | X,XXX SV`,

  bullets: (d) => `Amazon copywriter. Write 5 bullets. ${PROHIBITED}

Rules: Bullets 1-3 conversion (USPs 1-3), 4-5 spec (USPs 4-5). Format: ALL CAPS HEADER: Sentence. 300-350 chars each including header. Product is subject, never buyer. No em dashes.

PRODUCT INFO: ${d.productInfo}
USPs: ${d.usps}
CUSTOMER LANGUAGE: ${d.customerLanguage}
KEYWORD TARGETS: ${d.keywordTargets}
OLD BULLETS: ${d.existingBullets}

BULLET 1: [text] | [X chars]
BULLET 2: [text] | [X chars]
BULLET 3: [text] | [X chars]
BULLET 4: [text] | [X chars]
BULLET 5: [text] | [X chars]

KEYWORD SCORECARD:
Old listing: X keywords
New listing: X keywords
Improvement: +X`,

  description: (d) => `Amazon copywriter. ${PROHIBITED}

Write a 1000-1500 char product description. One paragraph, no line breaks, no bullets. Rephrase bullets, don't repeat verbatim. No em dashes.

PRODUCT INFO: ${d.productInfo}
BULLETS: ${d.bullets}
CUSTOMER LANGUAGE: ${d.customerLanguage}
REMAINING KEYWORDS: ${d.remainingKeywords}

After description, write RUFUS Q&A:
Q1: [question]
A: [answer from product info]
(repeat Q2-Q5)

DESCRIPTION: [X chars]
KEYWORD SCORECARD: Old: X | New: X | +X improvement`,

  title: (d) => `Amazon title specialist. ${PROHIBITED}

Write a 190-200 char title. Format: Brand + Primary Keyword + Key Feature + Secondary Keywords + Size/Variant. Title Case. No ALL CAPS, no symbols, no word repeated more than twice.

PRODUCT INFO: ${d.productInfo}
BRAND: ${d.brand}
TOP KEYWORDS: ${d.topKeywords}

TITLE: [title]
CHARACTER COUNT: [number] — [PASS/FAIL]
WORD REPETITION: [issues or NONE]

Revise until 190-200 chars and no word over 2x.`,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { step, data } = req.body;
  if (!PROMPTS[step]) return res.status(400).json({ error: 'Unknown step' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

  const prompt = PROMPTS[step](data);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini error:', err);
      return res.status(500).json({ error: `Gemini API error: ${response.status}` });
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.status(200).json({ result: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
