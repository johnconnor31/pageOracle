'use client';

import { useMemo } from 'react';
import { Box, Button, Container, Link, Stack, Typography } from '@mui/material';

const steps = [
  ['1', 'Download the extension', 'Open the extension folder in this repository or download the project source.'],
  ['2', 'Open your browser extensions page', 'In Chrome or Edge, open the extensions manager and enable Developer mode.'],
  ['3', 'Load the extension', 'Choose “Load unpacked” and select the extension folder.'],
  ['4', 'Start reading', 'Open any webpage, select text, and click the pageOracle button to ask AI.'],
];

export default function HomePage() {
  const browserName = useMemo(() => {
    if (typeof navigator === 'undefined') return 'your browser';
    if (/Edg\//.test(navigator.userAgent)) return 'Microsoft Edge';
    if (/Chrome\//.test(navigator.userAgent)) return 'Google Chrome';
    return 'your browser';
  }, []);

  return (
    <Box className="marketing-page installer-page">
      <Container maxWidth="lg" className="marketing-container">
        <Box component="header" className="site-nav">
          <Link href="#top" underline="none" className="brand">
            <Typography component="span" className="brand-name">pageOracle</Typography>
          </Link>
          <Stack direction="row" spacing={2} alignItems="center" className="nav-actions" sx={{ marginLeft: 'auto' }}>
            <Link href="#signin" underline="none">Sign in</Link>
            <Button type="button" variant="contained" className="dark-button">Sign up</Button>
          </Stack>
        </Box>

        <Box component="main" id="top" className="installer-hero">
          <Typography className="preview-kicker">BROWSER EXTENSION</Typography>
          <Typography component="h1" className="hero-title">Understand any <Box component="span">page</Box></Typography>
          <Typography component="p" className="hero-description">
            Ask AI about any webpage without leaving the page you are reading.
            <br />Install pageOracle for {browserName} to get started.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 5 }}>
            <Button component="a" href="https://github.com/johnconnor31/pageOracle/tree/main/extension" target="_blank" rel="noreferrer" variant="contained" className="dark-button installer-primary-button">
              Get the extension
            </Button>
            <Button component="a" href="https://github.com/johnconnor31/pageOracle" target="_blank" rel="noreferrer" variant="outlined" className="installer-secondary-button">
              View source
            </Button>
          </Stack>

          <Box component="section" className="install-card" aria-labelledby="install-heading">
            <Typography component="h2" id="install-heading">Install in four steps</Typography>
            <Box className="install-steps">
              {steps.map(([number, title, description]) => (
                <Box className="install-step" key={number}>
                  <Box className="install-step-number">{number}</Box>
                  <Box>
                    <Typography component="h3">{title}</Typography>
                    <Typography>{description}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Typography className="install-note">
              The extension uses this Next.js app for AI requests. Keep the app running locally, or configure the extension API URL for your deployed pageOracle instance.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
