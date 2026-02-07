import { db } from "./db";
import { products } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { log } from "./index";

const WC_STORE_URL = process.env.WC_STORE_URL || "https://cjmdigitales.com";
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || "";
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || "";

interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  status: string;
  type: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  images: Array<{ id: number; src: string; name: string; alt: string }>;
  attributes: Array<{ id: number; name: string; options: string[] }>;
}

interface SyncResult {
  total: number;
  created: number;
  updated: number;
  errors: number;
  skipped: number;
  details: string[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ").trim();
}

function detectPlatform(product: WCProduct): string {
  const combined = `${product.name} ${product.slug} ${product.categories.map(c => c.name).join(" ")} ${product.tags.map(t => t.name).join(" ")}`.toLowerCase();

  const platformAttr = product.attributes.find(a => a.name.toLowerCase() === "plataforma" || a.name.toLowerCase() === "platform" || a.name.toLowerCase() === "consola");
  if (platformAttr && platformAttr.options.length > 0) {
    const platVal = platformAttr.options[0].toLowerCase();
    if (/ps\s*5|playstation\s*5/.test(platVal)) return "ps5";
    if (/ps\s*4|playstation\s*4/.test(platVal)) return "ps4";
    if (/xbox\s*series/.test(platVal)) return "xbox_series";
    if (/xbox\s*one/.test(platVal)) return "xbox_one";
    if (/nintendo|switch/.test(platVal)) return "nintendo";
    if (/pc/.test(platVal)) return "pc";
  }

  if (/\bps\s*5\b|\bps5\b|\bplaystation\s*5\b/.test(combined)) return "ps5";
  if (/\bps\s*4\b|\bps4\b|\bplaystation\s*4\b/.test(combined)) return "ps4";
  if (/\bxbox\s*series\b/.test(combined)) return "xbox_series";
  if (/\bxbox\s*one\b/.test(combined)) return "xbox_one";
  if (/\bnintendo\b|\bswitch\b/.test(combined)) return "nintendo";
  if (/\bpc\b|\bsteam\b/.test(combined)) return "pc";
  if (/\bplaystation\b|\bpsn\b|\bps\s*plus\b/.test(combined)) return "ps5";
  if (/\bxbox\b|\bgame\s*pass\b/.test(combined)) return "xbox_series";

  return "all";
}

function detectCategory(product: WCProduct): string {
  const combined = `${product.name} ${product.categories.map(c => c.name).join(" ")} ${product.tags.map(t => t.name).join(" ")}`.toLowerCase();

  if (/\bsuscripci[oó]n\b|\bsubscripci[oó]n\b|\bsubscription\b|\bps\s*plus\b|\bgame\s*pass\b|\bmembresi[aá]\b|\bmembers/.test(combined)) return "subscription";
  if (/\btarjeta\b|\bgift\s*card\b|\bsaldo\b|\bwallet\b|\brecarga\b|\bcodigo\b|\bcódigo\b/.test(combined)) return "card";
  if (/\bbundle\b|\bpack\b|\bedici[oó]n.*especial\b|\bcolecci[oó]n\b/.test(combined)) return "bundle";
  if (/\bconsola\b|\bconsole\b|\bhardware\b/.test(combined)) return "console";
  if (/\baccesorio\b|\bcontrol\b|\bmando\b|\bheadset\b|\bauricular/.test(combined)) return "accessory";
  if (/\bjuego\b|\bgame\b|\bvideojuego\b/.test(combined)) return "game";

  return "game";
}

function detectAvailability(product: WCProduct): string {
  if (product.stock_status === "instock") return "available";
  if (product.stock_status === "outofstock") return "out_of_stock";
  if (product.stock_status === "onbackorder") return "preorder";
  return "available";
}

function generateSearchAliases(product: WCProduct): string[] {
  const aliases: Set<string> = new Set();
  const name = product.name.toLowerCase();

  aliases.add(name);
  aliases.add(product.slug.replace(/-/g, " "));

  const words = name.split(/[\s\-–—:,()[\]]+/).filter(w => w.length > 2);
  for (const word of words) {
    if (!["para", "con", "del", "los", "las", "una", "uno", "the", "and", "for", "edition", "edicion", "digital", "version"].includes(word)) {
      aliases.add(word);
    }
  }

  for (const tag of product.tags) {
    aliases.add(tag.name.toLowerCase());
  }

  for (const cat of product.categories) {
    aliases.add(cat.name.toLowerCase());
  }

  return Array.from(aliases).filter(a => a.length > 1);
}

function formatPrice(product: WCProduct): string {
  const price = product.sale_price || product.price || product.regular_price;
  if (!price) return "";

  const num = parseFloat(price);
  if (isNaN(num)) return price;

  return `$${num.toFixed(2)} USD`;
}

async function fetchWCProducts(page: number = 1, perPage: number = 100): Promise<WCProduct[]> {
  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    throw new Error("WooCommerce API keys not configured");
  }

