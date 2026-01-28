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
- 🏠 **Self-hosted support** - Use your own [Serika GIFs](https://github.com/serika-dev/serika-gifs) instance
- 🔒 **API key support** - Configure private instances with authentication
- 🎨 **Clean integration** - Seamlessly replaces Discord's default GIF picker

## 🎯 Supported Providers

| Provider | Description | API Key Required |
|----------|-------------|------------------|
| **Tenor** | Discord's default provider | ❌ Built-in |
| **Giphy** | World's largest GIF library | ❌ Public beta |
| **Klipy** | Modern GIF platform | ❌ Optional |
| **Serika GIFs** | Self-hosted GIF library | ❌ Optional |
| **Imgur** | Popular image/GIF hosting | ❌ Built-in |

## 📦 Installation

### Prerequisites

You need [Vencord](https://vencord.dev) installed and built from source to use custom plugins.

### Quick Install

1. **Navigate to your Vencord source directory:**
   ```bash
   cd /path/to/Vencord
   ```

2. **Create the userplugins folder** (if it doesn't exist):
   ```bash
   mkdir -p src/userplugins
   ```

3. **Clone this plugin:**
   ```bash
   git clone https://github.com/Pikachubolk/vencord-gif-provider.git src/userplugins/GifProvider
   ```

4. **Build Vencord:**
   ```bash
   pnpm build
   ```

5. **Restart Discord** and enable the plugin in Vencord Settings → Plugins

### Manual Install

1. Download `index.ts` from this repository
2. Place it in `Vencord/src/userplugins/GifProvider/index.ts`
3. Build and restart as described above

## ⚙️ Configuration

Open **Vencord Settings** → **Plugins** → **GifProvider**

| Setting | Description | Default |
|---------|-------------|---------|
| **Provider** | Select your preferred GIF provider | Tenor |
| **Serika Instance** | URL of your Serika GIFs instance | `https://gifs.serika.dev` |
| **Serika API Key** | API key for private instances | - |

### Serika GIFs Setup

[Serika GIFs](https://github.com/serika-dev/serika-gifs) is a self-hosted GIF platform. To use it:

1. Deploy your own instance or use the public one at `https://gifs.serika.dev`
2. Select "Serika GIFs" as your provider
3. Enter your instance URL (e.g., `https://gifs.yourdomain.com`)
4. (Optional) Add your API key for private instances

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
| **Tenor** | Uses Discord's built-in API key for seamless integration |
| **Giphy** | Uses the public beta API key (`dc6zaTOxFJmzC`) |
| **Klipy** | Public API, optional key for higher limits |
| **Serika** | Fully configurable, supports authentication |
| **Imgur** | Uses public Client-ID for gallery searches |

## 🐛 Known Issues

- **Patches may break** - Discord updates can change internal code patterns. If the plugin stops working after a Discord update, the patches may need updating.
- **Imgur results** - Imgur's API returns mixed content, so only animated GIFs are filtered.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

This project is licensed under GPL-3.0-or-later, same as Vencord.

## 🙏 Credits

- [Vencord](https://github.com/Vendicated/Vencord) - The amazing Discord client mod
- [Serika GIFs](https://github.com/serika-dev/serika-gifs) - Self-hosted GIF platform
- All the GIF providers for their APIs

---

<div align="center">

**Made with ❤️ for the Vencord community**

</div>
