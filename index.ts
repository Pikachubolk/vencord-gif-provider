/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { RestAPI } from "@webpack/common";

export const settings = definePluginSettings({
    provider: {
        type: OptionType.SELECT,
        description: "Choose your preferred GIF provider",
        options: [
            { label: "Tenor (Default)", value: "tenor", default: true },
            { label: "Giphy (API key required)", value: "giphy" },
            { label: "Klipy (API key required)", value: "klipy" },
            { label: "Serika GIFs", value: "serika" },
            { label: "Imgur (API key required)", value: "imgur" },
        ],
    },
    giphyApiKey: {
        type: OptionType.STRING,
        description: "Giphy API key (get one at developers.giphy.com)",
        default: "",
    },
    klipyApiKey: {
        type: OptionType.STRING,
        description: "Klipy API key",
        default: "",
    },
    imgurClientId: {
        type: OptionType.STRING,
        description: "Imgur Client ID (get one at api.imgur.com)",
        default: "",
    },
    serikaInstance: {
        type: OptionType.STRING,
        description: "Serika GIFs instance URL",
        default: "https://gifs.serika.dev",
    },
    serikaApiKey: {
        type: OptionType.STRING,
        description: "Serika GIFs API key (optional, bypasses rate limits)",
        default: "",
    },
});

// Discord GIF format interface
interface DiscordGif {
    id: string;
    title: string;
    url: string;
    src: string;
    gif_src: string;
    width: number;
    height: number;
    preview: string;
}

// Transform Giphy response to Discord GIF format
function transformGiphyToDiscord(data: any): DiscordGif[] {
    return (data.data || []).map((gif: any) => ({
        id: gif.id,
        title: gif.title || "",
        url: gif.images?.original?.url || gif.images?.downsized?.url,
        src: gif.images?.original?.url || gif.images?.downsized?.url,
        gif_src: gif.images?.original?.url || gif.images?.downsized?.url,
        width: parseInt(gif.images?.original?.width) || 200,
        height: parseInt(gif.images?.original?.height) || 200,
        preview: gif.images?.fixed_height_small?.url || gif.images?.preview_gif?.url
    }));
}

// Transform Serika response to Discord GIF format
function transformSerikaToDiscord(data: any): DiscordGif[] {
    const gifs = data.gifs || data.data || [];
    return gifs.map((gif: any) => {
        // gif.url is the actual .gif file URL (e.g. https://cdn.ado.wtf/gifs/.../xxx.gif)
        const gifUrl = gif.url || gif.originalUrl;
        return {
            id: gif.id?.toString() || gif.slug || Math.random().toString(36),
            title: gif.title || "",
            url: gifUrl,      // URL to post in chat (the actual gif)
            src: gifUrl,      // Video source (Discord can use gif here)
            gif_src: gifUrl,  // GIF source
            width: gif.width || 200,
            height: gif.height || 200,
            preview: gifUrl   // Preview image (use gif itself, Discord will handle it)
        };
    });
}

// Transform Imgur response to Discord GIF format
function transformImgurToDiscord(data: any): DiscordGif[] {
    const items = (data.data || []).filter((item: any) =>
        item.animated || item.type?.includes("gif") || item.mp4 || item.link?.endsWith(".gif")
    );
    return items.map((gif: any) => ({
        id: gif.id,
        title: gif.title || "",
        url: gif.mp4 || gif.link,
        src: gif.mp4 || gif.link,
        gif_src: gif.link,
        width: gif.width || 200,
        height: gif.height || 200,
        preview: gif.link?.replace(".gif", "s.gif") || gif.link
    }));
}

// Transform Klipy response to Discord GIF format
function transformKlipyToDiscord(data: any): DiscordGif[] {
    const results = data.results || data.data || [];
    return results.map((gif: any) => ({
        id: gif.id,
        title: gif.title || "",
        url: gif.gif_url || gif.media?.gif?.url || gif.url,
        src: gif.gif_url || gif.media?.gif?.url || gif.url,
        gif_src: gif.gif_url || gif.media?.gif?.url || gif.url,
        width: gif.width || 200,
        height: gif.height || 200,
        preview: gif.preview_url || gif.media?.preview?.url || gif.url
    }));
}

// Search GIFs from provider
async function searchFromProvider(query: string, limit: number = 50): Promise<DiscordGif[]> {
    const provider = settings.store.provider;
    if (provider === "tenor") return [];

    try {
        switch (provider) {
            case "giphy": {
                const apiKey = settings.store.giphyApiKey?.trim();
                if (!apiKey) {
                    console.warn("[GifProvider] Giphy requires an API key");
                    return [];
                }
                const res = await fetch(`https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}&api_key=${apiKey}`);
                return transformGiphyToDiscord(await res.json());
            }
            case "serika": {
                const baseUrl = settings.store.serikaInstance.replace(/\/$/, "");
                const apiKey = settings.store.serikaApiKey?.trim();
                const headers: Record<string, string> = {};
                if (apiKey) headers["X-API-Key"] = apiKey;
                const res = await fetch(`${baseUrl}/api/gifs?search=${encodeURIComponent(query)}&limit=${limit}`, { headers });
                return transformSerikaToDiscord(await res.json());
            }
            case "imgur": {
                const clientId = settings.store.imgurClientId?.trim();
                if (!clientId) {
                    console.warn("[GifProvider] Imgur requires a Client ID");
                    return [];
                }
                const res = await fetch(`https://api.imgur.com/3/gallery/search?q=${encodeURIComponent(query)}&q_type=anigif`, {
                    headers: { Authorization: `Client-ID ${clientId}` }
                });
                return transformImgurToDiscord(await res.json()).slice(0, limit);
            }
            case "klipy": {
                const apiKey = settings.store.klipyApiKey?.trim();
                if (!apiKey) {
                    console.warn("[GifProvider] Klipy requires an API key");
                    return [];
                }
                const res = await fetch(`https://api.klipy.co/v1/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}&api_key=${apiKey}`);
                return transformKlipyToDiscord(await res.json());
            }
            default: return [];
        }
    } catch (err) {
        console.error("[GifProvider] Search error:", err);
        return [];
    }
}

