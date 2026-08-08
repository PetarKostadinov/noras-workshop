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

export const injectSeoMetadata = (html, metadata) => {
  const title = escapeMarkup(metadata.title);
  const description = escapeMarkup(metadata.description);
  const url = escapeMarkup(metadata.url);
  const image = escapeMarkup(metadata.image);
  const type = escapeMarkup(metadata.type || 'website');
  const tags = [
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
