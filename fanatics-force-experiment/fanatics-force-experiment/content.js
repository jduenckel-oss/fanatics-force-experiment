/**
 * content.js — runs on Confluence & JIRA (*.atlassian.net) pages
 * Detects experiment IDs from test brief and ticket pages.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectExpId') {
    const result = detectExperimentId();
    // result is either a string (single EID) or { eids: [{label, eid}] } (multi-site)
    if (result && typeof result === 'object' && result.eids) {
      sendResponse({ eids: result.eids });
    } else {
      sendResponse({ expId: result || null });
    }
  }

  if (request.action === 'fetchJiraTests') {
    const url = 'https://fanaticscorp.atlassian.net/rest/api/3/search?' + new URLSearchParams({
      jql: 'filter=28941 ORDER BY updated DESC',
      fields: 'summary,status,customfield_15090',
      maxResults: 50,
    });
    fetch(url, { credentials: 'same-origin' })
      .then(res => {
        if (!res.ok) throw new Error(`JIRA API ${res.status}`);
        return res.json();
      })
      .then(data => sendResponse({ data }))
      .catch(err => sendResponse({ error: err.message }));
    return true; // keep channel open for async response
  }

  return true;
});

function detectExperimentId() {
  const isJira = window.location.pathname.includes('/browse/') ||
                 window.location.pathname.includes('/issues') ||
                 window.location.search.includes('filter=');
  const isConfluence = window.location.pathname.includes('/wiki/') ||
                       window.location.pathname.includes('/pages/');

  // ── JIRA ticket page ──────────────────────────────────────────────────────
  if (isJira) {
    return detectFromJira();
  }

  // ── Confluence brief page ─────────────────────────────────────────────────
  if (isConfluence) {
    return detectFromConfluence();
  }

  // Fallback: try both
  return detectFromJira() || detectFromConfluence();
}


// ── JIRA detection ────────────────────────────────────────────────────────────
function detectFromJira() {
  // Priority 1: Spark link in page HTML with experimentId param
  // e.g. https://rc.spark.prod.frgcloud.com/experiments/edit?experimentId=20258
  const htmlContent = document.documentElement.innerHTML;
  const sparkExpId = htmlContent.match(
    /spark\.prod\.frgcloud\.com\/experiments\/(?:edit|all|combinedexp)[^"']*[?&]experimentId=(\d{4,6})/i
  );
  if (sparkExpId) return sparkExpId[1];

  // Priority 2: Spark link with wild= param (older format)
  const sparkWild = htmlContent.match(
    /spark\.prod\.frgcloud\.com\/experiments\/[^"']*[?&]wild=(\d{4,6})/i
  );
  if (sparkWild) return sparkWild[1];

  // Priority 3: Any href containing experimentId on the page
  const links = document.querySelectorAll('a[href*="experimentId="]');
  for (const link of links) {
    const m = link.href.match(/[?&]experimentId=(\d{4,6})/);
    if (m) return m[1];
  }

  // Priority 4: EID label in JIRA field panel
  const bodyText = document.body ? document.body.innerText : '';
  const eidMatch = bodyText.match(/\bEID\s*[=:\s]\s*(\d{4,6})\b/i);
  if (eidMatch) return eidMatch[1];

  return null;
}


// ── Confluence detection ──────────────────────────────────────────────────────
function detectFromConfluence() {
  // Priority 1: EID table cell (Fanatics brief format)
  // Handles both single EID ("20257") and multi-site ("MLB 20147\nNFL 20148\nComb 61094")
  const allCells = document.querySelectorAll('td, th');
  for (const cell of allCells) {
    if (cell.innerText.trim().toUpperCase() === 'EID') {
      const nextCell = cell.nextElementSibling;
      if (nextCell) {
        const val = nextCell.innerText.trim();

        // Single EID — pure number
        if (/^\d{4,6}$/.test(val)) return val;

        // Multi-site EID — parse lines like "MLB 20147", "NFL 20148", "Comb 61094"
        const lines = val.split('\n').map(l => l.trim()).filter(Boolean);
        const eids = [];
        for (const line of lines) {
          const m = line.match(/^([A-Za-z0-9&\/\-]+(?:\s+[A-Za-z&]+)*)\s+(\d{4,6})$/);
          if (m) eids.push({ label: m[1].trim(), eid: m[2] });
        }
        if (eids.length > 1) return { eids };
        if (eids.length === 1) return eids[0].eid;
      }
    }
  }

  const bodyText = document.body ? document.body.innerText : '';

  // Priority 2: EID label anywhere on the page
  const eidMatch = bodyText.match(/\bEID\s*[=:\s]\s*(\d{4,6})\b/i);
  if (eidMatch) return eidMatch[1];

  // Priority 3: Spark link in page (experimentId param)
  const htmlContent = document.documentElement.innerHTML;
  const sparkExpId = htmlContent.match(
    /spark\.prod\.frgcloud\.com\/experiments\/[^"']*[?&]experimentId=(\d{4,6})/i
  );
  if (sparkExpId) return sparkExpId[1];

  // Priority 4: Spark link (wild param)
  const sparkWild = htmlContent.match(
    /spark\.prod\.frgcloud\.com\/experiments\/[^"']*[?&]wild=(\d{4,6})/i
  );
  if (sparkWild) return sparkWild[1];

  // Priority 5: Other explicit labels
  const labelMatch = bodyText.match(
    /(?:experiment\s+id|exp(?:eriment)?\s+id|test\s+id)\s*[:#]?\s*(\d{4,6})\b/i
  );
  if (labelMatch) return labelMatch[1];

  // Priority 6: Force URL pasted in the brief
  const forceUrlMatch = bodyText.match(/__forceExperiment[=:](\d{4,6})/i);
  if (forceUrlMatch) return forceUrlMatch[1];

  return null;
}
