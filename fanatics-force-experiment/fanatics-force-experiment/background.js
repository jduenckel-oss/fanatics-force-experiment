/**
 * background.js — MV3 service worker
 * Updates the extension icon badge whenever the active tab navigates.
 * - Single experiment forced  → shows variant letter (e.g. "B") in matching colour
 * - Multiple experiments stacked → shows count (e.g. "2×")
 * - No force param → clears badge
 */

const VARIANT_COLORS = {
  A: '#002D72',
  B: '#CC0000',
  C: '#2E7D32',
  D: '#6A1B9A',
};

// Watch navigations on all tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) updateBadge(tabId, changeInfo.url);
});

// Watch tab switches
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url) updateBadge(tabId, tab.url);
  });
});

// Clear badge when window focus changes (handles edge cases)
chrome.windows.onFocusChanged.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab && tab.url) updateBadge(tab.id, tab.url);
  });
});

function updateBadge(tabId, url) {
  try {
    const urlObj = new URL(url);
    const forceParam = urlObj.searchParams.get('__forceExperiment');

    if (!forceParam) {
      clearBadge(tabId);
      return;
    }

    const experiments = forceParam.split(',').filter(Boolean);

    if (experiments.length > 1) {
      // Stacked experiments — show count
      chrome.action.setBadgeText({ text: `${experiments.length}×`, tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#555555', tabId });
    } else {
      // Single experiment — show variant letter
      const variant = (experiments[0].split(':')[1] || '?').toUpperCase();
      chrome.action.setBadgeText({ text: variant, tabId });
      chrome.action.setBadgeBackgroundColor({
        color: VARIANT_COLORS[variant] || '#555555',
        tabId
      });
    }
  } catch (_) {
    clearBadge(tabId);
  }
}

function clearBadge(tabId) {
  chrome.action.setBadgeText({ text: '', tabId });
}
