/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { RestAPI } from "@webpack/common";

// Tenor Web API credentials (same key used by tenor.com's frontend)
const TENOR_WEB_API_KEY = "AIzaSyCZt6SSh5VgVPzD9fhyzG1DprdPRhtoaR4";
const TENOR_WEB_CLIENT_KEY = "tenor_web";
const TENOR_WEB_BASE = "https://tenor.googleapis.com/v2";

export const settings = definePluginSettings({
    provider: {
        type: OptionType.SELECT,
        description: "Choose your preferred GIF provider",
        options: [
            { label: "Tenor (Web)", value: "tenor_web", default: true },
            { label: "Giphy (API key required)", value: "giphy" },
            { label: "Klipy (API key required)", value: "klipy" },
            { label: "Serika GIFs", value: "serika" },
            { label: "Imgur (Client ID required)", value: "imgur" },
        ],
    },
    giphyApiKey: {
        type: OptionType.STRING,
        description: "Giphy API key (get one at developers.giphy.com)",
        default: "",
    },
    klipyApiKey: {
        type: OptionType.STRING,
        description: "Klipy API key (get one at klipy.com/developers)",
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

interface DiscordCategory {
    name: string;
    src: string;
}

// Cache for categories
let categoriesCache: DiscordCategory[] | null = null;
let categoriesCacheTime = 0;
let cachedProvider: string | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Safe fetch wrapper — never throws, returns null on failure
async function safeFetch(url: string, options?: RequestInit): Promise<any | null> {
    try {
        const native = (window as any).VencordNative;
        if (native && native.csp) {
            try {
                const parsedUrl = new URL(url);
                const origin = parsedUrl.origin;
                const allowed = await native.csp.isDomainAllowed(origin, ["connect-src"]);
                if (!allowed) {
                    console.log(`[GifProvider] Requesting CSP override for: ${origin}`);
                    await native.csp.requestAddOverride(origin, ["connect-src"], "GifProvider");
                }
            } catch (cspErr) {
                console.error("[GifProvider] CSP override request failed:", cspErr);
            }
        }
        const res = await fetch(url, options);
        if (!res.ok) {
            console.warn(`[GifProvider] Fetch failed (${res.status}): ${url.substring(0, 100)}`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error("[GifProvider] Fetch error:", err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  TENOR WEB
//  Uses the public API key that tenor.com's frontend uses.
//  Endpoint: https://tenor.googleapis.com/v2/{search|featured|categories}
//  Response: { results: [{ id, title, content_description, media_formats: { gif: { url, dims }, tinygif: { url, dims } } }] }
// ─────────────────────────────────────────────────────────────────────────────

function transformTenorWebToDiscord(data: any): DiscordGif[] {
    if (!data?.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => {
        const formats = item.media_formats || {};
        const webmFormat = formats.webm || formats.tinywebm || {};
        const tinyWebmFormat = formats.tinywebm || formats.nanowebm || webmFormat;
        const gifFormat = formats.gif || formats.mediumgif || formats.tinygif || {};
        const previewFormat = tinyWebmFormat.url ? tinyWebmFormat : (formats.tinygif || formats.nanogif || gifFormat);
        const dims = webmFormat.dims || gifFormat.dims || [200, 200];

        return {
            id: item.id || Math.random().toString(36).slice(2),
            title: item.title || item.content_description || "",
            url: item.itemurl || item.url || gifFormat.url || "",
            src: webmFormat.url || gifFormat.url || "",
            gif_src: gifFormat.url || "",
            width: dims[0] || 200,
            height: dims[1] || 200,
            preview: previewFormat.url || gifFormat.url || "",
        };
    }).filter((gif: DiscordGif) => gif.url);
}

function transformTenorCategoriesToDiscord(data: any): DiscordCategory[] {
    if (!data?.tags || !Array.isArray(data.tags)) return [];

    return data.tags
        .filter((tag: any) => tag.name && tag.image)
        .map((tag: any) => ({
            name: tag.name.replace(/^#/, ""),
            src: tag.image,
        }));
}

// ─────────────────────────────────────────────────────────────────────────────
//  GIPHY
//  Endpoint: https://api.giphy.com/v1/gifs/{search|trending}?api_key=...
//  Response: { data: [{ id, title, images: { original: { url, width, height }, fixed_height_small: { url } } }] }
// ─────────────────────────────────────────────────────────────────────────────

function transformGiphyToDiscord(data: any): DiscordGif[] {
    if (!data?.data || !Array.isArray(data.data)) return [];

    return data.data.map((gif: any) => {
        const original = gif.images?.original || {};
        const preview = gif.images?.fixed_height_small || gif.images?.preview_gif || {};
        return {
            id: gif.id || Math.random().toString(36).slice(2),
            title: gif.title || "",
            url: original.url || gif.images?.downsized?.url || "",
            src: original.url || gif.images?.downsized?.url || "",
            gif_src: original.url || gif.images?.downsized?.url || "",
            width: parseInt(original.width) || 200,
            height: parseInt(original.height) || 200,
            preview: preview.url || original.url || "",
        };
    }).filter((gif: DiscordGif) => gif.url);
}

// ─────────────────────────────────────────────────────────────────────────────
//  SERIKA GIFS
//  Endpoint: https://gifs.serika.dev/api/gifs?search=...&limit=...&sort=trending
//  Response: { gifs: [{ id, slug, title, url, webmUrl, thumbnailUrl, width, height }] }
//  Tags:     https://gifs.serika.dev/api/tags?limit=...
//  Response: { tags: [{ id, name, slug, count }] }
// ─────────────────────────────────────────────────────────────────────────────

function transformSerikaToDiscord(data: any): DiscordGif[] {
    const gifs = data?.gifs || data?.data || [];
    if (!Array.isArray(gifs)) return [];

    return gifs.map((gif: any) => {
        const gifUrl = gif.url || gif.originalUrl || "";
        const webmUrl = gif.webmUrl || gifUrl.replace(/\.gif$/i, ".webm");
        return {
            id: gif.id?.toString() || gif.slug || Math.random().toString(36).slice(2),
            title: gif.title || "",
            url: gifUrl,
            src: webmUrl,
            gif_src: gifUrl,
            width: gif.width || 200,
            height: gif.height || 200,
            preview: gif.thumbnailUrl || webmUrl,
        };
    }).filter((gif: DiscordGif) => gif.url);
}

// ─────────────────────────────────────────────────────────────────────────────
//  IMGUR
//  Endpoint: https://api.imgur.com/3/gallery/search?q=...&q_type=anigif
//  Auth:     Authorization: Client-ID {client_id}
//  Response: { data: [{ is_album, images: [{ id, animated, type, link, mp4, width, height }] }] }
//
//  IMPORTANT: Imgur gallery search returns ALBUMS with nested images arrays.
//  We need to flatten albums and extract individual animated images.
// ─────────────────────────────────────────────────────────────────────────────

function transformImgurToDiscord(data: any): DiscordGif[] {
    if (!data?.data || !Array.isArray(data.data)) return [];

    const results: DiscordGif[] = [];

    for (const item of data.data) {
        // Albums contain nested images array
        if (item.is_album && Array.isArray(item.images)) {
            for (const img of item.images) {
                if (img.animated || img.type?.includes("gif") || img.mp4 || img.link?.endsWith(".gif")) {
                    results.push({
                        id: img.id || Math.random().toString(36).slice(2),
                        title: item.title || img.title || img.description || "",
                        url: img.mp4 || img.link || "",
                        src: img.mp4 || img.link || "",
                        gif_src: img.link || "",
                        width: img.width || 200,
                        height: img.height || 200,
                        preview: img.link ? img.link.replace(/\.gif$/i, "s.gif") : img.link || "",
                    });
                }
            }
        }
        // Direct image (non-album gallery item)
        else if (item.animated || item.type?.includes("gif") || item.mp4 || item.link?.endsWith(".gif")) {
            results.push({
                id: item.id || Math.random().toString(36).slice(2),
                title: item.title || item.description || "",
                url: item.mp4 || item.link || "",
                src: item.mp4 || item.link || "",
                gif_src: item.link || "",
                width: item.width || 200,
                height: item.height || 200,
                preview: item.link ? item.link.replace(/\.gif$/i, "s.gif") : item.link || "",
            });
        }
    }

    return results.filter(gif => gif.url);
}

// ─────────────────────────────────────────────────────────────────────────────
//  KLIPY
//  Endpoint: https://api.klipy.com/api/v1/{API_KEY}/gifs/{search|trending}?q=...&limit=...
//  NOTE: API key goes in the URL path, NOT as a query parameter!
//  Response: { result: true, data: { data: [{ id, slug, title, file: { hd: { gif: { url, width, height } }, sm: { gif: { url } } } }] } }
// ─────────────────────────────────────────────────────────────────────────────

function transformKlipyToDiscord(data: any): DiscordGif[] {
    // Klipy wraps response in { result, data: { data: [...] } }
    const items = data?.data?.data || data?.data || data?.results || [];
    if (!Array.isArray(items)) return [];

    return items.map((gif: any) => {
        const file = gif.file || {};
        // Prefer HD gif, fall back to MD, then SM
        const hdGif = file.hd?.gif || file.md?.gif || file.sm?.gif || {};
        const previewGif = file.sm?.gif || file.xs?.gif || hdGif;

        return {
            id: gif.id?.toString() || gif.slug || Math.random().toString(36).slice(2),
            title: gif.title || "",
            url: hdGif.url || "",
            src: hdGif.url || "",
            gif_src: hdGif.url || "",
            width: hdGif.width || 200,
            height: hdGif.height || 200,
            preview: previewGif.url || hdGif.url || "",
        };
    }).filter((gif: DiscordGif) => gif.url);
}

// ─── Category fetchers ──────────────────────────────────────────────────────

async function fetchTenorWebCategories(): Promise<DiscordCategory[]> {
    if (categoriesCache && Date.now() - categoriesCacheTime < CACHE_DURATION) {
        return categoriesCache;
    }

    const data = await safeFetch(
        `${TENOR_WEB_BASE}/categories?key=${TENOR_WEB_API_KEY}&client_key=${TENOR_WEB_CLIENT_KEY}&contentfilter=low`
    );
    if (!data) return [];

    const categories = transformTenorCategoriesToDiscord(data);
    categoriesCache = categories;
    categoriesCacheTime = Date.now();
    return categories;
}

async function fetchSerikaCategories(): Promise<DiscordCategory[]> {
    if (categoriesCache && Date.now() - categoriesCacheTime < CACHE_DURATION) {
        return categoriesCache;
    }

    const baseUrl = settings.store.serikaInstance.replace(/\/$/, "");
    const apiKey = settings.store.serikaApiKey?.trim();
    const headers: Record<string, string> = {};
    if (apiKey) headers["X-API-Key"] = apiKey;

    const tagsData = await safeFetch(`${baseUrl}/api/tags?limit=30`, { headers });
    if (!tagsData) return [];

    const tags = tagsData.tags || [];
    const categories: DiscordCategory[] = [];

    // Fetch sample GIFs for top tags in parallel
    const tagPromises = tags.slice(0, 20).map(async (tag: any) => {
        try {
            const gifData = await safeFetch(`${baseUrl}/api/gifs?tag=${tag.slug}&limit=1&sort=views`, { headers });
            const gif = gifData?.gifs?.[0];
            if (gif) {
                return {
                    name: tag.name,
                    src: gif.thumbnailUrl || gif.webmUrl || gif.url?.replace(/\.gif$/i, ".webm") || "",
                };
            }
        } catch { /* ignore */ }
        return null;
    });

    const results = await Promise.all(tagPromises);
    for (const cat of results) {
        if (cat && cat.src) categories.push(cat);
    }

    categoriesCache = categories;
    categoriesCacheTime = Date.now();
    return categories;
}

async function fetchCategories(): Promise<DiscordCategory[]> {
    const provider = settings.store.provider;
    if (cachedProvider !== provider) {
        categoriesCache = null;
        categoriesCacheTime = 0;
        cachedProvider = provider;
    }
    try {
        switch (provider) {
            case "tenor_web": return await fetchTenorWebCategories();
            case "serika": return await fetchSerikaCategories();
            default: return [];
        }
    } catch (err) {
        console.error("[GifProvider] Categories error:", err);
        return [];
    }
}

// ─── Search / Trending ──────────────────────────────────────────────────────

async function searchFromProvider(query: string, limit: number = 50): Promise<DiscordGif[]> {
    const provider = settings.store.provider;

    try {
        switch (provider) {
            case "tenor_web": {
                const data = await safeFetch(
                    `${TENOR_WEB_BASE}/search?key=${TENOR_WEB_API_KEY}&client_key=${TENOR_WEB_CLIENT_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&contentfilter=low`
                );
                return transformTenorWebToDiscord(data);
            }
            case "giphy": {
                const apiKey = settings.store.giphyApiKey?.trim();
                if (!apiKey) {
                    console.warn("[GifProvider] Giphy requires an API key");
                    return [];
                }
                const data = await safeFetch(
                    `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}&api_key=${apiKey}`
                );
                return transformGiphyToDiscord(data);
            }
            case "serika": {
                const baseUrl = settings.store.serikaInstance.replace(/\/$/, "");
                const apiKey = settings.store.serikaApiKey?.trim();
                const headers: Record<string, string> = {};
                if (apiKey) headers["X-API-Key"] = apiKey;
                const data = await safeFetch(
                    `${baseUrl}/api/gifs?search=${encodeURIComponent(query)}&limit=${limit}`,
                    { headers }
                );
                return transformSerikaToDiscord(data);
            }
            case "imgur": {
                const clientId = settings.store.imgurClientId?.trim();
                if (!clientId) {
                    console.warn("[GifProvider] Imgur requires a Client ID");
                    return [];
                }
                // Imgur gallery search with animated filter
                const data = await safeFetch(
                    `https://api.imgur.com/3/gallery/search?q=${encodeURIComponent(query)}&q_type=anigif`,
                    { headers: { Authorization: `Client-ID ${clientId}` } }
                );
                return transformImgurToDiscord(data).slice(0, limit);
            }
            case "klipy": {
                const apiKey = settings.store.klipyApiKey?.trim();
                if (!apiKey) {
                    console.warn("[GifProvider] Klipy requires an API key");
                    return [];
                }
                // Klipy: API key goes in URL path
                const data = await safeFetch(
                    `https://api.klipy.com/api/v1/${apiKey}/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}`
                );
                return transformKlipyToDiscord(data);
            }
            default: return [];
        }
    } catch (err) {
        console.error("[GifProvider] Search error:", err);
        return [];
    }
}

async function trendingFromProvider(limit: number = 50): Promise<DiscordGif[]> {
    const provider = settings.store.provider;

    try {
        switch (provider) {
            case "tenor_web": {
                const data = await safeFetch(
                    `${TENOR_WEB_BASE}/featured?key=${TENOR_WEB_API_KEY}&client_key=${TENOR_WEB_CLIENT_KEY}&limit=${limit}&contentfilter=low`
                );
                return transformTenorWebToDiscord(data);
            }
            case "giphy": {
                const apiKey = settings.store.giphyApiKey?.trim();
                if (!apiKey) return [];
                const data = await safeFetch(
                    `https://api.giphy.com/v1/gifs/trending?limit=${limit}&api_key=${apiKey}`
                );
                return transformGiphyToDiscord(data);
            }
            case "serika": {
                const baseUrl = settings.store.serikaInstance.replace(/\/$/, "");
                const apiKey = settings.store.serikaApiKey?.trim();
                const headers: Record<string, string> = {};
                if (apiKey) headers["X-API-Key"] = apiKey;
                const data = await safeFetch(
                    `${baseUrl}/api/gifs?sort=trending&limit=${limit}`,
                    { headers }
                );
                return transformSerikaToDiscord(data);
            }
            case "imgur": {
                const clientId = settings.store.imgurClientId?.trim();
                if (!clientId) return [];
                // Imgur viral gallery (trending animated content)
                const data = await safeFetch(
                    `https://api.imgur.com/3/gallery/hot/viral/0`,
                    { headers: { Authorization: `Client-ID ${clientId}` } }
                );
                return transformImgurToDiscord(data).slice(0, limit);
            }
            case "klipy": {
                const apiKey = settings.store.klipyApiKey?.trim();
                if (!apiKey) return [];
                // Klipy: API key goes in URL path
                const data = await safeFetch(
                    `https://api.klipy.com/api/v1/${apiKey}/gifs/trending?limit=${limit}`
                );
                return transformKlipyToDiscord(data);
            }
            default: return [];
        }
    } catch (err) {
        console.error("[GifProvider] Trending error:", err);
        return [];
    }
}

// ─── Placeholder Management ──────────────────────────────────────────────────

let observer: MutationObserver | null = null;
let localizedSearchVerb = "";

function getSearchPlaceholder(provider: string): string {
    const providerNames: Record<string, string> = {
        tenor_web: "Tenor",
        giphy: "GIPHY",
        klipy: "Klipy",
        serika: "Serika GIFs",
        imgur: "Imgur"
    };
    const name = providerNames[provider] || "GIFs";
    
    // Default fallback
    const verb = localizedSearchVerb || "Search";
    return `${verb} ${name}`;
}

function patchPlaceholder() {
    const provider = settings.store.provider;
    const targetPlaceholder = getSearchPlaceholder(provider);

    // Find all search inputs in the expression picker / GIF picker
    const inputs = document.querySelectorAll<HTMLInputElement>(
        '#gif-picker-tab-panel input[placeholder], [class*="expressionPicker"] input[placeholder], [class*="searchBar"] input[placeholder], input[class*="searchBar"]'
    );
    
    for (const input of inputs) {
        const isGifSearch = input.closest('#gif-picker-tab-panel') ||
                            (input.closest('[class*="expressionPicker"]') && 
                             (document.querySelector('[class*="gifPicker"]') || 
                              input.placeholder.toLowerCase().includes("gif") || 
                              input.placeholder.toLowerCase().includes("tenor") || 
                              input.placeholder.toLowerCase().includes("giphy") ||
                              input.placeholder.toLowerCase().includes("klipy") ||
                              input.placeholder.toLowerCase().includes("serika") ||
                              input.placeholder.toLowerCase().includes("imgur")));
        
        if (isGifSearch) {
            // Keep track of the localized verb from the initial placeholder if we haven't already
            if (!localizedSearchVerb) {
                const currentPlaceholder = input.placeholder;
                if (currentPlaceholder && !currentPlaceholder.startsWith("Search ")) {
                    const words = currentPlaceholder.trim().split(/\s+/);
                    if (words.length > 1) {
                        // Assuming the first word is the verb (e.g. "Rechercher", "Buscar")
                        localizedSearchVerb = words[0];
                    }
                }
            }

            if (input.placeholder !== targetPlaceholder) {
                input.placeholder = targetPlaceholder;
                input.setAttribute("placeholder", targetPlaceholder);
                input.setAttribute("aria-label", targetPlaceholder);
            }
        }
    }
}

function startPlaceholderObserver() {
    if (observer) observer.disconnect();
    
    observer = new MutationObserver(() => {
        patchPlaceholder();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Run once immediately
    patchPlaceholder();
}

function stopPlaceholderObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    localizedSearchVerb = "";
}

// ─── Plugin definition ──────────────────────────────────────────────────────

export default definePlugin({
    name: "GifProvider",
    description: "Switch between different GIF providers (Tenor Web, Giphy, Klipy, Serika GIFs, Imgur)",
    authors: [Devs.Serika],
    settings,

    // Expose functions for console testing
    searchGifs: searchFromProvider,
    trendingGifs: trendingFromProvider,

    originalGet: null as any,
    _stopped: false,

    start() {
        this._stopped = false;
        // Reset category cache when switching providers
        categoriesCache = null;
        categoriesCacheTime = 0;

        console.log("[GifProvider] Started with provider:", settings.store.provider);

        // Store original RestAPI.get
        this.originalGet = RestAPI.get.bind(RestAPI);

        // Proxy RestAPI.get to intercept GIF requests
        const self = this;
        RestAPI.get = function (options: any) {
            // Guard: if plugin was stopped, don't intercept
            if (self._stopped) {
                return self.originalGet(options);
            }

            const url = options?.url || "";

            try {
                // Intercept GIF search
                if (url.includes("/gifs/search") || url.includes("gifs/search")) {
                    const query = options?.query?.q || "";
                    console.log("[GifProvider] Intercepted search:", query);
                    return self.handleSearch(query);
                }

                // /gifs/trending-gifs returns just an array
                if (url.includes("/gifs/trending-gifs") || url.includes("gifs/trending-gifs")) {
                    console.log("[GifProvider] Intercepted trending-gifs");
                    return self.handleTrendingGifs();
                }

                // /gifs/trending returns { categories: [], gifs: [] }
                if (url.includes("/gifs/trending") || url.includes("gifs/trending")) {
                    console.log("[GifProvider] Intercepted trending");
                    return self.handleTrending();
                }
            } catch (err) {
                console.error("[GifProvider] Interception error:", err);
            }

            // Fall through to original for non-GIF requests
            return self.originalGet(options);
        };

        // Start watching for search input to patch its placeholder
        startPlaceholderObserver();

        // Expose to window for debugging
        (window as any).GifProvider = {
            search: searchFromProvider,
            trending: trendingFromProvider,
            categories: fetchCategories,
            settings: settings.store,
            plugin: this,
        };
        console.log("[GifProvider] Debug: Use window.GifProvider.search('cats') to test");
    },

    async handleSearch(query: string): Promise<any> {
        try {
            const gifs = await searchFromProvider(query, 50);
            console.log("[GifProvider] Search results:", gifs.length);
            return { body: gifs };
        } catch (err) {
            console.error("[GifProvider] handleSearch error:", err);
            return { body: [] };
        }
    },

    async handleTrending(): Promise<any> {
        try {
            const [categories, gifs] = await Promise.all([
                fetchCategories(),
                trendingFromProvider(50),
            ]);

            console.log("[GifProvider] Trending results:", gifs.length, "categories:", categories.length);
            return { body: { categories: categories, gifs: gifs } };
        } catch (err) {
            console.error("[GifProvider] handleTrending error:", err);
            return { body: { categories: [], gifs: [] } };
        }
    },

    async handleTrendingGifs(): Promise<any> {
        try {
            const gifs = await trendingFromProvider(50);
            console.log("[GifProvider] TrendingGifs results:", gifs.length);
            return { body: gifs };
        } catch (err) {
            console.error("[GifProvider] handleTrendingGifs error:", err);
            return { body: [] };
        }
    },

    stop() {
        console.log("[GifProvider] Stopped");
        this._stopped = true;
        if (this.originalGet) {
            RestAPI.get = this.originalGet;
        }
        
        // Stop placeholder observer
        stopPlaceholderObserver();

        // Clear cache on stop
        categoriesCache = null;
        categoriesCacheTime = 0;
        delete (window as any).GifProvider;
    },
});
