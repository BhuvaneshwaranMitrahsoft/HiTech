/**
 * HiTech E-Commerce Competitor Price Scraper
 *
 * Scrapes live product prices from Amazon.in and Flipkart.com for items
 * configured with `competitorLinks` in `public/data/products.json`.
 *
 * Design Principles:
 * 1. Zero external dependencies: Uses Node.js native fetch and regex / JSON-LD parsing.
 * 2. Non-blocking & Resilient: If Amazon or Flipkart temporarily returns CAPTCHA / 503,
 *    it gracefully preserves the previous cached price from `competitor-prices.json`.
 * 3. Proxy-Ready: If `SCRAPER_API_KEY` is provided in environment, it routes via proxy.
 * 4. Configurable via CLI: Supports --dry-run, --limit=N, --product=id.
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_PATH = path.join(__dirname, '../public/data/products.json');
const COMPETITOR_PRICES_PATH = path.join(__dirname, '../public/data/competitor-prices.json');

// Realistic modern browser headers to minimize bot detection
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const productArg = args.find(a => a.startsWith('--product='));

const itemLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const targetProductId = productArg ? productArg.split('=')[1] : null;

// Sleep helper to be polite to target servers
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch HTML either directly or through an optional proxy if configured
 */
async function fetchPage(url) {
  const scraperApiKey = process.env.SCRAPER_API_KEY;
  let targetUrl = url;

  if (scraperApiKey) {
    targetUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: BROWSER_HEADERS,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok && res.status !== 503) {
      console.warn(`  [HTTP ${res.status}] Request returned non-ok status for ${url}`);
    }

    return await res.text();
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`  [Network Error] Failed to fetch ${url}: ${err.message}`);
    return null;
  }
}

/**
 * Extract price from JSON-LD schema markup (standard Google SEO structure on Amazon & Flipkart)
 */
function extractPriceFromJsonLd(html) {
  if (!html) return null;

  try {
    const jsonLdRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const jsonContent = JSON.parse(match[1].trim());
        const items = Array.isArray(jsonContent) ? jsonContent : [jsonContent];

        for (const item of items) {
          // Check standard schema.org Product or Offer
          if (item && item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
            for (const offer of offers) {
              if (offer.price !== undefined) {
                const num = parseFloat(String(offer.price).replace(/[^0-9.]/g, ''));
                if (num > 0) return Math.round(num);
              }
            }
          }
          if (item && item.price !== undefined) {
            const num = parseFloat(String(item.price).replace(/[^0-9.]/g, ''));
            if (num > 0) return Math.round(num);
          }
        }
      } catch {
        // Continue checking other JSON-LD blocks
      }
    }
  } catch (err) {
    // Ignore JSON-LD parse errors
  }

  return null;
}

/**
 * Scrape Amazon India price
 */
