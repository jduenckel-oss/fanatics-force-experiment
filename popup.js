// ── Known Fanatics-managed domains ────────────────────────────────────────────
const FANATICS_DOMAINS = [
  'fanatics.com', 'fanatics.co.uk', 'fanatics.ca', 'fanatics.fr',
  'fanatics.de', 'fanatics.it', 'fanatics.jp', 'fanatics.es', 'fanatics.mx',
  'fanatics.co.kr', 'fanatics-intl.com', 'fansedge.com', 'fanoutfitters.com',
  'mlbshop.com', 'mlbshop.ca', 'mlbshopeurope.com', 'mlbshop.jp',
  'nflshop.com', 'nflshop.ca', 'nflshop.com.au',
  'nbastore.com', 'nbastore.ca', 'nbastore.eu', 'nbastore.jp', 'nbastore.com.au',
  'nhl.com', 'nhlshop.ca',
  'mlsstore.com', 'mlsstore.ca',
  'lids.com', 'lids.ca',
  'mitchellandness.com', 'mitchellandness.eu', 'mitchellandness.co.uk',
  'kitbag.com', 'kitbag-us.com',
  'ufcstore.com', 'ufcstore.eu',
  'wwe.com', 'wweshop.ca',
  'nascar.com', 'formula1.com', 'motogp.com',
  'teamfanshop.com',
  'spirit.bncollege.com', 'shoptruespirit.com',
  'frgapps.com',
];

function isFanaticsDomain(hostname) {
  return FANATICS_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
}

function getFriendlyLabel(hostname) {
  if (hostname.includes('mlbshop'))         return 'MLB Shop';
  if (hostname.includes('nflshop'))         return 'NFL Shop';
  if (hostname.includes('nbastore') || hostname.startsWith('store.nba')) return 'NBA Store';
  if (hostname.includes('nhl.com') || hostname.includes('nhlshop')) return 'NHL Shop';
  if (hostname.includes('mlsstore'))        return 'MLS Store';
  if (hostname.includes('lids'))            return 'Lids';
  if (hostname.includes('fansedge'))        return 'FansEdge';
  if (hostname.includes('mitchellandness')) return 'Mitchell & Ness';
  if (hostname.includes('kitbag'))          return 'Kitbag';
  if (hostname.includes('ufcstore'))        return 'UFC Store';
  if (hostname.includes('wwe'))             return 'WWE Shop';
  if (hostname.includes('nascar'))          return 'NASCAR Store';
  if (hostname.includes('formula1'))        return 'F1 Store';
  if (hostname.includes('motogp'))          return 'MotoGP Store';
  if (hostname.includes('bncollege') || hostname.includes('shoptruespirit')) return hostname;
  if (hostname.includes('fanatics'))        return hostname.replace('www.', '');
  return hostname;
}

// ── Variant colours (for dynamic buttons) ────────────────────────────────────
const VARIANT_COLORS = {
  A: { bg: '#002D72', text: '#fff', copyBg: '#E8EDF7', copyText: '#002D72', border: '#002D72' },
  B: { bg: '#CC0000', text: '#fff', copyBg: '#FDECEA', copyText: '#CC0000', border: '#CC0000' },
  C: { bg: '#2E7D32', text: '#fff', copyBg: '#E8F5E9', copyText: '#2E7D32', border: '#2E7D32' },
  D: { bg: '#6A1B9A', text: '#fff', copyBg: '#F3E5F5', copyText: '#6A1B9A', border: '#6A1B9A' },
};
const VARIANTS = ['A', 'B', 'C', 'D'];


