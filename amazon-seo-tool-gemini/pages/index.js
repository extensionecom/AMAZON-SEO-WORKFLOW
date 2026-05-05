import { useState, useCallback } from 'react';
import Head from 'next/head';

// ─── helpers ────────────────────────────────────────────────────────────────

function charBadge(n, min, max) {
  const cls = n >= min && n <= max ? 'good' : n > max ? 'bad' : 'warn';
  const icon = cls === 'good' ? '✓' : cls === 'bad' ? '✗' : '~';
  return <span className={`char-badge ${cls}`}>{icon} {n} chars</span>;
}

async function callAPI(step, data) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step, data }),
  });
  if (!res.ok) throw new Error('API error');
  const json = await res.json();
  return json.result;
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function EditableOutput({ value, onChange, mono = false }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <div>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ minHeight: 180, fontFamily: mono ? 'var(--mono)' : 'var(--sans)', fontSize: 13 }}
        />
        <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 13 }} onClick={() => setEditing(false)}>Done editing</button>
      </div>
    );
  }
  return (
    <div className="editable-output">
      <div className={mono ? 'output-mono' : 'output-text'}>{value}</div>
      <div className="edit-overlay">
        <button className="edit-btn" onClick={() => setEditing(true)}>Edit</button>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Product Intake' },
  { num: 2, label: 'Review Analysis' },
  { num: 3, label: 'USP Identification' },
  { num: 4, label: 'Keyword Gap' },
  { num: 5, label: 'Bullet Points' },
  { num: 6, label: 'Description + RUFUS' },
  { num: 7, label: 'Title' },
  { num: 8, label: 'Final Output' },
];

