<<<<<<< HEAD
# Chrome Profile Locker 🔒

A Chrome/Edge extension that locks your browser with a PIN or password. Protect your browsing session from prying eyes.

## Features

- **One-time unlock per browser session** - Enter your PIN once to unlock all websites
- **PIN or password support** - Use a 4-6 digit PIN or a full password
- **Auto-lock timeout** - Lock after configurable inactivity period (5 min to 2 hours)
- **Lock on restart** - Browser locks automatically when Chrome is reopened
- **Secure storage** - SHA-256 hashing with random salt
- **Local-only** - No server, no database, complete privacy

## Quick Start

### Step 1: Convert Icons (Required)

Chrome requires PNG icons, but this project uses SVG for quality. Convert them:

```bash
# Option A: Using Python (included)
python convert-icons.py

# Option B: Using ImageMagick
cd icons
magick convert icon16.svg icon16.png
magick convert icon48.svg icon48.png
magick convert icon128.svg icon128.png
magick convert icon16-locked.svg icon16-locked.png
magick convert icon48-locked.svg icon48-locked.png
```

### Step 2: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `Password Manager` folder

### Step 3: Set Up Your PIN

1. Click the extension icon in Chrome toolbar
2. Click **Settings**
3. Go to the **Security** tab
4. Click **Set PIN** and enter your desired PIN or password
5. Click **Save**

## How It Works

### Architecture

This extension uses Chrome's Manifest V3 architecture with three main components:

```
┌─────────────────────────────────────────────────────────────┐
│  background.js (Service Worker)                            │
│  - Manages lock state globally                             │
│  - Handles idle detection (auto-lock)                      │
│  - Stores encrypted PIN/password                           │
│  - Communicates with all tabs                               │
└─────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────────────┐
│  popup.html/js      │      │  content.js                    │
│  - Quick actions    │      │  - Injected in every webpage   │
│  - Lock/Unlock btn  │      │  - Shows/hides lock overlay     │
│  - Settings access  │      │  - Prevents keyboard shortcuts │
└─────────────────────┘      └─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  options.html/js                                            │
│  - Configure PIN/password                                   │
│  - Set auto-lock timeout                                     │
│  - Toggle lock on restart                                    │
└─────────────────────────────────────────────────────────────┘
```

### The Locking Mechanism

1. **Content Script Injection**: `content.js` runs on every page (except chrome://, file://, etc.)
2. **Lock Overlay**: When locked, a full-screen overlay blocks the page
3. **Credential Verification**: PIN is hashed with SHA-256 + random salt before comparison
4. **Cross-Tab Sync**: When unlocked, all tabs receive the unlock signal instantly

### Security

- **Hashing**: Uses Web Crypto API with SHA-256
- **Salt**: 32-byte random salt generated for each PIN
- **No Network**: All data stays local in `chrome.storage.local`
- **Keyboard Blocking**: Prevents Ctrl+W, Ctrl+T, Ctrl+L and other shortcuts while locked

## Usage Guide

### Locking the Browser

| Method | How |
|--------|-----|
| Manual | Click extension icon → "Lock Now" |
| Auto-lock | After configured inactivity timeout |
| On restart | Browser locks when Chrome is reopened |

### Unlocking the Browser

1. Visit any website (lock screen appears)
2. Enter your PIN or password
3. Click "Unlock" or press Enter
4. Browse freely until browser locks again

### Settings

Access settings via: Extension icon → **Settings** (or right-click → Options)

**General Settings:**
- Auto-lock timeout: 5 min, 15 min, 30 min, 1 hour, 2 hours, or Never
- Lock on browser restart: ON/OFF

**Security Settings:**
- Set up/change/remove PIN or password
- Password strength indicator

## Project Structure

```
Password Manager/
├── manifest.json           # Extension manifest (MV3)
├── background.js           # Service worker - core logic
├── content.js              # Lock screen injection
├── lock.css                # Lock overlay styles
├── popup.html              # Extension popup UI
├── popup.js                # Popup logic
├── popup.css               # Popup styles
├── options.html            # Settings page
├── options.js              # Settings logic
├── options.css             # Settings styles
├── convert-icons.py        # SVG to PNG converter
├── icons/                  # Extension icons
│   ├── icon16.svg          # Unlocked 16px
│   ├── icon48.svg          # Unlocked 48px
│   ├── icon128.svg         # Unlocked 128px
│   ├── icon16-locked.svg   # Locked 16px
│   └── icon48-locked.svg   # Locked 48px
└── README.md
```

## Development

### File Responsibilities

| File | Purpose |
|------|---------|
| `manifest.json` | Extension metadata, permissions, entry points |
| `background.js` | State management, idle detection, message hub |
| `content.js` | DOM manipulation, lock overlay, event handling |
| `popup.js` | Quick actions UI controller |
| `options.js` | Settings page controller |
| `lock.css` | Full-screen overlay styles |

### Key Permissions

- `storage` - Save PIN hash and settings locally
- `tabs` - Communicate with all open tabs
- `idle` - Detect inactivity for auto-lock
- `<all_urls>` - Inject content script everywhere

### Excluded URLs

The lock screen does NOT appear on:
- `chrome://*`
- `chrome-extension://*`
- `edge://*`
- `about:*`
- `data:*`
- `file://*`

## Troubleshooting

**Extension doesn't load:**
- Ensure PNG icons exist in `icons/` folder (run `python convert-icons.py`)

**Can't unlock:**
- Go to Settings → Security → Remove PIN
- Set up a new PIN

**Lock screen not appearing:**
- Check if the website is in excluded URLs (chrome://, file://, etc.)

**Auto-lock not working:**
- Ensure "Idle detection" permission is granted
- Check timeout setting in General tab

## Security Notes

- If you forget your PIN, there is NO recovery - you must remove it from Settings
- PIN is NEVER stored in plain text - only SHA-256 hash with salt
- No data leaves your computer
- The lock overlay blocks most keyboard shortcuts, but sophisticated users can still bypass it

## Compatibility

- Chrome 88+
- Edge 88+
- Any Chromium-based browser
- Manifest V3

## License

MIT License - Feel free to use and modify for your needs.

## Credits

Built with vanilla JavaScript and CSS for maximum compatibility and performance.
=======
# LockMyChrome
LockMyChrome is a Chrome extension that locks all websites behind a PIN or password. Unlock once per session, browse freely, and auto-lock after inactivity. Secure, local-only, and built for shared Chrome profiles.
>>>>>>> f49352cb376315b9114ee58201a6b59c594f7b9a
