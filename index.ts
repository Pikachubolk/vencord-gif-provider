/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

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

// Transform Giphy response to Discord GIF format
function transformGiphyToDiscord(data: any) {
    return (data.data || []).map((gif: any) => ({
        id: gif.id,
        title: gif.title || "",
        url: gif.images?.original?.url || gif.images?.downsized?.url,
        src: gif.images?.original?.url || gif.images?.downsized?.url,
        gif_src: gif.images?.original?.url || gif.images?.downsized?.url,
        width: parseInt(gif.images?.original?.width) || 200,
        height: parseInt(gif.images?.original?.height) || 200,
        preview: gif.images?.fixed_height_small?.url || gif.images?.preview_gif?.url || gif.images?.downsized_small?.url
    }));
}

// Transform Serika response to Discord GIF format
function transformSerikaToDiscord(data: any) {
    const gifs = data.gifs || data.data || [];
    return gifs.map((gif: any) => ({
        id: gif.id?.toString() || gif.slug || Math.random().toString(36),
        title: gif.title || "",
        url: gif.url || gif.originalUrl,
        src: gif.url || gif.originalUrl,
        gif_src: gif.url || gif.originalUrl,
        width: gif.width || 200,
        height: gif.height || 200,
        preview: gif.thumbnailUrl || gif.previewUrl || gif.url
    }));
}

