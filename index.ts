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
            { label: "Giphy", value: "giphy" },
            { label: "Klipy", value: "klipy" },
            { label: "Serika GIFs", value: "serika" },
            { label: "Imgur", value: "imgur" },
        ],
    },
    serikaInstance: {
        type: OptionType.STRING,
        description: "Serika GIFs instance URL (only used when Serika is selected)",
        default: "https://gifs.serika.dev",
    },
    serikaApiKey: {
        type: OptionType.STRING,
        description: "Serika GIFs API key (optional, for private instances)",
        default: "",
    },
});

// Provider configurations
const TENOR_API_KEY = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"; // Discord's public key
const GIPHY_API_KEY = "dc6zaTOxFJmzC"; // Public beta key

interface GifResult {
    id: string;
    title: string;
    url: string;
    src: string;
    preview: string;
    width: number;
    height: number;
}

// Transform functions for each provider
function transformTenorResults(data: any): GifResult[] {
    return (data.results || []).map((gif: any) => ({
        id: gif.id,
        title: gif.title || gif.content_description || "",
        url: gif.itemurl || gif.url,
        src: gif.media_formats?.gif?.url || gif.media_formats?.mediumgif?.url,
        preview: gif.media_formats?.tinygif?.url || gif.media_formats?.nanogif?.url,
        width: gif.media_formats?.gif?.dims?.[0] || 200,
        height: gif.media_formats?.gif?.dims?.[1] || 200,
    }));
}

function transformGiphyResults(data: any): GifResult[] {
    return (data.data || []).map((gif: any) => ({
        id: gif.id,
        title: gif.title || "",
        url: gif.url,
        src: gif.images?.original?.url,
        preview: gif.images?.fixed_height_small?.url || gif.images?.preview_gif?.url,
        width: parseInt(gif.images?.original?.width) || 200,
        height: parseInt(gif.images?.original?.height) || 200,
    }));
}

function transformKlipyResults(data: any): GifResult[] {
    const results = data.results || data.data || [];
    return results.map((gif: any) => ({
        id: gif.id,
        title: gif.title || "",
        url: gif.url || gif.itemurl,
        src: gif.gif_url || gif.media?.gif?.url || gif.url,
        preview: gif.preview_url || gif.media?.preview?.url || gif.url,
        width: gif.width || 200,
        height: gif.height || 200,
    }));
}

function transformSerikaResults(data: any, baseUrl: string): GifResult[] {
    const gifs = data.gifs || data.data || [];
    return gifs.map((gif: any) => ({
        id: gif.id || gif.slug,
        title: gif.title || "",
        url: `${baseUrl}/gif/${gif.slug}`,
        src: gif.url || gif.originalUrl,
        preview: gif.thumbnailUrl || gif.previewUrl || gif.url,
        width: gif.width || 200,
        height: gif.height || 200,
    }));
}

function transformImgurResults(data: any): GifResult[] {
    const items = data.data || [];
    return items
        .filter((item: any) => item.animated || item.type?.includes("gif") || item.mp4)
        .map((gif: any) => ({
            id: gif.id,
            title: gif.title || "",
            url: `https://imgur.com/${gif.id}`,
            src: gif.mp4 || gif.gifv || gif.link,
            preview: gif.link?.replace(".gif", "s.gif") || gif.link,
            width: gif.width || 200,
            height: gif.height || 200,
        }));
}

// Search functions for each provider
async function searchTenor(query: string, limit: number): Promise<GifResult[]> {
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&limit=${limit}&key=${TENOR_API_KEY}&client_key=discord&media_filter=tinygif,gif`;
    const res = await fetch(url);
    const data = await res.json();
    return transformTenorResults(data);
}

async function searchGiphy(query: string, limit: number): Promise<GifResult[]> {
    const url = `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}&api_key=${GIPHY_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return transformGiphyResults(data);
}

async function searchKlipy(query: string, limit: number): Promise<GifResult[]> {
    const url = `https://api.klipy.co/v1/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    const data = await res.json();
    return transformKlipyResults(data);
}

async function searchSerika(query: string, limit: number): Promise<GifResult[]> {
    const baseUrl = settings.store.serikaInstance.replace(/\/$/, "");
    const apiKey = settings.store.serikaApiKey;
    
    const headers: Record<string, string> = {};
    if (apiKey) {
        headers["X-API-Key"] = apiKey;
    }
    
    const url = `${baseUrl}/api/gifs?search=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    return transformSerikaResults(data, baseUrl);
}

async function searchImgur(query: string, limit: number): Promise<GifResult[]> {
    const url = `https://api.imgur.com/3/gallery/search?q=${encodeURIComponent(query)}&q_type=anigif`;
    const res = await fetch(url, {
        headers: {
            Authorization: "Client-ID 546c25a59c58ad7",
        },
    });
    const data = await res.json();
    return transformImgurResults(data).slice(0, limit);
}

