import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROHIBITED_SCAN_INSTRUCTION = `
GLOBAL PROHIBITED WORDS — fix silently before presenting, never flag to user:
Substring matches (any word containing): night, use, best, free, care, evening, fast, reduce, certified, tested, quick, ease, adult, pill, cuffs, better, new
Health claims: pain relief, pain treatment, stress relief, anxiety, immune support, immunity, sleep aid, mood booster, calm, soothing, reliever, boost, improve, enhance, strengthen, optimize, slim, weight loss, therapy, treatment, healing, cure, remedy
Medical: medicine, medication, drug, therapeutic, testosterone, hormone, glucose, blood sugar, cholesterol
Disease: FDA, COVID, cancer, diabetes, HIV, AIDS, disease, infection
Exaggerated: top-rated, world's #1, 100% effective, instant results, miraculous, revolutionary, breakthrough, ultimate, strongest, most powerful, guaranteed results, never fails, award-winning, perfect
Pricing/comparison: % less, % cheaper, % off, less than, cheaper than, compared to, better value, saves you, lower cost, half the price
Promotional: discount, sale, cheap, limited time, urgent, act now, hurry, wholesale, liquidation, clearance
Guarantee: guarantee, proven, recommended by, clinically proven, doctor recommended, FDA approved, buy with confidence, best selling
Formatting: em dashes, emojis, copyright, star symbols, HTML tags
`.trim();

