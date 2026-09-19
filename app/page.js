'use client';

import { useState } from 'react';
import { Box, Button, Container, Link, Stack, TextField, Typography } from '@mui/material';

const navItems = ['Features', 'Testimonials', 'Highlights', 'Pricing', 'FAQ', 'Blog'];

function validateUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter a page URL.';
  if (trimmed.length > 2_048) return 'The URL must be 2,048 characters or fewer.';
  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) return 'Enter a valid HTTP or HTTPS URL.';
    return '';
  } catch { return 'Enter a valid URL, such as https://example.com.'; }
}

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateUrl(url);
    if (validationError) { setError(validationError); setPage(null); return; }
    const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    setUrl(normalizedUrl); setError(''); setLoading(true);
    try {
      const response = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: normalizedUrl }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to read this page.');
      setPage(result);
    } catch (requestError) { setPage(null); setError(requestError.message); } finally { setLoading(false); }
  }

  return (
    <Box className={`marketing-page ${page ? 'browser-mode' : ''}`}>
      <Container maxWidth="xl" className="marketing-container">
        <Box component="header" className="site-nav">
          <Link href="#top" underline="none" className="brand"><Typography component="span" className="brand-name">pageOracle</Typography></Link>
          <Box component="nav" className="nav-links" aria-label="Main navigation">{navItems.map((item) => <Link key={item} href={`#${item.toLowerCase()}`} underline="none">{item}</Link>)}</Box>
          <Stack direction="row" spacing={3} alignItems="center" className="nav-actions"><Link href="#signin" underline="none">Sign in</Link><Button variant="contained" className="dark-button">Sign up</Button></Stack>
        </Box>
        <Box component="main" id="top" className="hero-section">
          <Typography component="h1" className="hero-title">Understand any <Box component="span">page</Box></Typography>
          <Typography component="p" className="hero-description">Fetch any public page into pageOracle and use its text as your AI-powered reading context.<br />Enter a URL to get started.</Typography>
          <Stack component="form" direction="row" onSubmit={handleSubmit} noValidate className="signup-form">
            <TextField value={url} onChange={(event) => { setUrl(event.target.value); if (error) setError(''); }} placeholder="Enter a page URL" variant="outlined" aria-label="Page URL" error={Boolean(error)} helperText={error || ' '} fullWidth />
            <Button type="submit" variant="contained" className="dark-button start-button" disabled={loading}>{loading ? 'Fetching…' : 'Start now'}</Button>
          </Stack>
          {page ? (
            <Box className="browser-workspace" aria-label="Fetched page text">
              <Box className="browser-toolbar"><span className="browser-secure">●</span><Typography noWrap>{page.url}</Typography></Box>
              <Box className="extracted-page" sx={{ textAlign: 'left', '& h1, & h2, & h3, & h4, & h5, & h6': { color: '#101827', lineHeight: 1.25, margin: '1.5rem 0 .75rem' }, '& p': { color: '#42536f', fontSize: '18px', lineHeight: 1.8, margin: '0 0 1.25rem' }, '& li': { color: '#42536f', lineHeight: 1.7, margin: '.5rem 0' }, '& blockquote': { borderLeft: '4px solid #0878ee', color: '#52627d', fontStyle: 'italic', margin: '1.5rem 0', padding: '.75rem 1rem' }, '& pre': { overflowX: 'auto', padding: '1rem', background: '#f0f4f9', borderRadius: '8px' }, '& img': { maxWidth: '100%', height: 'auto' }, '& table': { borderCollapse: 'collapse', maxWidth: '100%', display: 'block', overflowX: 'auto' }, '& th, & td': { border: '1px solid #dbe4ef', padding: '.5rem', textAlign: 'left' } }}>
                <Typography className="preview-kicker">FETCHED PAGE · {page.wordCount.toLocaleString()} WORDS</Typography>
                <Typography component="h2">{page.title}</Typography>
                <Box dangerouslySetInnerHTML={{ __html: page.html }} />
              </Box>
              <Button component="a" href={page.url} target="_blank" rel="noreferrer" className="open-tab-button">Open original page ↗</Button>
            </Box>
          ) : (
            <Box className="product-preview" aria-label="pageOracle product preview"><Box className="preview-toolbar"><span /><span /><span /></Box><Box className="preview-content"><Box className="preview-article"><Typography className="preview-kicker">READING CONTEXT</Typography><Typography component="h2">Turn every page into a conversation.</Typography><Typography>Fetch public page text, find the key ideas, and move from reading to action.</Typography></Box><Box className="assistant-card"><Typography className="preview-kicker">PAGEORACLE AI</Typography><Typography component="h3">What does this mean?</Typography><Typography>It means you can turn complex content into clear explanations and practical next steps.</Typography></Box></Box></Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
