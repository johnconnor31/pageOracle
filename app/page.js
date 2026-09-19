import { Box, Button, Container, Link, Stack, TextField, Typography } from '@mui/material';

const navItems = ['Features', 'Testimonials', 'Highlights', 'Pricing', 'FAQ', 'Blog'];

export default function HomePage() {
  return (
    <Box className="marketing-page">
      <Container maxWidth="xl" className="marketing-container">
        <Box component="header" className="site-nav">
          <Link href="#top" underline="none" className="brand">
            <Box className="brand-mark" aria-hidden="true">
              <span className="mark-one" />
              <span className="mark-two" />
              <span className="mark-three" />
              <span className="mark-four" />
            </Box>
            <Typography component="span" className="brand-name">pageOracle</Typography>
          </Link>

          <Box component="nav" className="nav-links" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link key={item} href={`#${item.toLowerCase()}`} underline="none">{item}</Link>
            ))}
          </Box>

          <Stack direction="row" spacing={3} alignItems="center" className="nav-actions">
            <Link href="#signin" underline="none">Sign in</Link>
            <Button variant="contained" className="dark-button">Sign up</Button>
          </Stack>
        </Box>

        <Box component="main" id="top" className="hero-section">
          <Typography component="h1" className="hero-title">
            Understand any <Box component="span">page</Box>
          </Typography>
          <Typography component="p" className="hero-description">
            Select any text on the web and let pageOracle explain, summarize, and contextualize it in seconds.
            <br />Your AI reading companion for learning faster.
          </Typography>

          <Stack component="form" direction="row" className="signup-form">
            <TextField
              type="email"
              placeholder="Your email address"
              variant="outlined"
              aria-label="Email address"
              fullWidth
            />
            <Button type="submit" variant="contained" className="dark-button start-button">Start now</Button>
          </Stack>
          <Typography component="p" className="terms-copy">
            By clicking &quot;Start now&quot; you agree to our <Link href="#terms">Terms &amp; Conditions</Link>.
          </Typography>

          <Box className="product-preview" aria-label="pageOracle product preview">
            <Box className="preview-toolbar"><span /><span /><span /></Box>
            <Box className="preview-content">
              <Box className="preview-article">
                <Typography className="preview-kicker">READING CONTEXT</Typography>
                <Typography component="h2">Turn every page into a conversation.</Typography>
                <Typography>Highlight any paragraph to ask questions, find the key ideas, and move from reading to action.</Typography>
                <Box className="highlight-line" />
                <Box className="text-lines"><span /><span /><span /><span /></Box>
              </Box>
              <Box className="assistant-card">
                <Typography className="preview-kicker">PAGEORACLE AI</Typography>
                <Typography component="h3">What does this mean?</Typography>
                <Typography>It means you can turn complex content into clear explanations and practical next steps.</Typography>
                <Button className="ask-button">Ask another question&nbsp; →</Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