// Get trending GIFs from provider
async function trendingFromProvider(limit: number = 50): Promise<DiscordGif[]> {
    const provider = settings.store.provider;
    if (provider === "tenor") return [];

    try {
        switch (provider) {
            case "giphy": {
                const apiKey = settings.store.giphyApiKey?.trim();
                if (!apiKey) return [];
                const res = await fetch(`https://api.giphy.com/v1/gifs/trending?limit=${limit}&api_key=${apiKey}`);
                return transformGiphyToDiscord(await res.json());
            }
            case "serika": {
                const baseUrl = settings.store.serikaInstance.replace(/\/$/, "");
                const apiKey = settings.store.serikaApiKey?.trim();
                const headers: Record<string, string> = {};
                if (apiKey) headers["X-API-Key"] = apiKey;
                const res = await fetch(`${baseUrl}/api/gifs?sort=views&limit=${limit}`, { headers });
                return transformSerikaToDiscord(await res.json());
            }
            case "imgur": {
                const clientId = settings.store.imgurClientId?.trim();
                if (!clientId) return [];
                const res = await fetch(`https://api.imgur.com/3/gallery/hot/viral/0`, {
                    headers: { Authorization: `Client-ID ${clientId}` }
                });
                return transformImgurToDiscord(await res.json()).slice(0, limit);
            }
            case "klipy": {
                const apiKey = settings.store.klipyApiKey?.trim();
                if (!apiKey) return [];
                const res = await fetch(`https://api.klipy.co/v1/gifs/trending?limit=${limit}&api_key=${apiKey}`);
                return transformKlipyToDiscord(await res.json());
            }
            default: return [];
        }
    } catch (err) {
        console.error("[GifProvider] Trending error:", err);
        return [];
    }
}

export default definePlugin({
    name: "GifProvider",
    description: "Switch between different GIF providers (Tenor, Giphy, Klipy, Serika GIFs, Imgur)",
    authors: [Devs.Ven],
    settings,

    // Expose functions for console testing
    searchGifs: searchFromProvider,
    trendingGifs: trendingFromProvider,

    originalGet: null as any,

    start() {
        console.log("[GifProvider] Started with provider:", settings.store.provider);

        // Store original RestAPI.get
        this.originalGet = RestAPI.get.bind(RestAPI);

        // Proxy RestAPI.get to intercept GIF requests
        const self = this;
        RestAPI.get = function(options: any) {
            const url = options?.url || "";

            // Check if this is a GIF search or trending request
            if (settings.store.provider !== "tenor") {
                if (url.includes("/gifs/search") || url.includes("gifs/search")) {
                    const query = options?.query?.q || "";
                    console.log("[GifProvider] Intercepted search:", query, url);
                    return self.handleSearch(query);
                }

                // /gifs/trending-gifs returns just an array
                if (url.includes("/gifs/trending-gifs") || url.includes("gifs/trending-gifs")) {
                    console.log("[GifProvider] Intercepted trending-gifs:", url);
                    return self.handleTrendingGifs();
                }

                // /gifs/trending returns { categories: [], gifs: [] }
                if (url.includes("/gifs/trending") || url.includes("gifs/trending")) {
                    console.log("[GifProvider] Intercepted trending:", url);
                    return self.handleTrending();
                }
            }

            // Fall through to original
            return self.originalGet(options);
        };

        // Expose to window for debugging
        (window as any).GifProvider = {
            search: searchFromProvider,
            trending: trendingFromProvider,
            settings: settings.store,
            plugin: this
        };
        console.log("[GifProvider] Debug: Use window.GifProvider.search('cats') to test");
    },

    async handleSearch(query: string): Promise<any> {
        try {
            const gifs = await searchFromProvider(query, 50);
            console.log("[GifProvider] Search results:", gifs.length);
            if (gifs.length > 0) {
                // Return array directly for search results
                return { body: gifs };
            }
        } catch (err) {
            console.error("[GifProvider] Search error:", err);
        }
        // Fall back to original
        return this.originalGet({ url: "/gifs/search", query: { q: query } });
    },

    async handleTrending(): Promise<any> {
        try {
            const gifs = await trendingFromProvider(50);
            console.log("[GifProvider] Trending results:", gifs.length);
            if (gifs.length > 0) {
                // Discord /gifs/trending expects { categories: [], gifs: [] }
                return { body: { categories: [], gifs: gifs } };
            }
        } catch (err) {
            console.error("[GifProvider] Trending error:", err);
        }
        // Fall back to original
        return this.originalGet({ url: "/gifs/trending" });
    },

    async handleTrendingGifs(): Promise<any> {
        try {
            const gifs = await trendingFromProvider(50);
            console.log("[GifProvider] TrendingGifs results:", gifs.length);
            if (gifs.length > 0) {
                // Discord /gifs/trending-gifs expects just an array
                return { body: gifs };
            }
        } catch (err) {
            console.error("[GifProvider] TrendingGifs error:", err);
        }
        // Fall back to original
        return this.originalGet({ url: "/gifs/trending-gifs" });
    },

    stop() {
        console.log("[GifProvider] Stopped");
        // Restore original RestAPI.get
        if (this.originalGet) {
            RestAPI.get = this.originalGet;
        }
        delete (window as any).GifProvider;
    }
});
