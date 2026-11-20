import type { MetadataRoute } from "next";
import { company } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL ?? `https://${company.domain}`;
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/demo/bestaetigen", "/demo/bestaetigt"] }], sitemap: `${base}/sitemap.xml` };
}
