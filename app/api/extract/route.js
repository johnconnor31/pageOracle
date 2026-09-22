import { NextResponse } from 'next/server';
import { load } from 'cheerio';
import sanitizeHtml from 'sanitize-html';

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_HTML_LENGTH = 200_000;
const REQUEST_TIMEOUT_MS = 10_000;

function isPrivateHostname(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || host === '::1' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  const private172 = host.match(/^172\.(\d+)\./);
  return Boolean(private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
}

function normalizeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Enter a URL.');
  const url = new URL(/^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  if (url.username || url.password) throw new Error('URLs containing credentials are not supported.');
  if (isPrivateHostname(url.hostname)) throw new Error('Private and local URLs are not supported.');
  return url;
}

function extractFallbackHtml(source) {
  const $ = load(source);
  const title = $('title').first().text().trim() || $('h1').first().text().trim();
  $('script, style, noscript, template, svg, nav, header, footer, aside, form, iframe, object, embed').remove();
  $('a').each((_, element) => $(element).replaceWith($(element).contents()));
  const main = $('main, article').first();
  const root = main.length ? main : $('body');
  const html = sanitizeHtml(root.length ? root.html() || '' : '', {
    allowedTags: ['h1','h2','h3','h4','h5','h6','p','br','strong','b','em','i','u','s','blockquote','pre','code','ul','ol','li','table','thead','tbody','tr','th','td','hr','sup','sub','mark','img'],
    allowedAttributes: { img: ['src','alt','title','width','height'], '*': ['class'] },
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
  }).trim();
  return { title, html };
}

function canEmbed(headers) {
  const frameOptions = (headers.get('x-frame-options') || '').toLowerCase();
  const csp = (headers.get('content-security-policy') || '').toLowerCase();
  return !frameOptions || (!frameOptions.includes('deny') && !frameOptions.includes('sameorigin'))
    ? !csp.includes('frame-ancestors') || /frame-ancestors\s+[^;]*(\*|https?:\/\/[^\s;]+)/.test(csp)
    : false;
}

export async function POST(request) {
  let target;
  try { target = normalizeUrl((await request.json())?.url); }
  catch (error) { return NextResponse.json({ error: error.message || 'Enter a valid URL.' }, { status: 400 }); }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(target, { signal: controller.signal, redirect: 'follow', headers: { 'User-Agent': 'pageOracle/1.0', Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9' } });
    if (!response.ok) throw new Error(`The page returned HTTP ${response.status}.`);
    if (Number(response.headers.get('content-length') || 0) > MAX_RESPONSE_BYTES) throw new Error('The page is too large to read.');
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) throw new Error('This URL does not return readable HTML or text.');
    const source = await response.text();
    if (Buffer.byteLength(source, 'utf8') > MAX_RESPONSE_BYTES) throw new Error('The page is too large to read.');

    let title = '';
    let html;
    if (contentType.includes('text/html')) ({ title, html } = extractFallbackHtml(source));
    else html = `<p>${source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
    html = html.slice(0, MAX_HTML_LENGTH);
    if (!html || !load(html).text().trim()) throw new Error('No readable text was found at this URL.');
    const text = load(html).text().replace(/\s+/g, ' ').trim();
    return NextResponse.json({ url: target.toString(), title: title.slice(0, 300), html, text, canEmbed: contentType.includes('text/html') && canEmbed(response.headers), wordCount: text.split(/\s+/).filter(Boolean).length });
  } catch (error) {
    return NextResponse.json({ error: error.name === 'AbortError' ? 'The page took too long to respond.' : error.message || 'Unable to fetch that page.' }, { status: 502 });
  } finally { clearTimeout(timeout); }
}