// Trending functions for each provider
async function trendingTenor(limit: number): Promise<GifResult[]> {
    const url = `https://tenor.googleapis.com/v2/featured?limit=${limit}&key=${TENOR_API_KEY}&client_key=discord&media_filter=tinygif,gif`;
    const res = await fetch(url);
    const data = await res.json();
    return transformTenorResults(data);
}

async function trendingGiphy(limit: number): Promise<GifResult[]> {
    const url = `https://api.giphy.com/v1/gifs/trending?limit=${limit}&api_key=${GIPHY_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return transformGiphyResults(data);
}

async function trendingKlipy(limit: number): Promise<GifResult[]> {
    const url = `https://api.klipy.co/v1/gifs/trending?limit=${limit}`;
    const res = await fetch(url);
    const data = await res.json();
    return transformKlipyResults(data);
}

async function trendingSerika(limit: number): Promise<GifResult[]> {
    const baseUrl = settings.store.serikaInstance.replace(/\/$/, "");
    const apiKey = settings.store.serikaApiKey;
    
    const headers: Record<string, string> = {};
    if (apiKey) {
        headers["X-API-Key"] = apiKey;
    }
    
    const url = `${baseUrl}/api/gifs?sort=views&limit=${limit}`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    return transformSerikaResults(data, baseUrl);
}

async function trendingImgur(limit: number): Promise<GifResult[]> {
    const url = `https://api.imgur.com/3/gallery/hot/viral/0?showViral=true&album_previews=true`;
    const res = await fetch(url, {
        headers: {
            Authorization: "Client-ID 546c25a59c58ad7",
        },
    });
    const data = await res.json();
    return transformImgurResults(data).slice(0, limit);
}

// Main search dispatcher
async function searchGifs(query: string, limit = 30): Promise<GifResult[]> {
    const provider = settings.store.provider;
    
    try {
        switch (provider) {
            case "giphy":
                return await searchGiphy(query, limit);
            case "klipy":
                return await searchKlipy(query, limit);
            case "serika":
                return await searchSerika(query, limit);
            case "imgur":
                return await searchImgur(query, limit);
            case "tenor":
            default:
                return await searchTenor(query, limit);
        }
    } catch (error) {
        console.error(`[GifProvider] Error searching ${provider}:`, error);
        return [];
    }
}

// Main trending dispatcher
async function getTrendingGifs(limit = 30): Promise<GifResult[]> {
    const provider = settings.store.provider;
    
    try {
        switch (provider) {
            case "giphy":
                return await trendingGiphy(limit);
            case "klipy":
                return await trendingKlipy(limit);
            case "serika":
                return await trendingSerika(limit);
            case "imgur":
                return await trendingImgur(limit);
            case "tenor":
            default:
                return await trendingTenor(limit);
        }
    } catch (error) {
        console.error(`[GifProvider] Error fetching trending from ${provider}:`, error);
        return [];
    }
}

export default definePlugin({
    name: "GifProvider",
    description: "Switch between different GIF providers (Tenor, Giphy, Klipy, Serika GIFs, Imgur)",
    authors: [Devs.Ven], // Replace with your author entry
    settings,

    // Note: These patches are experimental and may need adjustment based on
    // Discord's current webpack bundles. GIF picker internals change frequently.
    // Use the Patch Helper in Vencord settings to find current patterns if needed.
    patches: [
        // Intercept GIF search
        {
            find: '"handleSelectGIF",',
            replacement: {
                match: /search:async function\((\w+),(\w+)\)\{/,
                replace: "search:async function($1,$2){if($self.shouldIntercept())return $self.handleSearch($1,$2);"
            },
            noWarn: true,
        },
    ],

    shouldIntercept() {
        return settings.store.provider !== "tenor";
    },

    getProviderName() {
        const names: Record<string, string> = {
            tenor: "Tenor",
            giphy: "Giphy",
            klipy: "Klipy",
            serika: "Serika",
            imgur: "Imgur",
        };
        return names[settings.store.provider] || "Tenor";
    },

    async handleSearch(query: string, limit?: number) {
        const results = await searchGifs(query, limit || 30);
        return {
            gifs: results.map(gif => ({
                id: gif.id,
                title: gif.title,
                url: gif.src,
                src: gif.src,
                gifv: gif.src,
                width: gif.width,
                height: gif.height,
                preview: gif.preview,
            })),
        };
    },

    async handleTrending(limit?: number) {
        const results = await getTrendingGifs(limit || 30);
        return {
            gifs: results.map(gif => ({
                id: gif.id,
                title: gif.title,
                url: gif.src,
                src: gif.src,
                gifv: gif.src,
                width: gif.width,
                height: gif.height,
                preview: gif.preview,
            })),
        };
    },

    // Expose functions for debugging / console usage
    searchGifs,
    getTrendingGifs,

    start() {
        console.log(`[GifProvider] Started with provider: ${settings.store.provider}`);
    },

    stop() {
        console.log("[GifProvider] Stopped");
    },
});
