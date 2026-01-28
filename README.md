# GIF Provider Switcher

A Vencord plugin that allows you to switch between different GIF providers in Discord's GIF picker.

## Supported Providers

- **Tenor** (Default) - Discord's default GIF provider
- **Giphy** - The world's largest GIF library
- **Klipy** - A modern GIF platform
- **Serika GIFs** - Self-hosted GIF library (configurable instance URL)
- **Imgur** - Popular image and GIF hosting

## Installation

### For User Plugins

1. Go to your Vencord plugins folder:
   - Windows: `%appdata%/Vencord/plugins/`
   - macOS: `~/Library/Application Support/Vencord/plugins/`
   - Linux: `~/.config/Vencord/plugins/`

2. Create a folder called `GifProvider`

3. Copy `index.ts` into the `GifProvider` folder

4. Restart Discord or reload Vencord

### Building from Source

If you're developing Vencord locally:

1. Clone this repo into `src/userplugins/GifProvider/`
2. Build Vencord: `pnpm build`
3. The plugin will be available in your Vencord settings

## Configuration

Open Vencord Settings → Plugins → GIF Provider

### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Provider | Select your preferred GIF provider | Tenor |
| Serika Instance | URL of your Serika GIFs instance | https://gifs.serika.dev |
| Klipy API Key | Your Klipy API key (optional) | - |

## Usage

1. Enable the plugin in Vencord settings
2. Select your preferred provider from the dropdown
3. Open the GIF picker in Discord - it will now use your selected provider!

The GIF picker title will show which provider is currently active (e.g., "GIFs (Giphy)").

## API Notes

### Tenor
Uses Discord's built-in API key for seamless integration.

### Giphy
Uses the public beta API key. For production use, consider getting your own key.

### Klipy
Optional API key for higher rate limits.

### Serika GIFs
Configure your own instance URL. Compatible with self-hosted instances.

### Imgur
Searches Imgur's gallery for animated content.

## Development

```bash
# Clone the repo
git clone https://github.com/yourusername/vencord-gif-provider.git

# Install in Vencord userplugins
cp -r vencord-gif-provider /path/to/vencord/src/userplugins/GifProvider
```

## License

GPL-3.0-or-later - Same as Vencord

## Credits

- [Vencord](https://github.com/Vendicated/Vencord) - The Discord client mod
- [Serika GIFs](https://github.com/yourusername/SerikaGIFs) - Self-hosted GIF platform
