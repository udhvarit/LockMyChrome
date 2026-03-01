🔐 LockMyChrome
LockMyChrome is a production-ready browser extension designed to secure your digital footprint. It acts as a gatekeeper, locking your entire browsing session behind a secure PIN or password. Perfect for shared environments where privacy is a priority but OS-level user switching is inconvenient.

🚨 The Problem
Google Chrome allows anyone with physical access to a computer to open any profile and view history, saved passwords, and active sessions. This poses a significant risk on:

Shared Laptops: Roommates or family members snooping.

Public Systems: College libraries or internet cafes.

Office Workstations: Coworkers accessing your data during breaks.

LockMyChrome solves this by intercepting website access until you authenticate, providing a much-needed layer of "soft" security.

✅ Key Features
🔐 Session-Based Unlock: Authenticate once per session for an uninterrupted experience.

🔢 Flexible Auth: Supports 4–6 digit PINs or complex alphanumeric passwords.

⏳ Smart Auto-Lock: Automatically locks after a custom period of inactivity.

🔁 Persistence: Re-locks instantly upon browser restart.

🔒 Privacy First: Uses Salted SHA-256 hashing via the Web Crypto API. No plaintext storage, no servers, and zero tracking.

⚡ Lightweight: Built with Manifest V3 for optimal performance and battery life.

🏗️ Architecture & Logic
The extension uses a multi-layered approach to ensure you aren't bypassed by simple tab switching:

Content Script: Injects a blocking layer on every URL.

Background Service Worker: Tracks the "locked/unlocked" state and manages the inactivity timer.

Secure UI: A dedicated, clean authentication page for PIN/Password entry.

🚀 Installation (Developer Mode)
Until this is live on the Chrome Web Store, you can install it manually:

Download or clone this repository to your local machine.

Open Chrome and navigate to chrome://extensions/.

Toggle Developer Mode (top right corner) to ON.

Click Load unpacked.

Select the chrome-profile-locker folder.

Pin the extension to your toolbar for easy access to settings.

⚙️ Configuration
Access the Options page to customize your security:

Change Auth Type: Switch between PIN and Password.

Idle Timeout: Set the minutes of inactivity required before auto-locking.

Immediate Lock: A manual "Panic Button" to lock your session instantly.

🔐 Security Design & Limitations
How we protect you:
Zero-Knowledge: We never see your password. All hashing happens locally.

Isolation: Your credentials are stored in chrome.storage.local, isolated from website scripts and other extensions.

⚠️ Important Disclaimer:
This extension is designed for casual privacy and shared-device protection.

It cannot prevent a tech-savvy user from uninstalling the extension or using "Incognito" mode (unless specifically allowed in settings).

It is not a replacement for Operating System passwords or Disk Encryption (FileVault/BitLocker).

🛠️ Tech Stack
Logic: JavaScript (ES6+)

API: Chrome Extensions API (Manifest V3)

Security: Web Crypto API (SubtleCrypto)

Styling: HTML5 / CSS3