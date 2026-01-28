<div align="center">

# 🎬 GIF Provider

### A Vencord plugin to switch between GIF providers in Discord

[![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Vencord](https://img.shields.io/badge/Vencord-Plugin-7289DA.svg)](https://vencord.dev)

[Installation](#-installation) •
[Providers](#-supported-providers) •
[Configuration](#%EF%B8%8F-configuration) •
[Development](#-development)

</div>

---

## ✨ Features

- 🔄 **Switch GIF providers** - Choose from 5 different GIF services
- ⚡ **Instant switching** - No restart required, changes apply immediately
- 🏠 **Self-hosted support** - Use your own Serika GIFs instance
- 🔒 **API key support** - Configure private instances with authentication
- 🎨 **Clean integration** - Seamlessly replaces Discord's default GIF picker

## 🎯 Supported Providers

| Provider | Description | API Key | Get Key |
|----------|-------------|---------|---------|
| **Tenor** | Discord's default provider | ❌ Not required | Built-in |
| **Giphy** | World's largest GIF library | ✅ Required | [developers.giphy.com](https://developers.giphy.com) |
| **Klipy** | Modern GIF platform | ✅ Required | [klipy.co/developers](https://klipy.co/developers) |
| **Serika GIFs** | Self-hosted GIF library | ❌ Optional | Bypasses rate limits |
| **Imgur** | Popular image/GIF hosting | ✅ Required | [api.imgur.com](https://api.imgur.com) |

## 📦 Installation

### Option 1: Download Pre-built (Easiest)

> ⚠️ **Note:** Custom plugins require building Vencord from source. Prebuilt Vencord versions don't support external plugins.

1. **Download** the latest plugin from [GitHub Actions](https://github.com/Pikachubolk/vencord-gif-provider/actions) (click the latest run → Artifacts → GifProvider-plugin)

2. **Follow the build-from-source instructions below** to install it

### Option 2: Build from Source

#### Prerequisites

You need [Vencord](https://vencord.dev) built from source. If you haven't done this:

```bash
# Clone Vencord
git clone https://github.com/Vendicated/Vencord
cd Vencord

# Install dependencies
pnpm install

# Build once to verify it works
pnpm build
```

#### Install the Plugin

1. **Create the userplugins folder** (if it doesn't exist):
   ```bash
   mkdir -p src/userplugins
   ```

2. **Clone this plugin:**
   ```bash
   git clone https://github.com/Pikachubolk/vencord-gif-provider.git src/userplugins/GifProvider
   ```

3. **Build Vencord:**
   ```bash
   pnpm build
   ```

4. **Inject into Discord:**
   ```bash
   pnpm inject
   ```

5. **Restart Discord** and enable the plugin in Vencord Settings → Plugins

### Option 3: Use Official Vencord (Coming Soon?)

Want this plugin in the official Vencord? Show your support:
- ⭐ Star this repository
- 👍 React to the [plugin submission issue](https://github.com/Pikachubolk/vencord-gif-provider/issues) (if exists)
- The plugin may be submitted to [Vencord's official repository](https://github.com/Vendicated/Vencord) in the future

## ⚙️ Configuration

Open **Vencord Settings** → **Plugins** → **GifProvider**

| Setting | Description | Default |
|---------|-------------|---------|
| **Provider** | Select your preferred GIF provider | Tenor |
| **Giphy API Key** | Your Giphy API key | - |
| **Klipy API Key** | Your Klipy API key | - |
| **Imgur Client ID** | Your Imgur Client ID | - |
| **Serika Instance** | URL of your Serika GIFs instance | `https://gifs.serika.dev` |
| **Serika API Key** | API key to bypass rate limits (optional) | - |

### Getting API Keys

#### Giphy
1. Go to [developers.giphy.com](https://developers.giphy.com)
2. Create an account and create an app
3. Copy your API key

#### Klipy
1. Go to [klipy.co/developers](https://klipy.co/developers)
2. Sign up and request an API key
3. Copy your API key

#### Imgur
1. Go to [api.imgur.com](https://api.imgur.com/oauth2/addclient)
2. Register an application (select "Anonymous usage without user authorization")
3. Copy your Client ID

### Serika GIFs Setup

Serika GIFs is a self-hosted GIF platform that works **without an API key**!

1. Select "Serika GIFs" as your provider
2. Enter your instance URL (default: `https://gifs.serika.dev`)
3. (Optional) Add an API key to bypass rate limits

**Note:** Without an API key, you'll have rate limits. With an API key, unlimited access!

## 🎮 Usage

1. **Enable the plugin** in Vencord settings
2. **Select your provider** from the dropdown menu
3. **Open Discord's GIF picker** (click the GIF button in chat)
4. **Search or browse** - GIFs now come from your selected provider!

## 🔧 Development

### Project Structure

```
GifProvider/
├── index.ts          # Main plugin file
├── README.md         # This file
└── package.json      # Package metadata
```

### Building

```bash
# In your Vencord directory
pnpm build

# For development with hot reload
pnpm watch
```

### Adding New Providers

To add a new GIF provider, you need to:

1. Add the provider to the settings options
2. Create a transform function for the API response
3. Create search and trending functions
4. Add cases to the dispatcher switches

```typescript
// Example: Adding a new provider
async function searchNewProvider(query: string, limit: number): Promise<GifResult[]> {
    const url = `https://api.newprovider.com/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();
    return transformNewProviderResults(data);
}
```

### Debugging

Open the browser console (Ctrl+Shift+I) and look for `[GifProvider]` logs:

```javascript
// Test search manually
Vencord.Plugins.plugins.GifProvider.searchGifs("cats", 10)
```

## 📝 API Notes

| Provider | Notes |
|----------|-------|
| **Tenor** | Uses Discord's built-in API key - no setup needed |
| **Giphy** | Requires your own API key from developers.giphy.com |
| **Klipy** | Requires your own API key from klipy.co |
| **Serika** | Works without API key! Optional key bypasses rate limits |
| **Imgur** | Requires your own Client ID from api.imgur.com |

## 🐛 Known Issues

- **Patches may break** - Discord updates can change internal code patterns. If the plugin stops working after a Discord update, the patches may need updating.
- **Imgur results** - Imgur's API returns mixed content, so only animated GIFs are filtered.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

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

3. **Current Status**: This plugin is a user plugin. If you want it official, consider:
   - Opening an issue requesting official submission
   - Contributing to make it meet Vencord's standards

## 📄 License

This project is licensed under GPL-3.0-or-later, same as Vencord.

## 🙏 Credits

- [Vencord](https://github.com/Vendicated/Vencord) - The amazing Discord client mod
- All the GIF providers for their APIs

---

<div align="center">

**Made with ❤️ for the Vencord community**

</div>
