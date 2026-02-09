import { db } from "./db";
import { products } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { log } from "./index";

const WC_STORE_URL = process.env.WC_STORE_URL || "https://cjmdigitales.cl";
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
  const name = product.name.toLowerCase();
  const categoryNames = product.categories.map(c => c.name.toLowerCase()).join(" ");
  const tagNames = product.tags.map(t => t.name.toLowerCase()).join(" ");
  const combined = `${name} ${categoryNames} ${tagNames}`;

  if (/cuenta\s*plus|plus\s*essential|plus\s*extra|plus\s*premium/.test(name)) return "subscription";
  if (/game\s*pass|gamepass/.test(name)) return "subscription";
  if (/ps\s*plus|playstation\s*plus|ps\s*\+/.test(name)) return "subscription";
  if (/ea\s*play|ea\s*access/.test(name)) return "subscription";
  if (/xbox\s*live\s*gold|xbox\s*gold/.test(name)) return "subscription";
  if (/nintendo\s*(switch\s*)?online/.test(name)) return "subscription";
  if (/\bmembresi[aá]\b|\bsuscripci[oó]n\b|\bsubscripci[oó]n\b|\bsubscription\b/.test(name)) return "subscription";
  if (/(\b\d+\s*(mes|meses|año|años|month|months|year|years)\b).*(plus|pass|live|online|play|cuenta|membership)/i.test(name)) return "subscription";
  if (/(plus|pass|live|online|play|cuenta|membership).*(\b\d+\s*(mes|meses|año|años|month|months|year|years)\b)/i.test(name)) return "subscription";

  if (/\btarjeta\b/.test(name)) return "card";
  if (/gift\s*card/.test(name)) return "card";
  if (/\bsaldo\b/.test(name)) return "card";
  if (/\brecarga\b/.test(name)) return "card";
  if (/\bc[oó]digo\b/.test(name)) return "card";
  if (/\bwallet\b/.test(name)) return "card";
  if (/\bpsn\b.*\$|\$.*\bpsn\b|\bpsn\s*\d/.test(name)) return "card";
  if (/xbox\s*gift/.test(name)) return "card";

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
  const category = detectCategory(product);

  aliases.add(name);
  aliases.add(product.slug.replace(/-/g, " "));

  const stopWords = new Set(["para", "con", "del", "los", "las", "una", "uno", "the", "and", "for", "edition", "edicion", "digital", "version", "de", "en", "por", "que", "cuenta"]);
  const words = name.split(/[\s\-–—:,()[\]]+/).filter(w => w.length > 2);
  for (const word of words) {
    if (!stopWords.has(word)) {
      aliases.add(word);
    }
  }

  const multiWordPatterns = name.match(/[a-záéíóúñü]+(?:\s+[a-záéíóúñü]+)+/gi);
  if (multiWordPatterns) {
    for (const pattern of multiWordPatterns) {
      const cleaned = pattern.trim();
      if (cleaned.split(/\s+/).length >= 2 && cleaned.split(/\s+/).length <= 4) {
        const patternWords = cleaned.split(/\s+/).filter(w => !stopWords.has(w.toLowerCase()));
        if (patternWords.length >= 2) {
          aliases.add(patternWords.join(" "));
        }
      }
    }
  }

  const timeMatch = name.match(/(\d+)\s*(mes|meses|año|años|month|months|year|years)/i);
  if (timeMatch) {
    aliases.add(`${timeMatch[1]} ${timeMatch[2]}`);
  }

  if (category === "subscription") {
    aliases.add("suscripcion");
    aliases.add("suscripciones");
    aliases.add("subscription");
    if (/plus/.test(name)) {
      aliases.add("plus");
      aliases.add("ps plus");
      aliases.add("playstation plus");
    }
    if (/essential/.test(name)) aliases.add("essential");
    if (/extra/.test(name)) aliases.add("extra");
    if (/premium/.test(name)) aliases.add("premium");
    if (/game\s*pass/.test(name)) {
      aliases.add("game pass");
      aliases.add("gamepass");
    }
    if (/ea\s*play/.test(name)) aliases.add("ea play");
    if (/nintendo/.test(name)) aliases.add("nintendo online");
  }

  if (category === "card") {
    aliases.add("tarjeta");
    aliases.add("tarjetas");
    aliases.add("saldo");
    aliases.add("gift card");
    aliases.add("recarga");
    aliases.add("codigo");
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

  return `$${Math.round(num).toLocaleString("es-CL")} CLP`;
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

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

    const existingProducts = await db.select({ id: products.id, wcProductId: products.wcProductId, price: products.price, imageUrl: products.imageUrl, description: products.description }).from(products).where(sql`${products.wcProductId} IS NOT NULL`);
    const existingMap = new Map(existingProducts.map(p => [p.wcProductId!, p]));

    const BATCH_SIZE = 50;
    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
      const batch = allProducts.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (wcProduct) => {
        try {
          if (wcProduct.status !== "publish") {
            result.skipped++;
            return;
          }

          const platform = detectPlatform(wcProduct);
          const category = detectCategory(wcProduct);
          const availability = detectAvailability(wcProduct);
          const searchAliases = generateSearchAliases(wcProduct);
          const price = formatPrice(wcProduct);
          const imageUrl = wcProduct.images.length > 0 ? wcProduct.images[0].src : null;
          const description = stripHtml(wcProduct.short_description || wcProduct.description || "").slice(0, 500);
          const cleanName = stripHtml(wcProduct.name);

          const existing = existingMap.get(wcProduct.id);

          if (existing) {
            await db
              .update(products)
              .set({
                name: cleanName,
                searchAliases,
                platform: platform as any,
                price: price || existing.price,
                productUrl: wcProduct.permalink,
                imageUrl: imageUrl || existing.imageUrl,
                availability: availability as any,
                description: description || existing.description,
                category: category as any,
                wcLastSync: new Date(),
              })
              .where(eq(products.wcProductId, wcProduct.id));
            result.updated++;
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
          }
        } catch (err: any) {
          result.errors++;
          log(`WC sync error for product ${wcProduct.id}: ${err.message}`, "woocommerce");
        }
      }));
      if (i + BATCH_SIZE < allProducts.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
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

    try {
      await db.execute(sql`
        UPDATE products SET category = 'subscription' WHERE 
          LOWER(name) LIKE '%cuenta plus%' OR 
          LOWER(name) LIKE '%plus essential%' OR 
          LOWER(name) LIKE '%plus extra%' OR 
          LOWER(name) LIKE '%plus premium%' OR 
          LOWER(name) LIKE '%game pass%' OR 
          LOWER(name) LIKE '%gamepass%' OR 
          LOWER(name) LIKE '%ps plus%' OR 
          LOWER(name) LIKE '%playstation plus%' OR 
          LOWER(name) LIKE '%ea play%' OR 
          LOWER(name) LIKE '%ea access%' OR 
          LOWER(name) LIKE '%xbox live gold%' OR 
          LOWER(name) LIKE '%nintendo online%' OR 
          LOWER(name) LIKE '%nintendo switch online%' OR 
          (LOWER(name) LIKE '%meses%' AND (LOWER(name) LIKE '%plus%' OR LOWER(name) LIKE '%pass%' OR LOWER(name) LIKE '%cuenta%')) OR
          (LOWER(name) LIKE '%mes %' AND (LOWER(name) LIKE '%plus%' OR LOWER(name) LIKE '%pass%' OR LOWER(name) LIKE '%cuenta%'))
      `);
      await db.execute(sql`
        UPDATE products SET category = 'card' WHERE 
          LOWER(name) LIKE '%tarjeta%' OR 
          LOWER(name) LIKE '%gift card%' OR 
          LOWER(name) LIKE '%saldo%' OR 
          LOWER(name) LIKE '%recarga%' OR 
          LOWER(name) LIKE '%wallet%'
      `);
      log("Post-sync category fix applied", "woocommerce");
    } catch (fixErr: any) {
      log(`Post-sync category fix error: ${fixErr.message}`, "woocommerce");
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
