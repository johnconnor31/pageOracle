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
    if (!['http:', 'https:'].includes(parsed.protocol)) return 'Use an HTTP or HTTPS URL.';
    if (!parsed.hostname || !parsed.hostname.includes('.')) return 'Enter a valid domain, such as example.com.';
    return '';
  } catch {
    return 'Enter a valid URL, such as https://example.com.';
  }
}

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [openedUrl, setOpenedUrl] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationError = validateUrl(url);

    if (validationError) {
      setError(validationError);
      setOpenedUrl('');
      return;
    }

    const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    setError('');
    setUrl(normalizedUrl);
    setOpenedUrl(normalizedUrl);
  };

  return (
    <Box className={`marketing-page ${openedUrl ? 'browser-mode' : ''}`}>
      <Container maxWidth="xl" className="marketing-container">
        <Box component="header" className="site-nav">
          <Link href="#top" underline="none" className="brand">
            <Box className="brand-mark" aria-hidden="true"><span className="mark-one" /><span className="mark-two" /><span className="mark-three" /><span className="mark-four" /></Box>
            <Typography component="span" className="brand-name">pageOracle</Typography>
          </Link>
          <Box component="nav" className="nav-links" aria-label="Main navigation">
            {navItems.map((item) => <Link key={item} href={`#${item.toLowerCase()}`} underline="none">{item}</Link>)}
          </Box>
          <Stack direction="row" spacing={3} alignItems="center" className="nav-actions">
            <Link href="#signin" underline="none">Sign in</Link>
            <Button variant="contained" className="dark-button">Sign up</Button>
          </Stack>
        </Box>

        <Box component="main" id="top" className="hero-section">
          <Typography component="h1" className="hero-title">Understand any <Box component="span">page</Box></Typography>
          <Typography component="p" className="hero-description">Open any page inside pageOracle and use it as your AI-powered reading browser.<br />Enter a URL to get started.</Typography>

          <Stack component="form" direction="row" onSubmit={handleSubmit} noValidate className="signup-form">
            <TextField
              value={url}
              onChange={(event) => { setUrl(event.target.value); if (error) setError(''); }}
              placeholder="Enter a page URL"
              variant="outlined"
              aria-label="Page URL"
              error={Boolean(error)}
              helperText={error || ' '}
              fullWidth
            />
            <Button type="submit" variant="contained" className="dark-button start-button">Start now</Button>
          </Stack>
          {!openedUrl && <Typography component="p" className="terms-copy">By clicking &quot;Start now&quot; you agree to our <Link href="#terms">Terms &amp; Conditions</Link>.</Typography>}

          {openedUrl ? (
            <Box className="browser-workspace" aria-label="Page browser">
              <Box className="browser-toolbar"><span className="browser-secure">●</span><Typography noWrap>{openedUrl}</Typography></Box>
              <iframe key={openedUrl} src={openedUrl} title={`Page preview for ${openedUrl}`} className="page-frame" />
              <Typography className="frame-note">Some websites prevent embedding in an iframe. If the page is blank, open it directly in a new tab.</Typography>
              <Button component="a" href={openedUrl} target="_blank" rel="noreferrer" className="open-tab-button">Open in new tab ↗</Button>
            </Box>
          ) : (
            <Box className="product-preview" aria-label="pageOracle product preview">
              <Box className="preview-toolbar"><span /><span /><span /></Box>
              <Box className="preview-content">
                <Box className="preview-article"><Typography className="preview-kicker">READING CONTEXT</Typography><Typography component="h2">Turn every page into a conversation.</Typography><Typography>Highlight any paragraph to ask questions, find the key ideas, and move from reading to action.</Typography><Box className="highlight-line" /><Box className="text-lines"><span /><span /><span /><span /></Box></Box>
                <Box className="assistant-card"><Typography className="preview-kicker">PAGEORACLE AI</Typography><Typography component="h3">What does this mean?</Typography><Typography>It means you can turn complex content into clear explanations and practical next steps.</Typography><Button className="ask-button">Ask another question&nbsp; →</Button></Box>
              </Box>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