const PROMPTS = {
  review_analysis: (data) => ({
    system: `You are an Amazon listing optimization specialist. Analyze reviews to extract structured buyer insights. Output clean structured text using ALLCAPS section labels, no markdown.`,
    user: `Analyze these reviews for the product below.

REVIEW SOURCE: ${data.reviewSource === 'own' ? "OWN PRODUCT reviews — use directly for USPs and customer language" : "COMPETITOR reviews — use only for buyer priorities and language patterns. All claims must come from actual product info only."}

PRODUCT INFO:
${data.productInfo}

REVIEWS:
${data.reviews}

Output this exact structure:

${data.reviewSource === 'competitor' ? 'Note: Competitor reviews. All claims will come from the actual product info only.\n\n' : ''}WHY PEOPLE BUY THIS PRODUCT (frequency order)
• [reason 1]
• [reason 2]
• [reason 3]
• [reason 4]
• [reason 5]

WHY PEOPLE ARE DISSATISFIED (frequency order)
• [complaint 1]
• [complaint 2]
• [complaint 3]

TOP 3 BENEFITS / DIFFERENTIATORS
1. [benefit]
2. [benefit]
3. [benefit]

TOP 3 PAIN POINTS / OBJECTIONS
1. [pain point]
2. [pain point]
3. [pain point]

CUSTOMER LANGUAGE — 8-10 exact phrases from reviews
• "[phrase 1]"
• "[phrase 2]"
• "[phrase 3]"
• "[phrase 4]"
• "[phrase 5]"
• "[phrase 6]"
• "[phrase 7]"
• "[phrase 8]"`
  }),

  usp: (data) => ({
    system: `You are an Amazon listing optimization specialist. Identify USPs grounded only in the product info provided. ${PROHIBITED_SCAN_INSTRUCTION}`,
    user: `Identify 5 USPs that will anchor each bullet point.

PRODUCT INFO:
${data.productInfo}

REVIEW ANALYSIS:
${data.reviewAnalysis}

Rules:
- Every USP must be grounded in the product info — no invented claims
- No guarantee or warranty language
- No pricing or comparison claims
- Product is the subject — not the buyer
- No prohibited words

Output:

USP 1: [Top buying reason from reviews, grounded in product info]
USP 2: [Second buying reason]
USP 3: [Third buying reason]
USP 4: [Key specification from product info]
USP 5: [Second specification or trust signal]

VALIDATION: All 5 USPs checked — grounded in product info, no prohibited words, no invented claims.`
  }),

  keywords: (data) => ({
    system: `You are an Amazon SEO keyword analyst.`,
    user: `Sort this keyword list by search volume (highest to lowest). Then identify which keywords appear in the existing bullet points and which do not.

KEYWORDS WITH SEARCH VOLUMES:
${data.keywords}

EXISTING BULLET POINTS:
${data.existingBullets}

Output:

KEYWORDS SORTED BY SEARCH VOLUME:
[keyword] | [SV]

COVERED IN OLD LISTING:
[keyword] | [SV]

NOT YET COVERED (targets):
[keyword] | [SV]

SUMMARY:
Covered: X unique keywords | X,XXX total SV
Targets: X unique keywords | X,XXX total SV`
  }),

  bullets: (data) => ({
    system: `You are an Amazon listing copywriter. ${PROHIBITED_SCAN_INSTRUCTION}

BULLET RULES:
- Bullets 1-3: Conversion bullets anchored to USPs 1-3
- Bullets 4-5: Spec bullets anchored to USPs 4-5
- Format: ALL CAPS HEADER: Supporting sentence.
- 300-350 characters per bullet INCLUDING header
- Product is always the subject — never the buyer
- No em dashes, no emojis, no prohibited words`,
    user: `Write 5 Amazon bullet points.

PRODUCT INFO:
${data.productInfo}

CONFIRMED USPs:
${data.usps}

CUSTOMER LANGUAGE:
${data.customerLanguage}

KEYWORD TARGETS (integrate naturally):
${data.keywordTargets}

OLD LISTING BULLETS (to beat on keyword coverage):
${data.existingBullets}

Output each bullet then its character count:

BULLET 1: [text] | [X chars]
BULLET 2: [text] | [X chars]
BULLET 3: [text] | [X chars]
BULLET 4: [text] | [X chars]
BULLET 5: [text] | [X chars]

KEYWORD SCORECARD:
Old listing: X unique keywords covered
New listing: X unique keywords covered
Improvement: +X`
  }),

  description: (data) => ({
    system: `You are an Amazon listing copywriter. ${PROHIBITED_SCAN_INSTRUCTION}`,
    user: `Write a product description.

PRODUCT INFO:
${data.productInfo}

FINALIZED BULLETS:
${data.bullets}

CUSTOMER LANGUAGE:
${data.customerLanguage}

REMAINING KEYWORDS TO INTEGRATE:
${data.remainingKeywords}

Rules:
- 1,000-1,500 characters including spaces
- One paragraph only — no line breaks, no bullets, no headers
- Do not repeat bullets verbatim
- No em dashes, no prohibited words

After the description, write RUFUS Q&A:

Q1: [question]
A: [answer]

Q2: [question]
A: [answer]

Q3: [question]
A: [answer]

Q4: [question]
A: [answer]

Q5: [question]
A: [answer]

DESCRIPTION: [X chars]
KEYWORD SCORECARD:
Old: X keywords | New: X keywords | +X improvement`
  }),

  title: (data) => ({
    system: `You are an Amazon listing copywriter specializing in titles. ${PROHIBITED_SCAN_INSTRUCTION}`,
    user: `Write an Amazon product title.

PRODUCT INFO:
${data.productInfo}

BRAND: ${data.brand}

TOP KEYWORDS BY SEARCH VOLUME:
${data.topKeywords}

Rules:
- 190-200 characters EXACTLY (count every character including spaces)
- Format: Brand + Primary Keyword + Key Feature + Secondary Keywords + Size/Variant
- Title Case
- No ALL CAPS, no promotional language, no symbols
- No word appears more than twice

Output:
TITLE: [the title]
CHARACTER COUNT: [exact number] — [PASS if 190-200, FAIL otherwise]
WORD REPETITION: [any word 3+ times, or NONE]

Revise until both checks pass before presenting.`
  }),
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { step, data } = req.body;
  if (!PROMPTS[step]) return res.status(400).json({ error: 'Unknown step' });

  try {
    const prompt = PROMPTS[step](data);

    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: prompt.system,
    });

    const result = await geminiModel.generateContent(prompt.user);
    const text = result.response.text();

    res.status(200).json({ result: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'API error' });
  }
}