function Sidebar({ currentStep, completedSteps, onNav }) {
  const progress = Math.round(((currentStep - 1) / 7) * 100);
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="brand">Extension eCom</div>
        <h1>Amazon SEO<br />Listing Tool</h1>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <nav className="step-nav">
        {STEPS.map(s => {
          const done = completedSteps.includes(s.num);
          const active = currentStep === s.num;
          const locked = s.num > currentStep && !done;
          return (
            <div
              key={s.num}
              className={`step-nav-item ${active ? 'active' : ''} ${done ? 'completed' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => !locked && onNav(s.num)}
            >
              <div className="step-num">
                {done ? '✓' : s.num}
              </div>
              <div className="step-nav-label">
                <span className="num-label">Step {s.num}</span>
                <span className="title-label">{s.label}</span>
              </div>
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        Amazon SEO Master Prompt v2
      </div>
    </aside>
  );
}

// ─── Step 1: Intake ───────────────────────────────────────────────────────────

function StepIntake({ onComplete }) {
  const [form, setForm] = useState({
    productName: '', asin: '', productInfo: '',
    existingBullets: '', reviewSource: 'own', reviews: '',
    keywords: '', rufusQA: '', brand: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const canProceed = form.productName && form.productInfo && form.existingBullets && form.reviews && form.keywords;

  return (
    <div>
      <div className="step-header">
        <div className="step-tag">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} />
          Step 1 of 7
        </div>
        <h2>Product Intake</h2>
        <p>Provide all product details before running the optimization flow.</p>
      </div>

      <div className="card">
        <div className="card-title">Product Identification</div>
        <div className="form-grid-2">
          <div className="form-row">
            <label>Product Name <span className="required">*</span></label>
            <input type="text" placeholder="e.g. Sidewinder Revolution Stand" value={form.productName} onChange={e => set('productName', e.target.value)} />
          </div>
          <div className="form-row">
            <label>ASIN</label>
            <input type="text" placeholder="e.g. B08XYZ123" value={form.asin} onChange={e => set('asin', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <label>Brand <span className="required">*</span></label>
          <input type="text" placeholder="Brand name as it appears on the product page" value={form.brand} onChange={e => set('brand', e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Product Information <span className="required">*</span></div>
        <div className="form-row">
          <textarea
            style={{ minHeight: 160 }}
            placeholder={`Include:\n• Compatible models / fit (exact model numbers)\n• Materials and construction\n• Certifications (NSF, BPA, UL, etc.)\n• Capacity, dimensions, specs\n• What's in the box\n• Any brand names explicitly stated on the product page`}
            value={form.productInfo}
            onChange={e => set('productInfo', e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Existing Bullet Points <span className="required">*</span></div>
        <div className="form-row">
          <textarea
            style={{ minHeight: 140 }}
            placeholder="Paste the current live listing bullet points here"
            value={form.existingBullets}
            onChange={e => set('existingBullets', e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Reviews <span className="required">*</span></div>
        <div className="form-row">
          <label>Review Source</label>
          <div className="toggle-group">
            <button className={`toggle-btn ${form.reviewSource === 'own' ? 'selected' : ''}`} onClick={() => set('reviewSource', 'own')}>
              Own Product Reviews
            </button>
            <button className={`toggle-btn ${form.reviewSource === 'competitor' ? 'selected' : ''}`} onClick={() => set('reviewSource', 'competitor')}>
              Competitor Reviews
            </button>
          </div>
          {form.reviewSource === 'competitor' && (
            <p className="hint">Competitor reviews will only be used for buyer language patterns. All claims will come from the actual product info.</p>
          )}
        </div>
        <div className="form-row">
          <textarea
            style={{ minHeight: 160 }}
            placeholder="Paste reviews here — can be raw text from Helium 10 Review Insights, copy-pasted reviews, etc."
            value={form.reviews}
            onChange={e => set('reviews', e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Keyword List <span className="required">*</span></div>
        <div className="form-row">
          <textarea
            style={{ minHeight: 120 }}
            placeholder={`Paste keywords with search volumes, one per line:\ncolored pencils 392000\ncolored pencils for adults 94000\n...`}
            value={form.keywords}
            onChange={e => set('keywords', e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">RUFUS Q&A <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
        <div className="form-row">
          <textarea
            placeholder="Paste existing RUFUS Q&A if available — will be rewritten using finalized copy"
            value={form.rufusQA}
            onChange={e => set('rufusQA', e.target.value)}
          />
        </div>
      </div>

      {!canProceed && (
        <div className="alert alert-warn">
          <span>⚠</span>
          <span>Product name, product info, existing bullets, reviews, and keywords are required to continue.</span>
        </div>
      )}

      <div className="btn-row">
        <button
          className="btn btn-primary"
          disabled={!canProceed}
          onClick={() => onComplete(form)}
        >
          Got everything. Start the flow →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Review Analysis ──────────────────────────────────────────────────

function StepReviewAnalysis({ intakeData, onComplete }) {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const r = await callAPI('review_analysis', {
        productInfo: intakeData.productInfo,
        reviews: intakeData.reviews,
        reviewSource: intakeData.reviewSource,
      });
      setResult(r);
      setRan(true);
    } catch (e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="step-header">
        <div className="step-tag"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} /> Step 2 of 7</div>
        <h2>Review Analysis</h2>
        <p>Extract buyer insights, pain points, and customer language from the reviews.</p>
      </div>

      {intakeData.reviewSource === 'competitor' && (
        <div className="alert alert-warn">
          <span>⚠</span>
          <span>Competitor reviews — insights will be used for buyer language only. All copy claims come from product info.</span>
        </div>
      )}

      {!ran && (
        <div className="card">
          <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>
            Ready to analyze <strong style={{ color: 'var(--text)' }}>{intakeData.reviews.split('\n').length} lines</strong> of reviews for <strong style={{ color: 'var(--text)' }}>{intakeData.productName}</strong>.
          </p>
          <button className="btn btn-primary" onClick={run}>Run Review Analysis</button>
        </div>
      )}

      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <div className="loading-text">Analyzing reviews...</div>
        </div>
      )}

      {ran && !loading && (
        <div>
          <div className="output-block">
            <div className="output-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Review Analysis <CopyBtn text={result} />
            </div>
            <EditableOutput value={result} onChange={setResult} />
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={run}>Re-run</button>
            <button className="btn btn-success" onClick={() => onComplete(result)}>Approve &amp; Continue →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: USPs ─────────────────────────────────────────────────────────────

function StepUSP({ intakeData, reviewAnalysis, onComplete }) {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const r = await callAPI('usp', {
        productInfo: intakeData.productInfo,
        reviewAnalysis,
      });
      setResult(r);
      setRan(true);
    } catch (e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="step-header">
        <div className="step-tag"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} /> Step 3 of 7</div>
        <h2>USP Identification</h2>
        <p>Define the 5 unique selling points that will anchor each bullet point.</p>
      </div>

      {!ran && (
        <div className="card">
          <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>Generating 5 validated USPs from the review analysis and product info.</p>
          <button className="btn btn-primary" onClick={run}>Generate USPs</button>
        </div>
      )}

      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <div className="loading-text">Identifying USPs...</div>
        </div>
      )}

      {ran && !loading && (
        <div>
          <div className="output-block">
            <div className="output-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              5 Validated USPs <CopyBtn text={result} />
            </div>
            <EditableOutput value={result} onChange={setResult} />
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={run}>Re-run</button>
            <button className="btn btn-success" onClick={() => onComplete(result)}>Approve &amp; Continue →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Keyword Gap ──────────────────────────────────────────────────────

function StepKeywords({ intakeData, onComplete }) {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const r = await callAPI('keywords', {
        keywords: intakeData.keywords,
        existingBullets: intakeData.existingBullets,
      });
      setResult(r);
      setRan(true);
    } catch (e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  // Extract target keywords from result for passing forward
  const getTargets = () => {
    const lines = result.split('\n');
    const startIdx = lines.findIndex(l => l.includes('NOT YET COVERED'));
    const endIdx = lines.findIndex((l, i) => i > startIdx && l.trim() === '');
    if (startIdx === -1) return result;
    const targets = lines.slice(startIdx + 1, endIdx === -1 ? undefined : endIdx).filter(l => l.trim());
    return targets.join('\n');
  };

  return (
    <div>
      <div className="step-header">
        <div className="step-tag"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} /> Step 4 of 7</div>
        <h2>Keyword Gap Analysis</h2>
        <p>Sort keywords by search volume and identify what the old listing is missing.</p>
      </div>

      {!ran && (
        <div className="card">
          <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>Analyzing keyword coverage across the existing bullets.</p>
          <button className="btn btn-primary" onClick={run}>Run Keyword Analysis</button>
        </div>
      )}

      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <div className="loading-text">Sorting keywords...</div>
        </div>
      )}

      {ran && !loading && (
        <div>
          <div className="output-block">
            <div className="output-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Keyword Gap Report <CopyBtn text={result} />
            </div>
            <EditableOutput value={result} onChange={setResult} mono />
          </div>
          <div className="alert alert-info">
            <span>ℹ</span>
            <span>Keywords must emerge naturally from the copy. They will be integrated in the next step — never forced.</span>
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={run}>Re-run</button>
            <button className="btn btn-success" onClick={() => onComplete({ full: result, targets: getTargets() })}>Approve &amp; Continue →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Bullets ──────────────────────────────────────────────────────────

function StepBullets({ intakeData, usps, keywordData, reviewAnalysis, onComplete }) {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  // Extract customer language section from review analysis
  const getCustomerLanguage = () => {
    const lines = reviewAnalysis.split('\n');
    const idx = lines.findIndex(l => l.includes('CUSTOMER LANGUAGE'));
    if (idx === -1) return reviewAnalysis;
    return lines.slice(idx).join('\n');
  };

  const run = async () => {
    setLoading(true);
    try {
      const r = await callAPI('bullets', {
        productInfo: intakeData.productInfo,
        usps,
        customerLanguage: getCustomerLanguage(),
        keywordTargets: keywordData.targets,
        existingBullets: intakeData.existingBullets,
      });
      setResult(r);
      setRan(true);
    } catch (e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="step-header">
        <div className="step-tag"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} /> Step 5 of 7</div>
        <h2>Bullet Points</h2>
        <p>5 bullets — 3 conversion (USPs 1-3) + 2 spec (USPs 4-5). 300-350 characters each.</p>
      </div>

      {!ran && (
        <div className="card">
          <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>Writing 5 bullets with keyword integration and compliance validation.</p>
          <button className="btn btn-primary" onClick={run}>Generate Bullets</button>
        </div>
      )}

      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <div className="loading-text">Writing bullets...</div>
        </div>
      )}

      {ran && !loading && (
        <div>
          <div className="output-block">
            <div className="output-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              5 Bullet Points <CopyBtn text={result} />
            </div>
            <EditableOutput value={result} onChange={setResult} />
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={run}>Re-run</button>
            <button className="btn btn-success" onClick={() => onComplete(result)}>Approve &amp; Continue →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 6: Description + RUFUS ─────────────────────────────────────────────

function StepDescription({ intakeData, bullets, reviewAnalysis, keywordData, onComplete }) {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const getCustomerLanguage = () => {
    const lines = reviewAnalysis.split('\n');
    const idx = lines.findIndex(l => l.includes('CUSTOMER LANGUAGE'));
    if (idx === -1) return '';
    return lines.slice(idx).join('\n');
  };

  const run = async () => {
    setLoading(true);
    try {
      const r = await callAPI('description', {
        productInfo: intakeData.productInfo,
        bullets,
        customerLanguage: getCustomerLanguage(),
        remainingKeywords: keywordData.targets,
      });
      setResult(r);
      setRan(true);
    } catch (e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="step-header">
        <div className="step-tag"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} /> Step 6 of 7</div>
        <h2>Description + RUFUS Q&A</h2>
        <p>1,000-1,500 character description (one paragraph) + 5 RUFUS Q&A pairs.</p>
      </div>

      {!ran && (
        <div className="card">
          <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>Writing description expanding on bullets, integrating remaining keywords. RUFUS Q&A drafting or rewriting from product info.</p>
          <button className="btn btn-primary" onClick={run}>Generate Description + RUFUS</button>
        </div>
      )}

      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <div className="loading-text">Writing description...</div>
        </div>
      )}

      {ran && !loading && (
        <div>
          <div className="output-block">
            <div className="output-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Description + RUFUS Q&A <CopyBtn text={result} />
            </div>
            <EditableOutput value={result} onChange={setResult} />
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={run}>Re-run</button>
            <button className="btn btn-success" onClick={() => onComplete(result)}>Approve &amp; Continue →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 7: Title ────────────────────────────────────────────────────────────

function StepTitle({ intakeData, keywordData, onComplete }) {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const getTopKeywords = () => {
    const lines = keywordData.full.split('\n');
    const startIdx = lines.findIndex(l => l.includes('KEYWORDS SORTED BY SEARCH VOLUME'));
    if (startIdx === -1) return keywordData.full;
    return lines.slice(startIdx + 1, startIdx + 16).join('\n');
  };

  const run = async () => {
    setLoading(true);
    try {
      const r = await callAPI('title', {
        productInfo: intakeData.productInfo,
        brand: intakeData.brand,
        topKeywords: getTopKeywords(),
      });
      setResult(r);
      setRan(true);
    } catch (e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  // Parse title and char count from result
  const parsedTitle = (() => {
    const m = result.match(/TITLE:\s*(.+?)(?:\n|CHARACTER COUNT)/s);
    return m ? m[1].trim() : '';
  })();

  const parsedCount = (() => {
    const m = result.match(/CHARACTER COUNT:\s*(\d+)/);
    return m ? parseInt(m[1]) : null;
  })();

  return (
    <div>
      <div className="step-header">
        <div className="step-tag"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} /> Step 7 of 7</div>
        <h2>Product Title</h2>
        <p>190-200 characters. Title Case. No word repeated more than twice.</p>
      </div>

      {!ran && (
        <div className="card">
          <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>Generating a compliant title optimized with top keywords. Character count will be verified before presenting.</p>
          <button className="btn btn-primary" onClick={run}>Generate Title</button>
        </div>
      )}

      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <div className="loading-text">Writing title...</div>
        </div>
      )}

      {ran && !loading && (
        <div>
          {parsedTitle && (
            <div className="output-block highlight">
              <div className="output-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Title</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {parsedCount && charBadge(parsedCount, 190, 200)}
                  <CopyBtn text={parsedTitle} />
                </div>
              </div>
              <div className="output-text" style={{ fontSize: 15, lineHeight: 1.5 }}>{parsedTitle}</div>
            </div>
          )}
          <div className="output-block">
            <div className="output-label">Full Validation Output</div>
            <div className="output-mono">{result}</div>
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={run}>Re-run</button>
            <button className="btn btn-success" onClick={() => onComplete(result, parsedTitle)}>Approve &amp; Generate Final Output →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 8: Final Output ─────────────────────────────────────────────────────

function StepFinalOutput({ intakeData, outputs }) {
  const { reviewAnalysis, usps, keywordData, bullets, description, titleFull, titleText } = outputs;

  const fullListing = `TITLE:
${titleText}

BULLET POINTS:
${bullets}

DESCRIPTION:
${description}

RUFUS Q&A:
[See description output above]`;

  return (
    <div>
      <div className="step-header">
        <div className="step-tag"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-light)', display: 'inline-block' }} /> Complete</div>
        <h2>Final Output</h2>
        <p>All listing copy ready to publish. Copy each section individually or grab everything at once.</p>
      </div>

      <div className="btn-row" style={{ marginBottom: 24 }}>
        <CopyBtn text={fullListing} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Copy full listing</span>
      </div>

      <div className="final-section">
        <div className="final-section-title">
          Title
          <CopyBtn text={titleText} />
        </div>
        <div className="output-block highlight">
          <div className="output-text">{titleText}</div>
        </div>
      </div>

      <div className="final-section">
        <div className="final-section-title">
          Bullet Points
          <CopyBtn text={bullets} />
        </div>
        <div className="output-block">
          <div className="output-text">{bullets}</div>
        </div>
      </div>

      <div className="final-section">
        <div className="final-section-title">
          Description + RUFUS Q&A
          <CopyBtn text={description} />
        </div>
        <div className="output-block">
          <div className="output-text">{description}</div>
        </div>
      </div>

      <hr className="divider" />

      <div className="final-section">
        <div className="final-section-title">Backend — USPs &amp; Keyword Analysis</div>
        <div className="output-block">
          <div className="output-label">USPs</div>
          <div className="output-mono" style={{ fontSize: 12 }}>{usps}</div>
        </div>
        <div className="output-block">
          <div className="output-label">Keyword Gap Report</div>
          <div className="output-mono" style={{ fontSize: 12 }}>{keywordData.full}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [intakeData, setIntakeData] = useState(null);
  const [reviewAnalysis, setReviewAnalysis] = useState('');
  const [usps, setUsps] = useState('');
  const [keywordData, setKeywordData] = useState({ full: '', targets: '' });
  const [bullets, setBullets] = useState('');
  const [description, setDescription] = useState('');
  const [titleFull, setTitleFull] = useState('');
  const [titleText, setTitleText] = useState('');

  const complete = (step) => {
    setCompletedSteps(p => [...new Set([...p, step])]);
    setCurrentStep(step + 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepIntake onComplete={data => { setIntakeData(data); complete(1); }} />;
      case 2:
        return <StepReviewAnalysis intakeData={intakeData} onComplete={r => { setReviewAnalysis(r); complete(2); }} />;
      case 3:
        return <StepUSP intakeData={intakeData} reviewAnalysis={reviewAnalysis} onComplete={r => { setUsps(r); complete(3); }} />;
      case 4:
        return <StepKeywords intakeData={intakeData} onComplete={r => { setKeywordData(r); complete(4); }} />;
      case 5:
        return <StepBullets intakeData={intakeData} usps={usps} keywordData={keywordData} reviewAnalysis={reviewAnalysis} onComplete={r => { setBullets(r); complete(5); }} />;
      case 6:
        return <StepDescription intakeData={intakeData} bullets={bullets} reviewAnalysis={reviewAnalysis} keywordData={keywordData} onComplete={r => { setDescription(r); complete(6); }} />;
      case 7:
        return <StepTitle intakeData={intakeData} keywordData={keywordData} onComplete={(full, text) => { setTitleFull(full); setTitleText(text); complete(7); }} />;
      case 8:
        return <StepFinalOutput intakeData={intakeData} outputs={{ reviewAnalysis, usps, keywordData, bullets, description, titleFull, titleText }} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Amazon SEO Listing Tool — Extension eCom</title>
        <meta name="description" content="Amazon listing optimization with AI — 7-step flow from intake to final copy" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%231B3A2D'/><text x='8' y='23' font-size='18' fill='%23D46B1F'>S</text></svg>" />
      </Head>
      <div className="app-layout">
        <Sidebar
          currentStep={currentStep}
          completedSteps={completedSteps}
          onNav={setCurrentStep}
        />
        <main className="main-content">
          {renderStep()}
        </main>
      </div>
    </>
  );
}