// ── Main ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const expIdInput       = document.getElementById('expId');
  const statusEl         = document.getElementById('status');
  const recentListEl     = document.getElementById('recentList');
  const pinnedListEl     = document.getElementById('pinnedList');
  const pinnedSection    = document.getElementById('pinnedSection');
  const clearBtn         = document.getElementById('clearRecent');
  const detectedBadge    = document.getElementById('detectedBadge');
  const detectedText     = document.getElementById('detectedText');
  const quickClearBtn    = document.getElementById('quickClearBtn');
  const siteCurrentRow   = document.getElementById('siteCurrentRow');
  const siteCurrentLabel = document.getElementById('siteCurrentLabel');
  const siteChangeBtn    = document.getElementById('siteChangeBtn');
  const sitePicker       = document.getElementById('sitePicker');
  const variantGrid      = document.getElementById('variantGrid');
  const copyModeToggle   = document.getElementById('copyModeToggle');
  const stackToggle      = document.getElementById('stackToggle');
  const stackedRowsEl    = document.getElementById('stackedRows');

  // Stacked experiments state: [{expId, variant}]
  let stackedExps = [];

  // ── Load storage ────────────────────────────────────────────────────────────
  const stored = await chrome.storage.local.get([
    'lastExpId', 'recentExps', 'pinnedExps', 'expNotes', 'lastSiteUrl',
    'jiraEmail', 'jiraToken'
  ]);
  let recentExps  = stored.recentExps  || [];
  let pinnedExps  = stored.pinnedExps  || [];
  let expNotes    = stored.expNotes    || {};
  let copyMode    = false;

  if (stored.lastExpId) expIdInput.value = stored.lastExpId;

  // ── Settings panel ──────────────────────────────────────────────────────────
  const settingsBtn      = document.getElementById('settingsBtn');
  const settingsPanel    = document.getElementById('settingsPanel');
  const settingsCloseBtn = document.getElementById('settingsCloseBtn');
  const settingsSaveBtn  = document.getElementById('settingsSaveBtn');
  const settingsStatus   = document.getElementById('settingsStatus');
  const jiraEmailInput   = document.getElementById('jiraEmail');
  const jiraTokenInput   = document.getElementById('jiraToken');

  // Pre-fill saved credentials
  if (stored.jiraEmail) jiraEmailInput.value = stored.jiraEmail;
  if (stored.jiraToken) jiraTokenInput.value = stored.jiraToken;

  settingsBtn.addEventListener('click', () => {
    const open = settingsPanel.style.display === 'none';
    settingsPanel.style.display = open ? 'block' : 'none';
    settingsBtn.classList.toggle('active', open);
  });

  settingsCloseBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
    settingsBtn.classList.remove('active');
  });

  settingsSaveBtn.addEventListener('click', async () => {
    const email = jiraEmailInput.value.trim();
    const token = jiraTokenInput.value.trim();
    if (!email || !token) {
      setSettingsStatus('Enter both email and API token.', 'err');
      return;
    }
    await chrome.storage.local.set({ jiraEmail: email, jiraToken: token });
    setSettingsStatus('✓ Saved!', 'ok');
    setTimeout(() => {
      settingsPanel.style.display = 'none';
      settingsBtn.classList.remove('active');
      loadLiveTests(true);
    }, 800);
  });

  function setSettingsStatus(msg, type) {
    settingsStatus.textContent = msg;
    settingsStatus.className = `settings-status ${type}`;
  }

  // ── Current tab ─────────────────────────────────────────────────────────────
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabUrl = tab.url || '';
  let currentHostname = '';
  try { currentHostname = new URL(tabUrl).hostname; } catch (_) {}

  const onFanaticsSite = isFanaticsDomain(currentHostname);
  const onConfluence   = tabUrl.includes('atlassian.net');

  // ── Site selector setup ─────────────────────────────────────────────────────
  if (onFanaticsSite) {
    siteCurrentLabel.textContent = getFriendlyLabel(currentHostname);
    siteCurrentRow.style.display = 'flex';
    sitePicker.style.display = 'none';
    try {
      const origin = new URL(tabUrl).origin;
      const match = [...sitePicker.options].find(o => o.value.startsWith(origin));
      if (match) match.selected = true;
    } catch (_) {}

    // Pre-fill from existing force param
    try {
      const url = new URL(tabUrl);
      const fp = url.searchParams.get('__forceExperiment');
      if (fp) {
        const experiments = fp.split(',');
        const [expId, variant] = experiments[0].split(':');
        expIdInput.value = expId;
        const label = experiments.length > 1
          ? `Forced: ${experiments.map(e => e.replace(':', ' → ')).join(' · ')}`
          : `Currently forced → Exp ${expId}, Variant ${variant || '?'}`;
        showDetected(label, true); // true = show clear button
      }
    } catch (_) {}
  } else {
    siteCurrentRow.style.display = 'none';
    sitePicker.style.display = 'block';
    if (stored.lastSiteUrl) {
      const opt = [...sitePicker.options].find(o => o.value === stored.lastSiteUrl);
      if (opt) opt.selected = true;
    }
  }

  siteChangeBtn.addEventListener('click', () => {
    siteCurrentRow.style.display = 'none';
    sitePicker.style.display = 'block';
  });

  // ── Confluence auto-detect ──────────────────────────────────────────────────
  if (onConfluence) {
    chrome.tabs.sendMessage(tab.id, { action: 'detectExpId' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (!response) return;

      if (response.expId) {
        expIdInput.value = response.expId;
        showDetected(`Detected from brief: Exp ${response.expId}`);
      } else if (response.eids && response.eids.length > 0) {
        // Multi-site test — exclude Comb (can't be forced), only site-specific EIDs
        const forceable = response.eids.filter(e => e.label.toLowerCase() !== 'comb');
        if (forceable.length === 0) return;

        const siteHint = (onFanaticsSite ? currentHostname : sitePicker.value).toLowerCase();
        const matched = pickEidForSite(forceable, siteHint);

        if (matched) {
          // Auto-filled a site match
          expIdInput.value = matched.eid;
          showMultiSiteDetected(forceable, matched.eid);
        } else {
          // No site match — show all options, let user pick
          showMultiSiteDetected(forceable, null);
        }
      }
    });
  }

  // Match a site-labelled EID list to the current site hostname/URL
  // Returns the matched item or null if no match
  function pickEidForSite(eids, siteHint) {
    const LABEL_MAP = {
      'mlb':      'mlbshop',
      'nfl':      'nflshop',
      'nba':      'nbastore',
      'nhl':      'nhl',
      'mls':      'mlsstore',
      'lids':     'lids',
      'fan':      'fanatics',
      'fanatics': 'fanatics',
      'mitchell': 'mitchellandness',
      'kitbag':   'kitbag',
      'ufc':      'ufcstore',
      'wwe':      'wwe',
    };
    for (const item of eids) {
      const key = item.label.toLowerCase();
      const mappedSite = LABEL_MAP[key];
      if (mappedSite && siteHint.includes(mappedSite)) return item;
    }
    return null; // no match — caller handles fallback
  }

  // Show multi-site EID chips in the detected badge
  function showMultiSiteDetected(eids, activeEid) {
    detectedBadge.classList.add('visible');
    quickClearBtn.style.display = 'none';

    // Build the badge content with clickable chips per site
    detectedText.innerHTML = '';

    const label = document.createElement('span');
    label.textContent = 'Multi-site — pick:';
    label.style.cssText = 'font-weight:600; margin-right:5px;';
    detectedText.appendChild(label);

    const chips = document.createElement('span');
    chips.style.cssText = 'display:flex; flex-wrap:wrap; gap:3px; margin-top:4px;';
    eids.forEach(({ label: siteLabel, eid }) => {
      const chip = document.createElement('button');
      chip.textContent = `${siteLabel} ${eid}`;
      chip.style.cssText = `
        padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 600;
        cursor: pointer; border: 1.5px solid; transition: all 0.12s;
        background: ${eid === activeEid ? '#002D72' : '#EBF5EB'};
        color: ${eid === activeEid ? '#fff' : '#276227'};
        border-color: ${eid === activeEid ? '#002D72' : '#A8D5A2'};
      `;
      chip.addEventListener('click', () => {
        expIdInput.value = eid;
        // Update chip highlight
        chips.querySelectorAll('button').forEach(b => {
          b.style.background = '#EBF5EB';
          b.style.color = '#276227';
          b.style.borderColor = '#A8D5A2';
        });
        chip.style.background = '#002D72';
        chip.style.color = '#fff';
        chip.style.borderColor = '#002D72';
      });
      chips.appendChild(chip);
    });
    detectedText.appendChild(chips);
  }

  // ── Quick clear ─────────────────────────────────────────────────────────────
  quickClearBtn.addEventListener('click', async () => {
    try {
      const url = new URL(tabUrl);
      url.searchParams.delete('__forceExperiment');
      await chrome.tabs.update(tab.id, { url: url.toString() });
      window.close();
    } catch (_) {
      showStatus('Could not clear force param.', 'error');
    }
  });

  // ── Stack experiment toggle ──────────────────────────────────────────────────
  stackToggle.addEventListener('click', () => {
    if (stackedExps.length >= 2) {
      showStatus('Max 2 stacked experiments.', 'error');
      return;
    }
    stackedExps.push({ expId: '', variant: 'B' });
    renderStackedRows();
    updateMainButtonLabels();
  });

  function renderStackedRows() {
    stackedRowsEl.innerHTML = '';
    stackedExps.forEach((exp, i) => {
      const row = document.createElement('div');
      row.className = 'stacked-row';

      // ID input
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `Exp ID #${i + 2}`;
      input.maxLength = 10;
      input.value = exp.expId;
      input.addEventListener('input', () => { stackedExps[i].expId = input.value.trim(); });

      // Variant mini-buttons (A/B/C/D)
      const varBtns = document.createElement('div');
      varBtns.className = 'stacked-variant-btns';
      VARIANTS.forEach(v => {
        const btn = document.createElement('button');
        btn.className = 'stacked-var-btn';
        btn.dataset.variant = v;
        btn.textContent = v;
        btn.title = `Set stacked exp to ${v}`;
        if (v === exp.variant) btn.classList.add('selected');
        btn.addEventListener('click', () => {
          stackedExps[i].variant = v;
          // Update selected state visually
          varBtns.querySelectorAll('.stacked-var-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
        varBtns.appendChild(btn);
      });

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-stack-btn';
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', () => {
        stackedExps.splice(i, 1);
        renderStackedRows();
        updateMainButtonLabels();
      });

      row.appendChild(input);
      row.appendChild(varBtns);
      row.appendChild(removeBtn);
      stackedRowsEl.appendChild(row);
    });

    // Hide toggle when at max
    stackToggle.style.display = stackedExps.length >= 2 ? 'none' : 'flex';
    updateMainButtonLabels();
  }

  function updateMainButtonLabels() {
    const hasStacked = stackedExps.length > 0;
    variantGrid.querySelectorAll('.variant-btn').forEach(btn => {
      const v = btn.dataset.variant;
      const colors = VARIANT_COLORS[v];
      if (!copyMode) {
        btn.textContent = hasStacked ? `Force all ${v}` : v;
        btn.style.fontSize = hasStacked ? '11px' : '13px';
      }
    });
  }

  // ── Copy mode toggle ────────────────────────────────────────────────────────
  copyModeToggle.addEventListener('click', () => {
    copyMode = !copyMode;
    copyModeToggle.classList.toggle('active', copyMode);
    updateVariantButtons();
  });

  function updateVariantButtons() {
    variantGrid.querySelectorAll('.variant-btn').forEach(btn => {
      const v = btn.dataset.variant;
      const colors = VARIANT_COLORS[v];
      if (copyMode) {
        btn.style.background = colors.copyBg;
        btn.style.color = colors.copyText;
        btn.style.border = `1.5px solid ${colors.border}`;
        btn.textContent = `📋 ${v}`;
      } else {
        btn.style.background = colors.bg;
        btn.style.color = colors.text;
        btn.style.border = 'none';
        btn.textContent = v;
      }
    });
  }

  // ── Variant button clicks ───────────────────────────────────────────────────
  variantGrid.querySelectorAll('.variant-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (copyMode) {
        copyForceUrl(btn.dataset.variant);
      } else {
        forceVariant(btn.dataset.variant);
      }
    });
  });

  // Enter key → Force B
  expIdInput.addEventListener('keydown', e => { if (e.key === 'Enter') forceVariant('B'); });

  // ── Clear recent ────────────────────────────────────────────────────────────
  clearBtn.addEventListener('click', async () => {
    recentExps = [];
    await chrome.storage.local.set({ recentExps: [] });
    renderLists();
  });

  // ── Initial render ──────────────────────────────────────────────────────────
  renderLists();

  // ── Live Tests ──────────────────────────────────────────────────────────────
  const liveTestsList   = document.getElementById('liveTestsList');
  const liveRefreshBtn  = document.getElementById('liveRefreshBtn');
  const liveSearch      = document.getElementById('liveSearch');
  const tabThisSite     = document.getElementById('tabThisSite');
  const tabAll          = document.getElementById('tabAll');

  let allLiveTests  = [];
  let activeTab     = 'this-site'; // 'this-site' | 'all'

  // Per-domain match rules: include patterns AND optional exclude patterns
  // All matching is case-insensitive against the test name
  const SITE_MATCH_RULES = [
    { key: 'frgapps',         include: ['fan app', 'fanapp', 'ios app', 'android app'] },
    { key: 'fanatics',        include: ['fan'],   exclude: ['fan app', 'fanapp'] },
    { key: 'mlbshop',         include: ['mlb'] },
    { key: 'nflshop',         include: ['nfl'] },
    { key: 'nbastore',        include: ['nba'] },
    { key: 'nhl',             include: ['nhl'] },
    { key: 'mlsstore',        include: ['mls'] },
    { key: 'lids',            include: ['lids'] },
    { key: 'mitchellandness', include: ['mitchell', 'm&n'] },
    { key: 'fansedge',        include: ['fansedge'] },
    { key: 'kitbag',          include: ['kitbag'] },
    { key: 'ufcstore',        include: ['ufc'] },
    { key: 'wwe',             include: ['wwe'] },
    { key: 'nascar',          include: ['nascar'] },
    { key: 'formula1',        include: ['f1 '] },
  ];

  function getRulesForHost(hostname) {
    return SITE_MATCH_RULES.find(r => hostname.includes(r.key)) || null;
  }

  function isTestOnCurrentSite(test, rules) {
    if (!rules) return false;
    const name = (test.name + ' ' + test.tNum).toLowerCase();
    const included = rules.include.some(p => name.includes(p));
    if (!included) return false;
    if (rules.exclude) {
      const excluded = rules.exclude.some(p => name.includes(p));
      if (excluded) return false;
    }
    return true;
  }

  function getFilteredTests() {
    const q = liveSearch.value.trim().toLowerCase();
    let tests = allLiveTests;

    if (activeTab === 'this-site') {
      const rules = getRulesForHost(currentHostname);
      tests = rules ? tests.filter(t => isTestOnCurrentSite(t, rules)) : [];
    }

    if (q) {
      tests = tests.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.tNum.toLowerCase().includes(q) ||
        (t.eid && t.eid.includes(q))
      );
    }
    return tests;
  }

  tabThisSite.addEventListener('click', () => {
    activeTab = 'this-site';
    tabThisSite.classList.add('active');
    tabAll.classList.remove('active');
    renderLiveTests(getFilteredTests());
  });

  tabAll.addEventListener('click', () => {
    activeTab = 'all';
    tabAll.classList.add('active');
    tabThisSite.classList.remove('active');
    renderLiveTests(getFilteredTests());
  });

  liveSearch.addEventListener('input', () => renderLiveTests(getFilteredTests()));

  // Default to "All" tab if not on a Fanatics site or no rules match
  if (!onFanaticsSite || !getRulesForHost(currentHostname)) {
    activeTab = 'all';
    tabAll.classList.add('active');
    tabThisSite.classList.remove('active');
  }

  loadLiveTests();
  liveRefreshBtn.addEventListener('click', () => loadLiveTests(true));

  async function loadLiveTests(forceRefresh = false) {
    const CACHE_KEY = 'liveTestsCache';
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // Use cache unless forcing refresh
    if (!forceRefresh) {
      const { liveTestsCache } = await chrome.storage.local.get(CACHE_KEY);
      if (liveTestsCache && (Date.now() - liveTestsCache.ts) < CACHE_TTL) {
        allLiveTests = liveTestsCache.tests;
        renderLiveTests(getFilteredTests());
        return;
      }
    }

    liveTestsList.innerHTML = '<div class="live-loading">Loading…</div>';
    liveRefreshBtn.classList.add('spinning');

    try {
      const tests = await fetchJiraTests();
      await chrome.storage.local.set({ liveTestsCache: { ts: Date.now(), tests } });
      allLiveTests = tests;
      liveSearch.value = '';
      renderLiveTests(getFilteredTests());
    } catch (err) {
      if (err.message === 'NO_CREDS') {
        liveTestsList.innerHTML = `
          <div class="live-setup-nudge">
            Add your JIRA credentials to load live tests automatically.
            <br><a id="openSettingsLink">⚙️ Set up now</a>
          </div>`;
        document.getElementById('openSettingsLink')?.addEventListener('click', () => {
          settingsPanel.style.display = 'block';
          settingsBtn.classList.add('active');
          settingsPanel.scrollIntoView({ behavior: 'smooth' });
        });
      } else {
        liveTestsList.innerHTML = `<div class="live-error">⚠️ ${err.message}</div>`;
      }
    } finally {
      liveRefreshBtn.classList.remove('spinning');
    }
  }

  async function fetchJiraTests() {
    // Check for stored credentials
    const creds = await chrome.storage.local.get(['jiraEmail', 'jiraToken']);
    if (!creds.jiraEmail || !creds.jiraToken) {
      throw new Error('NO_CREDS');
    }

    const basicAuth = 'Basic ' + btoa(`${creds.jiraEmail}:${creds.jiraToken}`);
    const url = `https://fanaticscorp.atlassian.net/rest/api/3/search/jql`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jql: 'filter=28941 ORDER BY updated DESC',
        fields: ['summary', 'status', 'customfield_15089', 'duedate'],
        maxResults: 50,
      }),
    });

    if (res.status === 401) throw new Error('Invalid credentials — check your email and API token in ⚙️ Settings.');
    if (res.status === 403) throw new Error('Access denied — make sure your API token has the right permissions.');
    if (!res.ok) throw new Error(`JIRA returned ${res.status}. Try regenerating your API token.`);

    const data = await res.json();

    return (data.issues || []).map(issue => {
      const summary  = issue.fields.summary || '';
      const status   = issue.fields.status?.name || '';
      const sparkUrl = issue.fields.customfield_15089 || '';
      const eidMatch = sparkUrl.match(/[?&]experimentId=(\d+)/);
      const eid      = eidMatch ? eidMatch[1] : null;
      const tMatch   = summary.match(/T(\d+)/i);
      const tNum     = tMatch ? `T${tMatch[1]}` : issue.key;
      const name     = summary.replace(/^T\d+[-\s]*/i, '').trim();
      const dueDate  = issue.fields.duedate || null;
      return { tNum, name, status, eid, key: issue.key, dueDate };
    }).filter(t => t.eid);
  }

  function renderLiveTests(tests) {
    liveTestsList.innerHTML = '';
    if (!tests || tests.length === 0) {
      const msg = activeTab === 'this-site'
        ? 'No live tests found for this site. <a id="switchToAll" style="color:#6685CC;cursor:pointer;font-weight:600;">View all</a>'
        : 'No live tests found.';
      liveTestsList.innerHTML = `<div class="live-empty">${msg}</div>`;
      document.getElementById('switchToAll')?.addEventListener('click', () => tabAll.click());
      return;
    }

    tests.forEach(test => {
      const item = document.createElement('div');
      item.className = 'live-test-item';

      // Status badge style
      const statusClass = {
        'Live': 'status-live',
        'Ready for Testing': 'status-ready',
        'Paused': 'status-paused',
      }[test.status] || 'status-other';

      // Top row: T# + name + status + JIRA link
      const top = document.createElement('div');
      top.className = 'live-test-top';

      const tNumSpan = document.createElement('span');
      tNumSpan.className = 'live-test-tnum';
      tNumSpan.textContent = test.tNum;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'live-test-name';
      nameSpan.title = test.name;
      nameSpan.textContent = test.name;

      const statusSpan = document.createElement('span');
      statusSpan.className = `live-test-status ${statusClass}`;
      statusSpan.textContent = test.status;

      const jiraLink = document.createElement('a');
      jiraLink.className = 'live-test-jira-link';
      jiraLink.href = `https://fanaticscorp.atlassian.net/browse/${test.key}`;
      jiraLink.target = '_blank';
      jiraLink.title = `Open ${test.key} in JIRA`;
      jiraLink.innerHTML = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7"/><path d="M8 1h3v3"/><line x1="11" y1="1" x2="5" y2="7"/></svg>`;

      top.appendChild(tNumSpan);
      top.appendChild(nameSpan);
      top.appendChild(statusSpan);
      top.appendChild(jiraLink);

      // Bottom row: EID + due date + compare + A/B/C/D buttons
      const bottom = document.createElement('div');
      bottom.className = 'live-test-bottom';

      const eidSpan = document.createElement('span');
      eidSpan.className = 'live-test-eid';
      eidSpan.textContent = `EID: ${test.eid}`;
      eidSpan.style.cursor = 'pointer';
      eidSpan.title = 'Click to load';
      eidSpan.addEventListener('click', () => {
        expIdInput.value = test.eid;
        expIdInput.focus();
      });

      // Due date badge
      const dueBadge = document.createElement('span');
      if (test.dueDate) {
        const due = new Date(test.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysLeft = Math.round((due - today) / (1000 * 60 * 60 * 24));
        const dueLabel = daysLeft < 0
          ? `${Math.abs(daysLeft)}d over`
          : daysLeft === 0 ? 'Ends today'
          : `${daysLeft}d left`;
        const dueColor = daysLeft < 0 ? '#CC0000'
          : daysLeft <= 3 ? '#CC0000'
          : daysLeft <= 7 ? '#B45309'
          : '#AAA';
        dueBadge.className = 'live-test-due';
        dueBadge.textContent = dueLabel;
        dueBadge.style.color = dueColor;
        dueBadge.title = `Due ${test.dueDate}`;
      }

      // Compare A vs B button
      const compareBtn = document.createElement('button');
      compareBtn.className = 'live-compare-btn';
      compareBtn.title = 'Open A and B side by side';
      compareBtn.textContent = 'A|B';
      compareBtn.addEventListener('click', async () => {
        expIdInput.value = test.eid;
        const base = (!isSwitchingSite() && onFanaticsSite)
          ? (() => { try { const u = new URL(tabUrl); u.searchParams.delete('__forceExperiment'); return u.toString(); } catch(_) { return 'https://www.fanatics.com'; } })()
          : (isSwitchingSite() ? sitePicker.value : 'https://www.fanatics.com');
        const sep = base.includes('?') ? '&' : '?';
        await chrome.tabs.create({ url: `${base}${sep}__forceExperiment=${test.eid}:A` });
        await chrome.tabs.create({ url: `${base}${sep}__forceExperiment=${test.eid}:B` });
      });

      const btns = document.createElement('div');
      btns.className = 'live-test-btns';
      VARIANTS.forEach(v => {
        const btn = document.createElement('button');
        btn.className = 'mini-btn';
        btn.dataset.variant = v;
        btn.textContent = v;
        btn.addEventListener('click', async () => {
          expIdInput.value = test.eid;
          if (copyMode) {
            await copyForceUrl(v);
          } else {
            await forceVariant(v);
          }
        });
        btns.appendChild(btn);
      });

      bottom.appendChild(eidSpan);
      if (test.dueDate) bottom.appendChild(dueBadge);
      bottom.appendChild(compareBtn);
      bottom.appendChild(btns);
      item.appendChild(top);
      item.appendChild(bottom);
      liveTestsList.appendChild(item);
    });
  }


  // ────────────────────────────────────────────────────────────────────────────
  // CORE ACTIONS
  // ────────────────────────────────────────────────────────────────────────────

  async function forceVariant(variant) {
    const expId = getValidExpId();
    if (!expId) return;

    await saveToHistory(expId);
    const url = buildForceUrl(expId, variant);

    if (!isSwitchingSite() && onFanaticsSite) {
      await chrome.tabs.update(tab.id, { url });
    } else {
      await chrome.tabs.create({ url });
    }
    window.close();
  }

  async function copyForceUrl(variant) {
    const expId = getValidExpId();
    if (!expId) return;

    await saveToHistory(expId);
    const url = buildForceUrl(expId, variant);

    try {
      await navigator.clipboard.writeText(url);
      showStatus(`✓ Copied ${variant} URL to clipboard`, 'copied');
    } catch (_) {
      // Fallback for clipboard permission issues
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showStatus(`✓ Copied ${variant} URL to clipboard`, 'copied');
    }
  }


  // ────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  function getValidExpId() {
    const expId = expIdInput.value.trim();
    if (!expId) { showStatus('Enter an experiment ID first.', 'error'); return null; }
    if (!/^\d+$/.test(expId)) { showStatus('Experiment ID should be numbers only.', 'error'); return null; }
    return expId;
  }

  function isSwitchingSite() {
    return sitePicker.style.display !== 'none';
  }

  async function saveToHistory(expId) {
    // Only add to recents if not already pinned
    if (!pinnedExps.includes(expId)) {
      recentExps = [expId, ...recentExps.filter(id => id !== expId)].slice(0, 8);
    }
    const siteUrl = isSwitchingSite() ? sitePicker.value : null;
    await chrome.storage.local.set({
      lastExpId: expId,
      recentExps,
      ...(siteUrl && { lastSiteUrl: siteUrl })
    });
  }

  function buildForceUrl(expId, variant) {
    // Build all experiment params as repeated keys:
    // ?__forceExperiment=19403:A&__forceExperiment=19555:B
    const allExps = [{ expId, variant }];
    stackedExps.forEach(({ expId: sid, variant: sv }) => {
      if (sid && /^\d+$/.test(sid)) allExps.push({ expId: sid, variant: sv });
    });
    const paramString = allExps
      .map(e => `__forceExperiment=${e.expId}:${e.variant}`)
      .join('&');

    if (!isSwitchingSite() && onFanaticsSite) {
      try {
        const url = new URL(tabUrl);
        url.searchParams.delete('__forceExperiment');
        const base = url.toString();
        return `${base}${base.includes('?') ? '&' : '?'}${paramString}`;
      } catch (_) {}
    }
    const base = isSwitchingSite() ? sitePicker.value : 'https://www.fanatics.com';
    return `${base}/?${paramString}`;
  }

  // ── Pin / unpin ──────────────────────────────────────────────────────────────
  async function togglePin(expId) {
    if (pinnedExps.includes(expId)) {
      pinnedExps = pinnedExps.filter(id => id !== expId);
      // Move back to recents
      if (!recentExps.includes(expId)) {
        recentExps = [expId, ...recentExps].slice(0, 8);
      }
    } else {
      pinnedExps = [...pinnedExps, expId];
      recentExps = recentExps.filter(id => id !== expId);
    }
    await chrome.storage.local.set({ pinnedExps, recentExps });
    renderLists();
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  async function saveNote(expId, note) {
    expNotes = { ...expNotes, [expId]: note };
    await chrome.storage.local.set({ expNotes });
  }


  // ────────────────────────────────────────────────────────────────────────────
  // RENDERING
  // ────────────────────────────────────────────────────────────────────────────

  function renderLists() {
    // Pinned section
    if (pinnedExps.length > 0) {
      pinnedSection.style.display = 'block';
      pinnedListEl.innerHTML = '';
      pinnedExps.forEach(id => pinnedListEl.appendChild(makeExpItem(id, true)));
    } else {
      pinnedSection.style.display = 'none';
    }

    // Recent section
    recentListEl.innerHTML = '';
    if (recentExps.length === 0) {
      recentListEl.innerHTML = '<div class="empty-state">No recent experiments</div>';
    } else {
      recentExps.forEach(id => recentListEl.appendChild(makeExpItem(id, false)));
    }
  }

  function makeExpItem(expId, isPinned) {
    const note = expNotes[expId] || '';
    const item = document.createElement('div');
    item.className = `exp-item${isPinned ? ' pinned-item' : ''}`;

    // Pin button
    const pinBtn = document.createElement('button');
    pinBtn.className = `pin-btn${isPinned ? ' pinned' : ''}`;
    pinBtn.title = isPinned ? 'Unpin' : 'Pin';
    pinBtn.textContent = '📌';
    pinBtn.addEventListener('click', () => togglePin(expId));

    // Info area (ID + note)
    const infoDiv = document.createElement('div');
    infoDiv.className = 'exp-info';

    const idSpan = document.createElement('div');
    idSpan.className = 'exp-id';
    idSpan.textContent = expId;

    const noteEl = document.createElement('div');
    noteEl.className = `exp-note${note ? '' : ' placeholder'}`;
    noteEl.textContent = note || 'add a note…';

    infoDiv.appendChild(idSpan);
    infoDiv.appendChild(noteEl);

    // Click ID to load into input
    idSpan.addEventListener('click', () => {
      expIdInput.value = expId;
      expIdInput.focus();
    });

    // Click note to edit inline
    noteEl.addEventListener('click', (e) => {
      e.stopPropagation();
      startNoteEdit(expId, noteEl, note);
    });

    // Variant mini-buttons
    const btnsDiv = document.createElement('div');
    btnsDiv.className = 'mini-btns';
    VARIANTS.forEach(v => {
      const btn = document.createElement('button');
      btn.className = 'mini-btn';
      btn.dataset.variant = v;
      btn.textContent = v;
      btn.addEventListener('click', async () => {
        expIdInput.value = expId;
        if (copyMode) {
          await copyForceUrl(v);
        } else {
          await forceVariant(v);
        }
      });
      btnsDiv.appendChild(btn);
    });

    item.appendChild(pinBtn);
    item.appendChild(infoDiv);
    item.appendChild(btnsDiv);
    return item;
  }

  function startNoteEdit(expId, noteEl, currentNote) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'note-input';
    input.value = currentNote;
    input.placeholder = 'e.g. PDP hero test';
    input.maxLength = 60;

    noteEl.replaceWith(input);
    input.focus();
    input.select();

    async function commitEdit() {
      const newNote = input.value.trim();
      await saveNote(expId, newNote);
      expNotes[expId] = newNote;
      const newNoteEl = document.createElement('div');
      newNoteEl.className = `exp-note${newNote ? '' : ' placeholder'}`;
      newNoteEl.textContent = newNote || 'add a note…';
      newNoteEl.addEventListener('click', (e) => {
        e.stopPropagation();
        startNoteEdit(expId, newNoteEl, newNote);
      });
      input.replaceWith(newNoteEl);
    }

    input.addEventListener('blur', commitEdit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = currentNote; input.blur(); }
    });
  }


  // ────────────────────────────────────────────────────────────────────────────
  // STATUS / DETECTED HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = `status ${type}`;
    setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'status'; }, 3000);
  }

  function showDetected(msg, showClear = false) {
    detectedText.textContent = msg;
    detectedBadge.classList.add('visible');
    quickClearBtn.style.display = showClear && onFanaticsSite ? 'inline-block' : 'none';
  }
});
