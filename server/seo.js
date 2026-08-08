const escapeMarkup = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const normalizeOrigin = (origin) => String(origin).replace(/\/$/, '');

export const buildSitemap = (origin, products) => {
  const baseUrl = normalizeOrigin(origin);
  const staticPaths = ['/', '/about', '/help/shipping', '/help/returns', '/help/faq'];
  const urls = [
    ...staticPaths.map((path) => ({ location: `${baseUrl}${path}`, priority: path === '/' ? '1.0' : '0.7' })),
    ...products.map((product) => ({
      location: `${baseUrl}/product/${product._id}/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt).toISOString() : undefined,
      priority: '0.8',
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url>\n    <loc>${escapeMarkup(url.location)}</loc>${url.lastModified ? `\n    <lastmod>${escapeMarkup(url.lastModified)}</lastmod>` : ''}\n    <priority>${url.priority}</priority>\n  </url>`).join('\n')}\n</urlset>`;
};

export const buildMerchantFeed = (origin, products) => {
  const baseUrl = normalizeOrigin(origin);
  const items = products.map((product) => {
    const productUrl = `${baseUrl}/product/${product._id}/${product.slug}`;
    const images = product.images?.length ? product.images : [product.image];
    const additionalImages = images
      .filter((image) => image && image !== product.image)
      .map((image) => `      <g:additional_image_link>${escapeMarkup(image)}</g:additional_image_link>`);

    return [
      '    <item>',
      `      <g:id>${escapeMarkup(product._id)}</g:id>`,
      `      <g:title>${escapeMarkup(String(product.name).slice(0, 150))}</g:title>`,
      `      <g:description>${escapeMarkup(String(product.description).slice(0, 5000))}</g:description>`,
      `      <g:link>${escapeMarkup(productUrl)}</g:link>`,
      `      <g:image_link>${escapeMarkup(product.image)}</g:image_link>`,
      ...additionalImages,
      `      <g:availability>${product.countMany > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>`,
      `      <g:price>${Number(product.price).toFixed(2)} USD</g:price>`,
      '      <g:condition>new</g:condition>',
      `      <g:brand>${escapeMarkup(product.brand || "Nora's Workshop")}</g:brand>`,
      `      <g:mpn>${escapeMarkup(product._id)}</g:mpn>`,
      `      <g:product_type>${escapeMarkup(product.category)}</g:product_type>`,
      '    </item>',
    ].join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n    <title>Nora's Workshop</title>\n    <link>${escapeMarkup(baseUrl)}</link>\n    <description>Handmade gifts and décor from Nora's Workshop</description>\n${items}\n  </channel>\n</rss>`;
};

export const injectSeoMetadata = (html, metadata, googleSiteVerification = '') => {
  const title = escapeMarkup(metadata.title);
  const description = escapeMarkup(metadata.description);
  const url = escapeMarkup(metadata.url);
  const image = escapeMarkup(metadata.image);
  const type = escapeMarkup(metadata.type || 'website');
  const verificationToken = escapeMarkup(googleSiteVerification.trim());
  const tags = [
    ...(verificationToken ? [`<meta name="google-site-verification" content="${verificationToken}" />`] : []),
    `<link rel="canonical" href="${url}" />`,
    ...(metadata.noIndex ? ['<meta name="robots" content="noindex, nofollow" />'] : []),
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="Nora's Workshop" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/i, `<meta name="description" content="${description}" />`)
    .replace('</head>', `    ${tags}\n  </head>`);
};

export { escapeMarkup };