  const urls = [
    `${WC_STORE_URL}/wp-json/wc/v3/products?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}&per_page=${perPage}&page=${page}&status=publish`,
    `${WC_STORE_URL}/?rest_route=/wc/v3/products&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}&per_page=${perPage}&page=${page}&status=publish`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { "Accept": "application/json" },
      });

      if (!response.ok) {
        const text = await response.text();
        if (text.startsWith("<")) continue;
        throw new Error(`WC API error: ${response.status} - ${text.slice(0, 200)}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("json")) continue;

      const data = await response.json();
      if (Array.isArray(data)) return data as WCProduct[];
    } catch (err: any) {
      log(`WC API attempt failed for URL pattern: ${err.message}`, "woocommerce");
      continue;
    }
  }

  throw new Error(`Could not connect to WooCommerce API at ${WC_STORE_URL}. Please verify the store URL is correct.`);
}

export async function syncWooCommerceProducts(): Promise<SyncResult> {
  const result: SyncResult = { total: 0, created: 0, updated: 0, errors: 0, skipped: 0, details: [] };

  try {
    let page = 1;
    let allProducts: WCProduct[] = [];
    const perPage = 100;

    while (true) {
      const batch = await fetchWCProducts(page, perPage);
      if (batch.length === 0) break;
      allProducts = [...allProducts, ...batch];
      if (batch.length < perPage) break;
      page++;
    }

    result.total = allProducts.length;
    log(`WooCommerce: fetched ${allProducts.length} products`, "woocommerce");

    for (const wcProduct of allProducts) {
      try {
        if (wcProduct.status !== "publish") {
          result.skipped++;
          continue;
        }

        const platform = detectPlatform(wcProduct);
        const category = detectCategory(wcProduct);
        const availability = detectAvailability(wcProduct);
        const searchAliases = generateSearchAliases(wcProduct);
        const price = formatPrice(wcProduct);
        const imageUrl = wcProduct.images.length > 0 ? wcProduct.images[0].src : null;
        const description = stripHtml(wcProduct.short_description || wcProduct.description || "").slice(0, 500);
        const cleanName = stripHtml(wcProduct.name);

        const existing = await db
          .select()
          .from(products)
          .where(eq(products.wcProductId, wcProduct.id))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(products)
            .set({
              name: cleanName,
              searchAliases,
              platform: platform as any,
              price: price || existing[0].price,
              productUrl: wcProduct.permalink,
              imageUrl: imageUrl || existing[0].imageUrl,
              availability: availability as any,
              description: description || existing[0].description,
              category: category as any,
              wcLastSync: new Date(),
            })
            .where(eq(products.wcProductId, wcProduct.id));
          result.updated++;
          result.details.push(`Actualizado: ${cleanName}`);
        } else {
          await db.insert(products).values({
            wcProductId: wcProduct.id,
            name: cleanName,
            searchAliases,
            platform: platform as any,
            price,
            productUrl: wcProduct.permalink,
            imageUrl,
            availability: availability as any,
            description,
            category: category as any,
            wcLastSync: new Date(),
          });
          result.created++;
          result.details.push(`Creado: ${cleanName}`);
        }
      } catch (err: any) {
        result.errors++;
        result.details.push(`Error en "${wcProduct.name}": ${err.message}`);
        log(`WC sync error for product ${wcProduct.id}: ${err.message}`, "woocommerce");
      }
    }

    const wcIds = allProducts.map(p => p.id);
    if (wcIds.length > 0) {
      const removedProducts = await db
        .select()
        .from(products)
        .where(
          sql`${products.wcProductId} IS NOT NULL AND ${products.wcProductId} NOT IN (${sql.join(wcIds.map(id => sql`${id}`), sql`, `)})`
        );

      for (const rp of removedProducts) {
        await db
          .update(products)
          .set({ availability: "out_of_stock" })
          .where(eq(products.id, rp.id));
        result.details.push(`Marcado agotado (eliminado en WC): ${rp.name}`);
      }
    }

    log(`WooCommerce sync complete: ${result.created} created, ${result.updated} updated, ${result.errors} errors`, "woocommerce");
  } catch (err: any) {
    result.errors++;
    result.details.push(`Error de conexion: ${err.message}`);
    log(`WooCommerce sync failed: ${err.message}`, "woocommerce");
  }

  return result;
}

export async function getWCSyncStatus(): Promise<{
  lastSync: Date | null;
  productCount: number;
  wcProductCount: number;
  storeUrl: string;
  configured: boolean;
}> {
  const allProducts = await db.select().from(products);
  const wcProducts = allProducts.filter(p => p.wcProductId !== null);
  const lastSync = wcProducts.reduce((latest: Date | null, p) => {
    if (!p.wcLastSync) return latest;
    if (!latest) return p.wcLastSync;
    return p.wcLastSync > latest ? p.wcLastSync : latest;
  }, null);

  return {
    lastSync,
    productCount: allProducts.length,
    wcProductCount: wcProducts.length,
    storeUrl: WC_STORE_URL,
    configured: !!WC_CONSUMER_KEY && !!WC_CONSUMER_SECRET,
  };
}
