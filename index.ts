/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
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
        description: "Serika GIFs instance URL (if using Serika)",
        default: "https://gifs.serika.dev",
    },
    klipyApiKey: {
        type: OptionType.STRING,
        description: "Klipy API key (optional)",
        default: "",
    },
});

const PROVIDER_URLS = {
    tenor: "https://tenor.com",
    giphy: "https://giphy.com",
    klipy: "https://klipy.co",
    serika: "", // Dynamic based on settings
    imgur: "https://imgur.com",
};

const SEARCH_ENDPOINTS = {
    tenor: (query: string, limit: number) =>
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&limit=${limit}&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&client_key=discord&media_filter=tinygif,gif`,
    giphy: (query: string, limit: number) =>
        `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}&api_key=dc6zaTOxFJmzC`,
    klipy: (query: string, limit: number, apiKey?: string) =>
        `https://api.klipy.co/v1/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}${apiKey ? `&api_key=${apiKey}` : ""}`,
    serika: (query: string, limit: number, baseUrl: string) =>
        `${baseUrl}/api/gifs?search=${encodeURIComponent(query)}&limit=${limit}`,
    imgur: (query: string, limit: number) =>
        `https://api.imgur.com/3/gallery/search?q=${encodeURIComponent(query)}&limit=${limit}`,
};

const TRENDING_ENDPOINTS = {
    tenor: (limit: number) =>
        `https://tenor.googleapis.com/v2/featured?limit=${limit}&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&client_key=discord&media_filter=tinygif,gif`,
    giphy: (limit: number) =>
        `https://api.giphy.com/v1/gifs/trending?limit=${limit}&api_key=dc6zaTOxFJmzC`,
    klipy: (limit: number, apiKey?: string) =>
        `https://api.klipy.co/v1/gifs/trending?limit=${limit}${apiKey ? `&api_key=${apiKey}` : ""}`,
    serika: (limit: number, baseUrl: string) =>
        `${baseUrl}/api/gifs?sort=views&limit=${limit}`,
    imgur: (limit: number) =>
        `https://api.imgur.com/3/gallery/hot?limit=${limit}`,
};

interface GifResult {
    id: string;
    title: string;
    url: string;
    src: string;
    preview: string;
    width: number;
    height: number;
}

function transformTenorResults(data: any): GifResult[] {
    return (data.results || []).map((gif: any) => ({
        id: gif.id,
        title: gif.title || gif.content_description || "",
        url: gif.itemurl || gif.url,
        src: gif.media_formats?.gif?.url || gif.media_formats?.tinygif?.url,
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
    return (data.results || data.data || []).map((gif: any) => ({
        id: gif.id,
        title: gif.title || "",
        url: gif.url || gif.itemurl,
        src: gif.gif_url || gif.media?.gif?.url,
        preview: gif.preview_url || gif.media?.preview?.url,
        width: gif.width || 200,
        height: gif.height || 200,
    }));
}

function transformSerikaResults(data: any): GifResult[] {
    const baseUrl = settings.store.serikaInstance;
    return (data.gifs || data.data || []).map((gif: any) => ({
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

const TRANSFORMERS = {
    tenor: transformTenorResults,
    giphy: transformGiphyResults,
    klipy: transformKlipyResults,
    serika: transformSerikaResults,
    imgur: transformImgurResults,
};

async function searchGifs(query: string, limit = 30): Promise<GifResult[]> {
    const provider = settings.store.provider;

    let url: string;
    switch (provider) {
        case "tenor":
            url = SEARCH_ENDPOINTS.tenor(query, limit);
            break;
        case "giphy":
            url = SEARCH_ENDPOINTS.giphy(query, limit);
            break;
        case "klipy":
            url = SEARCH_ENDPOINTS.klipy(query, limit, settings.store.klipyApiKey);
            break;
        case "serika":
            url = SEARCH_ENDPOINTS.serika(query, limit, settings.store.serikaInstance);
            break;
        case "imgur":
            url = SEARCH_ENDPOINTS.imgur(query, limit);
            break;
        default:
            url = SEARCH_ENDPOINTS.tenor(query, limit);
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        return TRANSFORMERS[provider]?.(data) || [];
    } catch (error) {
        console.error(`[GifProvider] Error fetching from ${provider}:`, error);
        return [];
    }
}

async function getTrendingGifs(limit = 30): Promise<GifResult[]> {
    const provider = settings.store.provider;

    let url: string;
    switch (provider) {
        case "tenor":
            url = TRENDING_ENDPOINTS.tenor(limit);
            break;
        case "giphy":
            url = TRENDING_ENDPOINTS.giphy(limit);
            break;
        case "klipy":
            url = TRENDING_ENDPOINTS.klipy(limit, settings.store.klipyApiKey);
            break;
        case "serika":
            url = TRENDING_ENDPOINTS.serika(limit, settings.store.serikaInstance);
            break;
        case "imgur":
            url = TRENDING_ENDPOINTS.imgur(limit);
            break;
        default:
            url = TRENDING_ENDPOINTS.tenor(limit);
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        return TRANSFORMERS[provider]?.(data) || [];
    } catch (error) {
        console.error(`[GifProvider] Error fetching trending from ${provider}:`, error);
        return [];
    }
}

export default definePlugin({
    name: "GifProvider",
    description: "Switch between different GIF providers (Tenor, Giphy, Klipy, Serika GIFs, Imgur)",
    authors: [Devs.Ven], // Replace with your own author entry
    settings,

    patches: [
        // Patch the GIF picker search function
        {
            find: "GIFPickerSearchStore",
            replacement: {
                match: /async search\((\w+),(\w+)\)\{/,
                replace: "async search($1,$2){if($self.shouldIntercept())return $self.handleSearch($1,$2);"
            }
        },
        // Patch the trending GIFs fetch
        {
            find: "GIFPickerSearchStore",
            replacement: {
                match: /async fetchTrending\((\w+)\)\{/,
                replace: "async fetchTrending($1){if($self.shouldIntercept())return $self.handleTrending($1);"
            }
        },
        // Patch to show provider name in picker
        {
            find: ".GIF_PICKER_TITLE",
            replacement: {
                match: /\.GIF_PICKER_TITLE\}/,
                replace: '.GIF_PICKER_TITLE}+" ("+$self.getProviderName()+")"'
            }
        }
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
            gifs: results,
            query,
            provider: settings.store.provider,
        };
    },

    async handleTrending(limit?: number) {
        const results = await getTrendingGifs(limit || 30);
        return {
            gifs: results,
            provider: settings.store.provider,
        };
    },

    start() {
        console.log(`[GifProvider] Started with provider: ${settings.store.provider}`);
    },

    stop() {
        console.log("[GifProvider] Stopped");
    },
});
