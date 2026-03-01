# 🔐 LockMyChrome

**LockMyChrome** is a production-ready Chrome extension that protects your browsing session by locking access to all websites behind a secure **PIN or Password**.

It provides a vital layer of "soft" security for users in shared environments, ensuring your open tabs, history, and active sessions remain private.

---

## 🚨 The Problem
Google Chrome allows anyone with physical access to a computer to open any profile and view sensitive data. This is a major privacy risk in:
* **Shared Laptops:** Roommates or family members snooping.
* **Public Systems:** Library computers or internet cafes.
* **Office Workstations:** Coworkers accessing your data while you step away.

**LockMyChrome** solves this by intercepting website access until you authenticate.

---

## ✅ Key Features
* 🔐 **Session-Based Unlock:** Authenticate once per session for seamless browsing.
* 🔢 **Flexible Auth:** Supports 4–6 digit PINs or full alphanumeric passwords.
* ⏳ **Smart Auto-Lock:** Automatically locks after a custom period of inactivity.
* 🔁 **Persistence:** Automatically re-locks upon browser restart.
* 🔒 **Privacy First:** Uses **Salted SHA-256 hashing** via the Web Crypto API.
* 💾 **Local-Only Storage:** No servers, no tracking, and zero data leaves your device.
* ⚡ **Manifest V3 Compliant:** Built using the latest, high-performance extension standards.

---

## 🚀 Installation (Developer Mode)

Until the extension is available on the Chrome Web Store, you can install it manually:

1.  **Clone or Download** this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  In the top-right corner, toggle **Developer Mode** to **ON**.
4.  Click the **Load unpacked** button.
5.  Select the `chrome-profile-locker` folder from your files.
6.  (Optional) **Pin the extension** to your toolbar for quick access to the lock settings.

---

## 🔐 Security Design

LockMyChrome is built with a "Security-First" mindset, ensuring that even if someone accesses your local files, your credentials remain safe.

* **Hashing & Salting:** Passwords are never stored in plaintext. We generate a unique **random salt** and use **SHA-256 hashing** via the Web Crypto API (`SubtleCrypto`).
* **Storage Isolation:** Credentials and state are stored using `chrome.storage.local`. This data is profile-scoped and isolated from websites and other extensions.
* **State Management:** The "unlocked" state lives in the background service worker’s memory, ensuring it resets if the browser process is killed.

---

## ⚠️ Limitations
While LockMyChrome provides robust privacy, please note the following inherent limitations of Chrome extensions:

1.  **Intentional Removal:** An extension cannot prevent a user from right-clicking the icon and selecting "Remove from Chrome."
2.  **Incognito Mode:** Extensions are disabled in Incognito by default unless you manually toggle "Allow in Incognito" in the extension settings.
3.  **OS-Level Access:** This tool does not replace Operating System passwords or Disk Encryption (like BitLocker or FileVault). It is a browser-level gatekeeper.

---

## 🛠️ Tech Stack
* **Language:** JavaScript (ES6+)
* **Framework:** Chrome Extensions API (Manifest V3)
* **Security:** Web Crypto API (for local cryptographic operations)
* **Frontend:** HTML5 & CSS3 (Native, no heavy frameworks for maximum speed)

---

#### 📁 Project Structure

```text
LockMyChrome/
├── icons/                 # Extension icons in various sizes
│   ├── icon16-locked.svg
│   ├── icon16.svg
│   ├── icon48-locked.svg
│   ├── icon48.svg
│   └── icon128.svg
├── background.js          # Service worker managing state and timers
├── content.js             # Script injected to block website access
├── convert-icons.py       # Helper script for icon processing
├── lock.css               # Styling for the authentication screen
├── manifest.json          # Extension configuration (Manifest V3)
├── options.css            # Styling for the settings page
├── options.html           # Settings page HTML
├── options.js             # Logic for saving/updating settings
├── popup.css              # Styling for the extension popup
├── popup.html             # Extension popup UI
├── popup.js               # Logic for the extension popup
└── README.md              # Project documentation