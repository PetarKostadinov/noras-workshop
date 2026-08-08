import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMerchantFeed, buildSitemap, injectSeoMetadata } from './seo.js';

test('sitemap escapes product URLs and includes last modification dates', () => {
  const xml = buildSitemap('https://example.com/', [{ _id: '123', slug: 'gift&box', updatedAt: '2026-08-08T00:00:00.000Z' }]);
  assert.match(xml, /https:\/\/example\.com\/product\/123\/gift&amp;box/);
  assert.match(xml, /2026-08-08T00:00:00\.000Z/);
});

test('Merchant feed contains escaped, inventory-aware product data', () => {
  const xml = buildMerchantFeed('https://example.com/', [{
    _id: 'product-1',
    name: 'Gift & Box',
    slug: 'gift-box',
    description: 'Made <with> care',
    image: 'https://images.example.com/main.jpg?x=1&y=2',
    images: ['https://images.example.com/main.jpg?x=1&y=2', 'https://images.example.com/second.jpg'],
    brand: "Nora's Workshop",
    category: 'Handmade Gifts',
    price: 25,
    countMany: 0,
  }]);

  assert.match(xml, /xmlns:g="http:\/\/base\.google\.com\/ns\/1\.0"/);
  assert.match(xml, /<g:title>Gift &amp; Box<\/g:title>/);
  assert.match(xml, /<g:availability>out_of_stock<\/g:availability>/);
  assert.match(xml, /<g:price>25\.00 USD<\/g:price>/);
  assert.match(xml, /<g:additional_image_link>https:\/\/images\.example\.com\/second\.jpg<\/g:additional_image_link>/);
});

test('SEO metadata is escaped before insertion into the HTML shell', () => {
  const html = '<head><meta name="description" content="old" /><title>Old</title></head>';
  const result = injectSeoMetadata(html, { title: 'Gift <Box>', description: 'A & B', url: 'https://example.com/item', image: 'https://example.com/image.jpg', type: 'product' });
  assert.match(result, /Gift &lt;Box&gt;/);
  assert.match(result, /A &amp; B/);
  assert.match(result, /property="og:type" content="product"/);
});

test('Google ownership verification is injected only when configured', () => {
  const html = '<head><meta name="description" content="old" /><title>Old</title></head>';
  const metadata = { title: 'Shop', description: 'Description', url: 'https://example.com', image: 'https://example.com/image.jpg' };
  const verified = injectSeoMetadata(html, metadata, 'token"><script>alert(1)</script>');
  const unconfigured = injectSeoMetadata(html, metadata);

  assert.match(verified, /name="google-site-verification"/);
  assert.doesNotMatch(verified, /<script>alert/);
  assert.doesNotMatch(unconfigured, /google-site-verification/);
});
