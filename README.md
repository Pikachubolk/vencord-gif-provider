<div align="center">

# 🎬 GIF Provider

### A Vencord plugin to switch between GIF providers in Discord

[![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Vencord](https://img.shields.io/badge/Vencord-Plugin-7289DA.svg)](https://vencord.dev)
[![Version](https://img.shields.io/badge/version-1.0.2-green.svg)](package.json)

[Installation](#-installation) •
[Providers](#-supported-providers) •
[Configuration](#%EF%B8%8F-configuration) •
[Usage](#-usage) •
[Troubleshooting](#-troubleshooting) •
[Development](#-development)

</div>

---

## ✨ Features

- 🔄 **Switch GIF providers** - Choose from 5 different GIF services
- ⚡ **Instant switching** - No restart required, GIFs and categories update immediately when you switch providers
- 🌐 **Tenor Web** - Uses Tenor's web interface directly — no API key needed
- 🎬 **WebM/MP4 previews** - All providers use lightweight video previews (WebM/MP4) for smooth, high-performance playback in the picker
- 🔗 **Smart URL sharing** - Shares clean, appropriate links when you click a GIF (Tenor share pages, direct GIF links for others)
- 🏠 **Self-hosted support** - Use your own Serika GIFs instance
- 🔒 **API key support** - Configure private instances with authentication
- 🎨 **Clean integration** - Seamlessly replaces Discord's default GIF picker with a provider dropdown right in the search bar
- 🛡️ **Crash-proof** - Robust error handling ensures Discord never crashes
- 🔧 **Debug friendly** - Access `window.GifProvider` in DevTools for testing

## 🎯 Supported Providers

| Provider | Description | API Key | Preview Format | Chat URL |
|----------|-------------|---------|----------------|----------|
| **Tenor (Web)** ⭐ | Tenor via web interface — default, works out of the box | ❌ Not required | WebM | `tenor.com/view/...` share page |
| **Giphy** | World's largest GIF library | ✅ Required | MP4 | Direct `.gif` link |
| **Klipy** | Modern GIF platform | ✅ Required | MP4/WebM | Direct `.gif` link |
| **Serika GIFs** | Self-hosted GIF library | ❌ Optional | WebM | Direct GIF URL |
| **Imgur** | Popular image/GIF hosting | ✅ Required | MP4 | Direct `.gif` link |

> **Note:** The Tenor API was shut down on June 30, 2026. This plugin uses Tenor's **web interface** directly (the same way tenor.com works in your browser), so it still works perfectly without any API key.

---

## 📦 Installation

This guide will walk you through every step. Don't worry — it's easier than it looks!

### 🖥️ Which version are you using?

Pick the tab that matches your setup:

#### Option A: Vesktop (Flatpak on Linux) — Most Common

> Vesktop is the recommended way to use Vencord on Linux. If you installed Vesktop via Flatpak, follow these steps.

**Step 1: Install build tools**

```bash
# Install Node.js (v18 or newer) and pnpm
sudo apt install nodejs npm    # Debian/Ubuntu
npm install -g pnpm            # Install pnpm globally
```

**Step 2: Clone and build Vencord**

```bash
# Clone Vencord to a folder of your choice
git clone https://github.com/Vendicated/Vencord ~/Vencord
cd ~/Vencord

# Install dependencies
pnpm install

# Build Vencord
pnpm build
```

**Step 3: Add the GIF Provider plugin**

```bash
# Create the userplugins folder (if it doesn't exist)
mkdir -p src/userplugins

# Clone this plugin into the userplugins folder
git clone https://github.com/Pikachubolk/vencord-gif-provider.git src/userplugins/GifProvider

# Rebuild Vencord with the plugin
pnpm build
```

**Step 4: Copy built files to Vesktop**

```bash
# Copy the built Vencord files to Vesktop's config directory
cp dist/vencordDesktop* ~/.var/app/dev.vencord.Vesktop/config/vesktop/sessionData/vencordFiles/
```

**Step 5: Restart Vesktop**

Close Vesktop completely and reopen it. The plugin will appear in **Settings → Vencord → Plugins**.

---

#### Option B: Vesktop (Other platforms)

**Step 1: Clone and build Vencord**

```bash
git clone https://github.com/Vendicated/Vencord
cd Vencord
pnpm install
pnpm build
```

**Step 2: Add the plugin**

```bash
mkdir -p src/userplugins
git clone https://github.com/Pikachubolk/vencord-gif-provider.git src/userplugins/GifProvider
pnpm build
```

**Step 3: Copy to Vesktop**

- **Windows:** Copy `dist\vencordDesktop*` to `%APPDATA%\vesktop\sessionData\vencordFiles\`
- **macOS:** Copy `dist/vencordDesktop*` to `~/Library/Application Support/vesktop/sessionData/vencordFiles/`

**Step 4: Restart Vesktop** and enable the plugin in Settings.

---

#### Option C: Vencord (Injected into Discord directly)

**Step 1: Clone and build Vencord**

```bash
git clone https://github.com/Vendicated/Vencord
cd Vencord
pnpm install
pnpm build
```

**Step 2: Add the plugin**

```bash
mkdir -p src/userplugins
git clone https://github.com/Pikachubolk/vencord-gif-provider.git src/userplugins/GifProvider
pnpm build
```

**Step 3: Inject into Discord**

```bash
pnpm inject
```

**Step 4: Restart Discord** and enable the plugin in Vencord Settings → Plugins.

---

#### Option D: Manual copy (no git clone)

If you already have Vencord set up and just want to add the plugin file:

1. Download [`index.ts`](index.ts) from this repository
2. Place it in `Vencord/src/plugins/gifProvider/index.ts` (or `Vencord/src/userplugins/GifProvider/index.ts`)
3. Run `pnpm build` in the Vencord directory
4. Copy the built files to your Vesktop/Vencord config directory
5. Restart your client

---

## ⚙️ Configuration

Open **Vencord Settings** → **Plugins** → **GifProvider**

| Setting | Description | Default |
|---------|-------------|---------|
| **Provider** | Select your preferred GIF provider | Tenor (Web) |
| **Giphy API Key** | Your Giphy API key (only needed if using Giphy) | - |
| **Klipy API Key** | Your Klipy API key (only needed if using Klipy) | - |
| **Imgur Client ID** | Your Imgur Client ID (only needed if using Imgur) | - |
| **Serika Instance** | URL of your Serika GIFs instance | `https://gifs.serika.dev` |
| **Serika API Key** | API key to bypass rate limits (optional) | - |

### Getting API Keys (only if you need them)

You only need API keys for the providers you want to use. **Tenor Web and Serika GIFs work without any keys!**

#### Giphy
1. Go to [developers.giphy.com](https://developers.giphy.com)
2. Create an account and click "Create an App"
3. Choose "API Key" and select "API" (not SDK)
4. Fill in the app details (name, description)
5. Copy your API key and paste it into the plugin settings

#### Klipy
1. Go to [klipy.co/developers](https://klipy.co/developers)
2. Sign up and request an API key
3. Copy your API key and paste it into the plugin settings

#### Imgur
1. Go to [api.imgur.com/oauth2/addclient](https://api.imgur.com/oauth2/addclient)
2. Register an application — select "Anonymous usage without user authorization"
3. Copy your **Client ID** (not Client Secret!) and paste it into the plugin settings

### Serika GIFs Setup

Serika GIFs is a self-hosted GIF platform that works **without an API key**!

1. Select "Serika GIFs" as your provider in Vencord settings
2. Enter your instance URL (default: `https://gifs.serika.dev`)
3. (Optional) Add an API key to bypass rate limits

---

## 🎮 Usage

### Basic Usage

1. **Enable the plugin** in Vencord Settings → Plugins → GifProvider
2. **Select your provider** from the dropdown in Vencord settings (default: Tenor Web)
3. **Open Discord's GIF picker** — click the GIF button in the chat box
4. **Search or browse** — GIFs now come from your selected provider!
5. **Click a GIF** to send it in chat — the appropriate URL is pasted automatically

### Switching Providers On the Fly

You can switch providers **without restarting Discord** in two ways:

- **Method 1: Vencord Settings** — Go to Settings → Vencord → Plugins → GifProvider → Provider dropdown
- **Method 2: GIF Picker Dropdown** — A small dropdown appears right next to the search bar in the GIF picker. Use it to switch providers instantly!

When you switch, the GIF picker will:
- Clear all old GIFs and categories immediately
- Fetch fresh trending GIFs and categories from the new provider
- Update the search placeholder text (e.g., "Search Tenor", "Search Giphy")

### What URL gets pasted when I click a GIF?

| Provider | What gets pasted in chat |
|----------|--------------------------|
| **Tenor (Web)** | `https://tenor.com/view/...` (clean share page link) |
| **Giphy** | Direct `.gif` URL (e.g., `https://media.giphy.com/media/.../giphy.gif`) |
| **Klipy** | Direct GIF URL from Klipy CDN |
| **Serika GIFs** | Direct GIF URL from Serika CDN |
| **Imgur** | Direct `.gif` URL (e.g., `https://i.imgur.com/...gif`) |

### What format are the previews?

All providers use **WebM or MP4 video** for in-picker previews. This means:
- Smoother playback with less CPU usage
- Smaller file sizes = faster loading
- No janky GIF stuttering

---

## 🔧 Troubleshooting

### GIFs not loading / blank picker

1. **Check your API key** — If using Giphy/Klipy/Imgur, make sure the key is correct
2. **Check the console** — Open DevTools (Ctrl+Shift+I) and look for `[GifProvider]` errors
3. **Try Tenor Web** — Switch to Tenor (Web) which requires no API key. If it works, the issue is with your API key for the other provider
4. **Rebuild Vencord** — Make sure you rebuilt after adding the plugin: `pnpm build`

### CSP errors ("Content Security Policy directive")

If you see errors like `Loading media from '...' violates the following Content Security Policy directive`, this means the CSP whitelist needs updating. This is already handled in the plugin's Vencord integration:

- All provider domains are whitelisted in `Vencord/src/main/csp/index.ts` for both `img-src` and `media-src`
- The plugin also dynamically requests CSP overrides at runtime via `VencordNative.csp`

If you're still seeing CSP errors after rebuilding:
1. Make sure you copied the **vencordDesktopMain.js** file (not just the renderer) to Vesktop
2. Restart Vesktop completely (not just reload)
3. Check that the CSP file was included in the build

### GIFs don't change when switching providers

If old GIFs persist when switching providers:
1. Close and reopen the GIF picker
2. Check the console for errors during the switch
3. The plugin clears Discord's internal Flux store and fetches fresh data — if the store can't be found, the old data may persist

### Getting logged out

**This is NOT caused by the plugin.** The plugin only modifies the GIF picker and does not touch authentication. If you're getting logged out:
- This can happen if Vesktop is force-killed (`kill -9`) instead of closed gracefully, which can corrupt the session database
- Always close Vesktop normally (File → Quit or Ctrl+Q)

### Plugin not showing up in Vencord settings

1. Make sure the plugin file is at the correct path (`src/userplugins/GifProvider/index.ts` or `src/plugins/gifProvider/index.ts`)
2. Run `pnpm build` again in the Vencord directory
3. Copy ALL `vencordDesktop*` files to the Vesktop config directory
4. Restart Vesktop completely

---

## 🔧 Development

### Project Structure

```
vencord-gif-provider/
├── index.ts          # Main plugin file (all logic)
├── README.md         # This file
├── package.json      # Package metadata
└── .serika-agent/    # Development notes and chat history
```

### How the Plugin Works

The plugin works by intercepting Discord's internal GIF API calls:

1. **RestAPI.get proxy** — Patches `RestAPI.get` to intercept requests to `/gifs/search`, `/gifs/trending-gifs`, and `/gifs/trending` endpoints
2. **Flux Store patching** — Patches `GIFPickerSearchStore` methods (`getTrendingCategories`, `getTrendingGifs`, `getState`) to return cached data from the selected provider
3. **MutationObserver** — Watches the DOM for the GIF picker search input and patches its placeholder text + injects a provider dropdown
4. **safeFetch** — Wrapper around `fetch` that dynamically requests CSP overrides via `VencordNative.csp` before making API calls
5. **Cache invalidation** — On provider switch, all caches are cleared and the Flux store is reset with new data

### Building

```bash
# In your Vencord directory
pnpm build

# For development with hot reload
pnpm watch

# Type-check without building
pnpm testTsc
```

### Adding New Providers

To add a new GIF provider:

1. **Add the provider to settings options** — Add a new entry in the `provider` select option
2. **Create a transform function** — Map the provider's API response to the `DiscordGif` interface:
   ```typescript
   function transformNewProvider(data: any): DiscordGif[] {
       return data.results.map((item: any) => ({
           id: item.id,
           title: item.title,
           url: item.share_url,    // URL pasted in chat
           src: item.video_url,     // Video URL for picker preview (WebM/MP4)
           gif_src: item.gif_url,   // Fallback GIF URL
           width: item.width || 200,
           height: item.height || 200,
           preview: item.preview_url, // Small preview URL
       }));
   }
   ```
3. **Create search and trending functions** — Fetch from the provider's API and transform results
4. **Add cases to the dispatcher switches** — In `searchFromProvider` and `trendingFromProvider`
5. **Add CSP whitelist entries** — In `Vencord/src/main/csp/index.ts`

### Debugging

Open the browser console (Ctrl+Shift+I) and look for `[GifProvider]` logs:

```javascript
// Test search manually
window.GifProvider.search("cats", 10)

// Test trending
window.GifProvider.trending(10)

// Test categories
window.GifProvider.categories()

// Check current settings
window.GifProvider.settings

// Get the Flux store
window.GifProvider.getStore()

// Re-patch the store
window.GifProvider.patchStore()
```

---

## 📝 API Notes

| Provider | API Endpoint | Notes |
|----------|-------------|-------|
| **Tenor (Web)** | `tenor.googleapis.com/v2` | Uses Tenor's web frontend key — no setup needed |
| **Giphy** | `api.giphy.com/v1` | Requires your own API key from developers.giphy.com |
| **Klipy** | `api.klipy.com/api/v1` | API key goes in URL path, not query param |
| **Serika** | `gifs.serika.dev/api` | Works without API key! Optional key bypasses rate limits |
| **Imgur** | `api.imgur.com/3` | Requires Client ID in Authorization header |

---

## 🐛 Known Issues

- **Discord updates may break patches** — Discord updates can change internal code patterns. If the plugin stops working after a Discord update, the patches may need updating.
- **Imgur results** — Imgur's API returns mixed content (albums, static images), so only animated GIFs are filtered.
- **Klipy categories** — Klipy doesn't have a public categories endpoint, so popular tags are generated by fetching top GIFs for common search terms.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes and test them
4. Submit a pull request with a clear description

### Submitting to Official Vencord

To get this plugin into the official Vencord repository:

1. **Requirements** (from [Vencord Plugin Submission](https://docs.vencord.dev/plugins/submission/)):
   - Plugin must be useful to a wide audience
   - Must follow Vencord's code style
   - Must not break Discord ToS more than Vencord already does
   - Must have proper error handling

2. **Process**:
   - Fork [Vendicated/Vencord](https://github.com/Vendicated/Vencord)
   - Add the plugin to `src/plugins/` (not userplugins)
   - Add yourself to `src/utils/constants.ts` Devs object
   - Submit a PR with a good description

---

## 📄 License

This project is licensed under GPL-3.0-or-later, same as Vencord.

## 🙏 Credits

- [Vencord](https://github.com/Vendicated/Vencord) — The amazing Discord client mod
- All the GIF providers for their APIs
- The Vencord community for testing and feedback

---

<div align="center">

**Made with ❤️ for the Vencord community**

</div>