// Transform Imgur response to Discord GIF format
function transformImgurToDiscord(data: any) {
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
function transformKlipyToDiscord(data: any) {
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

async function fetchFromProvider(query: string, limit: number, type: "search" | "trending"): Promise<any[]> {
    const provider = settings.store.provider;
    console.log(`[GifProvider] fetchFromProvider: ${type}, query="${query}", provider=${provider}`);

    switch (provider) {
        case "giphy": {
            const apiKey = settings.store.giphyApiKey?.trim();
            if (!apiKey) throw new Error("Giphy API key required");

            const endpoint = type === "search"
                ? `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}&api_key=${apiKey}`
                : `https://api.giphy.com/v1/gifs/trending?limit=${limit}&api_key=${apiKey}`;

            const res = await fetch(endpoint);
            const data = await res.json();
            return transformGiphyToDiscord(data);
        }

        case "serika": {
            const baseUrl = settings.store.serikaInstance.replace(/\/$/, "");
            const apiKey = settings.store.serikaApiKey?.trim();

            const headers: Record<string, string> = {};
            if (apiKey) headers["X-API-Key"] = apiKey;

            const endpoint = type === "search"
                ? `${baseUrl}/api/gifs?search=${encodeURIComponent(query)}&limit=${limit}`
                : `${baseUrl}/api/gifs?sort=views&limit=${limit}`;

            console.log(`[GifProvider] Fetching from Serika: ${endpoint}`);
            const res = await fetch(endpoint, { headers });
            const data = await res.json();
            console.log(`[GifProvider] Serika response:`, data);
            return transformSerikaToDiscord(data);
        }

        case "imgur": {
            const clientId = settings.store.imgurClientId?.trim();
            if (!clientId) throw new Error("Imgur Client ID required");

            const endpoint = type === "search"
                ? `https://api.imgur.com/3/gallery/search?q=${encodeURIComponent(query)}&q_type=anigif`
                : `https://api.imgur.com/3/gallery/hot/viral/0`;

            const res = await fetch(endpoint, {
                headers: { Authorization: `Client-ID ${clientId}` }
            });
            const data = await res.json();
            return transformImgurToDiscord(data).slice(0, limit);
        }

        case "klipy": {
            const apiKey = settings.store.klipyApiKey?.trim();
            if (!apiKey) throw new Error("Klipy API key required");

            const endpoint = type === "search"
                ? `https://api.klipy.co/v1/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}&api_key=${apiKey}`
                : `https://api.klipy.co/v1/gifs/trending?limit=${limit}&api_key=${apiKey}`;

            const res = await fetch(endpoint);
            const data = await res.json();
            return transformKlipyToDiscord(data);
        }

        default:
            throw new Error("Unknown provider");
    }
}

// Store references for cleanup
let originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
let originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;

export default definePlugin({
    name: "GifProvider",
    description: "Switch between different GIF providers (Tenor, Giphy, Klipy, Serika GIFs, Imgur)",
    authors: [Devs.Ven],
    settings,

    start() {
        console.log(`[GifProvider] Starting with provider: ${settings.store.provider}`);
        
        // Store originals
        originalXHROpen = XMLHttpRequest.prototype.open;
        originalXHRSend = XMLHttpRequest.prototype.send;
        
        const self = this;
        
        // Patch XMLHttpRequest.open to capture URL
        XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
            (this as any)._gifProviderUrl = url.toString();
            (this as any)._gifProviderMethod = method;
            return originalXHROpen!.apply(this, [method, url, ...args] as any);
        };
        
        // Patch XMLHttpRequest.send to intercept GIF requests
        XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
            const url = (this as any)._gifProviderUrl || "";
            
            // Check if this is a Discord GIF API call
            if (settings.store.provider !== "tenor" && 
                /^https:\/\/(ptb\.|canary\.)?discord\.com\/api\/v\d+\/gifs\/(search|trending|suggest)/i.test(url)) {
                
                console.log(`[GifProvider] Intercepting XHR: ${url}`);
                
                const urlObj = new URL(url);
                const isSearch = url.includes("/gifs/search");
                const isTrending = url.includes("/gifs/trending");
                const isSuggest = url.includes("/gifs/suggest");
                
                if (isSuggest) {
                    // Return empty suggestions
                    console.log("[GifProvider] Returning empty suggestions");
                    setTimeout(() => {
                        Object.defineProperty(this, "readyState", { value: 4, writable: true });
                        Object.defineProperty(this, "status", { value: 200, writable: true });
                        Object.defineProperty(this, "responseText", { value: "[]", writable: true });
                        Object.defineProperty(this, "response", { value: [], writable: true });
                        this.dispatchEvent(new Event("load"));
                        this.dispatchEvent(new Event("loadend"));
                    }, 0);
                    return;
                }
                
                const query = urlObj.searchParams.get("q") || "";
                const limit = parseInt(urlObj.searchParams.get("limit") || "50");
                const type = isSearch ? "search" : "trending";
                
                console.log(`[GifProvider] Fetching ${type} from ${settings.store.provider}, query="${query}"`);
                
                // Fetch from our provider
                fetchFromProvider(query, limit, type)
                    .then(gifs => {
                        console.log(`[GifProvider] Got ${gifs.length} results`);
                        const responseText = JSON.stringify(gifs);
                        
                        // Mock the XHR response
                        Object.defineProperty(this, "readyState", { value: 4, writable: true });
                        Object.defineProperty(this, "status", { value: 200, writable: true });
                        Object.defineProperty(this, "responseText", { value: responseText, writable: true });
                        Object.defineProperty(this, "response", { value: gifs, writable: true });
                        
                        this.dispatchEvent(new Event("readystatechange"));
                        this.dispatchEvent(new Event("load"));
                        this.dispatchEvent(new Event("loadend"));
                    })
                    .catch(err => {
                        console.error("[GifProvider] Error fetching:", err);
                        // On error, fall through to original
                        return originalXHRSend!.call(this, body);
                    });
                
                return;
            }
            
            // Pass through to original for non-GIF requests
            return originalXHRSend!.call(this, body);
        };
        
        console.log("[GifProvider] XHR interceptor installed");
    },

    stop() {
        // Restore original XHR methods
        if (originalXHROpen) {
            XMLHttpRequest.prototype.open = originalXHROpen;
            originalXHROpen = null;
        }
        if (originalXHRSend) {
            XMLHttpRequest.prototype.send = originalXHRSend;
            originalXHRSend = null;
        }
        console.log("[GifProvider] Stopped, XHR restored");
    }
});
