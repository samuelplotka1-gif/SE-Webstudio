import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { company } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? `https://${company.domain}`;
  const paths = ["", "/demo", "/termin", ...services.map((s) => `/leistungen/${s.slug}`), "/impressum", "/datenschutz", "/agb"];
  return paths.map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly", priority: p === "" ? 1 : p.startsWith("/leistungen") ? 0.8 : 0.5 }));
}
