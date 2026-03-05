import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://hotkeys.ai",
      lastModified: "2026-03-05",
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://hotkeys.ai/preview",
      lastModified: "2026-03-05",
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
