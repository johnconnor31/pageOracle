import { NextResponse } from 'next/server';
import { load } from 'cheerio';

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_LENGTH = 100_000;
const REQUEST_TIMEOUT_MS = 10_000;

function isPrivateHostname(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || host === '::1' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  const private172 = host.match(/^172\.(\d+)\./);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return true;
  return false;
}

function normalizeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Enter a URL.');
  const candidate = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
  const url = new URL(candidate);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  if (url.username || url.password) throw new Error('URLs containing credentials are not supported.');
  if (isPrivateHostname(url.hostname)) throw new Error('Private and local URLs are not supported.');
  return url;
}

export async function POST(request) {
  let target;

  try {
    const body = await request.json();
    target = normalizeUrl(body?.url);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Enter a valid URL.' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(target, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'pageOracle/1.0 (readability fetcher)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
      },
    });

    if (!response.ok) throw new Error(`The page returned HTTP ${response.status}.`);
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_RESPONSE_BYTES) throw new Error('The page is too large to read.');

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error('This URL does not return readable HTML or text.');
    }

    const source = await response.text();
    if (Buffer.byteLength(source, 'utf8') > MAX_RESPONSE_BYTES) throw new Error('The page is too large to read.');

    let title = target.hostname;
    let text = source;

    if (contentType.includes('text/html')) {
      const $ = load(source);
      title = $('title').first().text().trim() || $('h1').first().text().trim() || target.hostname;
      $('script, style, noscript, template, svg, nav, header, footer, aside, form').remove();
      text = $('main, article').first().text(' ') || $('body').text(' ');
    }

    text = text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH);
    if (!text) throw new Error('No readable text was found at this URL.');

    return NextResponse.json({
      url: target.toString(),
      title: title.slice(0, 300),
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    });
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'The page took too long to respond.'
      : error.message || 'Unable to fetch that page.';
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