async function scrapeAmazon(url) {
  if (!url) return null;

  console.log(`  Fetching Amazon: ${url}`);
  const html = await fetchPage(url);
  if (!html) return null;

  // 1. Check for Amazon Bot / CAPTCHA block
  if (
    html.includes('To discuss automated access to Amazon data') ||
    html.includes('Enter the characters you see below') ||
    html.includes('api-services-support@amazon.com')
  ) {
    console.warn('  ⚠️ Amazon bot challenge/CAPTCHA detected. Preserving cached price.');
    return null;
  }

  // 2. Try JSON-LD schema
  const jsonLdPrice = extractPriceFromJsonLd(html);
  if (jsonLdPrice && jsonLdPrice > 100) {
    return jsonLdPrice;
  }

  // 3. Fallback regex patterns for Amazon India DOM
  const amazonPatterns = [
    /class=["']a-price-whole["'][^>]*>([0-9,]+)</i,
    /<span class=["']a-offscreen["'][^>]*>₹?\s*([0-9,]+(?:\.[0-9]{2})?)<\/span>/i,
    /id=["']priceblock_ourprice["'][^>]*>₹?\s*([0-9,]+)/i,
    /id=["']priceblock_dealprice["'][^>]*>₹?\s*([0-9,]+)/i,
    /["']priceAmount["']:\s*([0-9.]+)/i
  ];

  for (const pattern of amazonPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const clean = match[1].replace(/,/g, '');
      const parsed = parseFloat(clean);
      if (parsed > 100) return Math.round(parsed);
    }
  }

  return null;
}

/**
 * Scrape Flipkart price
 */
async function scrapeFlipkart(url) {
  if (!url) return null;

  console.log(`  Fetching Flipkart: ${url}`);
  const html = await fetchPage(url);
  if (!html) return null;

  // 1. Try JSON-LD schema
  const jsonLdPrice = extractPriceFromJsonLd(html);
  if (jsonLdPrice && jsonLdPrice > 100) {
    return jsonLdPrice;
  }

  // 2. Flipkart initial state JSON extraction
  try {
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});<\/script>/i);
    if (stateMatch && stateMatch[1]) {
      const state = JSON.parse(stateMatch[1]);
      const priceVal = state?.pageDataV4?.page?.data?.PRICE?.value?.decimalValue;
      if (priceVal && priceVal > 100) return Math.round(priceVal);
    }
  } catch {
    // Continue to DOM regex
  }

  // 3. Fallback regex patterns for Flipkart DOM (classes: Nx9bqj, _30jeq3, _16Jk6d)
  const flipkartPatterns = [
    /class=["'][^"']*\b(?:Nx9bqj|_30jeq3|_16Jk6d)\b[^"']*["'][^>]*>₹?\s*([0-9,]+)</i,
    /class=["'][^"']*_30jeq3 _16Jk6d[^"']*["'][^>]*>₹?\s*([0-9,]+)</i,
    /<div[^>]*>₹\s*([0-9,]+)<\/div>/i
  ];

  for (const pattern of flipkartPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const clean = match[1].replace(/,/g, '');
      const parsed = parseFloat(clean);
      if (parsed > 100) return Math.round(parsed);
    }
  }

  return null;
}

async function main() {
  console.log('====================================================');
  console.log('  HiTech Competitor Price Scraper (Amazon & Flipkart)');
  console.log('====================================================\n');

  if (!fs.existsSync(PRODUCTS_PATH)) {
    console.error(`Error: Products file not found at ${PRODUCTS_PATH}`);
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));

  // Load existing competitor prices if available (cache retention)
  let existingPrices = {};
  if (fs.existsSync(COMPETITOR_PRICES_PATH)) {
    try {
      existingPrices = JSON.parse(fs.readFileSync(COMPETITOR_PRICES_PATH, 'utf8'));
    } catch (err) {
      console.warn('Could not parse existing competitor-prices.json, starting fresh.');
    }
  }

  // Filter products that have competitor links
  let eligibleProducts = products.filter(p => p.competitorLinks && (p.competitorLinks.amazonUrl || p.competitorLinks.flipkartUrl));

  if (targetProductId) {
    eligibleProducts = eligibleProducts.filter(p => p.id === targetProductId);
  }

  if (itemLimit < eligibleProducts.length) {
    eligibleProducts = eligibleProducts.slice(0, itemLimit);
  }

  console.log(`Found ${eligibleProducts.length} product(s) with competitor links to check.\n`);

  const updatedPrices = { ...existingPrices };
  let successCount = 0;
  let preservedCount = 0;

  for (let i = 0; i < eligibleProducts.length; i++) {
    const prod = eligibleProducts[i];
    const prev = existingPrices[prod.id] || {};

    console.log(`[${i + 1}/${eligibleProducts.length}] Product: ${prod.name} (Our Price: ₹${prod.price.toLocaleString('en-IN')})`);

    const links = prod.competitorLinks || {};
    let amazonPrice = null;
    let flipkartPrice = null;

    if (links.amazonUrl) {
      amazonPrice = await scrapeAmazon(links.amazonUrl);
      await sleep(1500); // Politeness delay between calls
    }

    if (links.flipkartUrl) {
      flipkartPrice = await scrapeFlipkart(links.flipkartUrl);
      await sleep(1500); // Politeness delay between calls
    }

    // Retain previous prices if current scrape was blocked or returned null
    const finalAmazonPrice = amazonPrice || prev.amazonPrice || null;
    const finalFlipkartPrice = flipkartPrice || prev.flipkartPrice || null;

    if (amazonPrice && flipkartPrice) {
      successCount++;
    } else {
      preservedCount++;
    }

    updatedPrices[prod.id] = {
      amazonPrice: finalAmazonPrice,
      amazonUrl: links.amazonUrl || prev.amazonUrl,
      flipkartPrice: finalFlipkartPrice,
      flipkartUrl: links.flipkartUrl || prev.flipkartUrl,
      lastUpdated: new Date().toISOString(),
      status: (finalAmazonPrice || finalFlipkartPrice) ? 'success' : 'failed'
    };

    console.log(`  -> Amazon:   ₹${finalAmazonPrice ? finalAmazonPrice.toLocaleString('en-IN') : 'N/A'}${!amazonPrice && prev.amazonPrice ? ' (cached)' : ''}`);
    console.log(`  -> Flipkart: ₹${finalFlipkartPrice ? finalFlipkartPrice.toLocaleString('en-IN') : 'N/A'}${!flipkartPrice && prev.flipkartPrice ? ' (cached)' : ''}\n`);

    if (i < eligibleProducts.length - 1) {
      await sleep(2000); // Politeness delay before next product
    }
  }

  if (isDryRun) {
    console.log('Dry run complete. No files were modified.');
  } else {
    fs.writeFileSync(COMPETITOR_PRICES_PATH, JSON.stringify(updatedPrices, null, 2), 'utf8');
    console.log(`✓ Successfully updated ${COMPETITOR_PRICES_PATH}`);
  }

  console.log('\n================== Summary ==================');
  console.log(`Total Products Checked: ${eligibleProducts.length}`);
  console.log(`Fresh Live Prices:      ${successCount}`);
  console.log(`Cached Prices Retained: ${preservedCount}`);
  console.log('=============================================\n');
}

main().catch(err => {
  console.error('Fatal error in scraper script:', err);
  process.exit(1);
});
