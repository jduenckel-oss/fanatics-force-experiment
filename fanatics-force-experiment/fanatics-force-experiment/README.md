# ⭐ Fanatics Force Experiment

A Chrome/Edge extension for one-click forcing into A/B test variants across Fanatics and all managed sites.

---

## Installation

1. Download this repo as a zip (click **Code → Download ZIP**) and unzip it
2. Go to `chrome://extensions` in Chrome (or `edge://extensions` in Edge)
3. Turn on **Developer mode** (toggle in the top right)
4. Click **Load unpacked** → select the `fanatics-force-experiment` folder
5. The ⭐ icon will appear in your toolbar — pin it for easy access

---

## JIRA Setup (one-time)

The extension pulls your team's live tests directly from JIRA — no tab required. You just need an API token.

1. Go to https://id.atlassian.com/manage/api-tokens
2. Click **Create API token**, give it any name, and copy it
3. Click the **⚙️ icon** in the extension header
4. Enter your Fanatics email + the token → **Save & Load Tests**

---

## Features

**🟢 Live Tests**
Shows all active team tests from JIRA filter 28941 with one-click A/B/C/D force buttons on each.

**🔍 Auto-detect EID**
Open the extension while on a Confluence brief or JIRA ticket — it automatically pre-fills the experiment ID.

**🌐 Multi-site support**
Works across 35+ properties including Fanatics, MLB Shop, NFL Shop, NBA Store, NHL Shop, Lids, Mitchell & Ness, FansEdge, Kitbag, UFC Store, WWE Shop, and more.

**📋 Copy URL mode**
Toggle Copy URL mode to copy the force URL to your clipboard instead of navigating — great for sharing with teammates.

**➕ Stack experiments**
Force multiple experiments simultaneously. The URL will include repeated `__forceExperiment` params.

**🔢 Icon badge**
The extension icon shows your current forced variant (A/B/C/D) at a glance.

**⚡ Quick clear**
One click to remove the force param from the current tab.

**📌 Pin & Notes**
Save frequently used experiment IDs with custom labels for quick access.

---

## How It Works

The extension appends a `__forceExperiment` parameter to the URL:

```
https://www.fanatics.com/?__forceExperiment=19403:B
```

For stacked experiments:
```
https://www.fanatics.com/?__forceExperiment=19403:A&__forceExperiment=19555:B
```

---

## Getting Updates

When a new version is released, download the updated zip, replace your local folder, and click the **refresh icon** on the extension card in `chrome://extensions`.
