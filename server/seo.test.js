import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSitemap, injectSeoMetadata } from './seo.js';

test('sitemap escapes product URLs and includes last modification dates', () => {
  const xml = buildSitemap('https://example.com/', [{ _id: '123', slug: 'gift&box', updatedAt: '2026-08-08T00:00:00.000Z' }]);
  assert.match(xml, /https:\/\/example\.com\/product\/123\/gift&amp;box/);
  assert.match(xml, /2026-08-08T00:00:00\.000Z/);
});

test('SEO metadata is escaped before insertion into the HTML shell', () => {
  const html = '<head><meta name="description" content="old" /><title>Old</title></head>';
  const result = injectSeoMetadata(html, { title: 'Gift <Box>', description: 'A & B', url: 'https://example.com/item', image: 'https://example.com/image.jpg', type: 'product' });
  assert.match(result, /Gift &lt;Box&gt;/);
  assert.match(result, /A &amp; B/);
  assert.match(result, /property="og:type" content="product"/);
});
