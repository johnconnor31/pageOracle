'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Container, Link, Stack, TextField, Typography } from '@mui/material';

const navItems = ['Features', 'Testimonials', 'Highlights', 'Pricing', 'FAQ', 'Blog'];

function validateUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter a page URL.';
  if (trimmed.length > 2048) return 'The URL must be 2,048 characters or fewer.';
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
  const [selection, setSelection] = useState('');
  const [selectionRect, setSelectionRect] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const contentRef = useRef(null);

  function readSelection() {
    const current = window.getSelection();
    if (!current || current.isCollapsed || !contentRef.current?.contains(current.anchorNode)) return null;
    const value = current.toString().trim();
    if (!value) return null;
    const range = current.getRangeAt(0).getBoundingClientRect();
    return { value: value.slice(0, 12000), rect: range };
  }

  useEffect(() => {
    const handleSelection = () => {
      const selected = readSelection();
      if (!selected) return;
      setSelection(selected.value);
      setSelectionRect(selected.rect);
      setPopoverPosition(null);
    };
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [page]);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateUrl(url);
    if (validationError) { setError(validationError); setPage(null); return; }
    const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    setUrl(normalizedUrl); setError(''); setLoading(true); setConversation([]); setSelection(''); setSelectionRect(null); setPopoverPosition(null);
    try {
      const response = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: normalizedUrl }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to read this page.');
      setPage(result);
    } catch (requestError) { setPage(null); setError(requestError.message); } finally { setLoading(false); }
  }

  function openAsk() {
    if (!selectionRect || !contentRef.current) return;
    const container = contentRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const popoverWidth = Math.min(780, viewportWidth - 32);
    const popoverHeight = Math.min(560, window.innerHeight - 32);
    const leftViewport = Math.min(Math.max(16, selectionRect.left), viewportWidth - popoverWidth - 16);
    const above = selectionRect.top - popoverHeight - 12;
    const topViewport = above >= 16 ? above : Math.min(selectionRect.bottom + 12, window.innerHeight - popoverHeight - 16);
    setPopoverPosition({ top: topViewport - container.top, left: leftViewport - container.left, width: popoverWidth, height: popoverHeight });
    setConversation([]);
    setQuestion('Explain this in simple terms.');
  }

  function closeAsk() {
    setPopoverPosition(null);
    window.getSelection()?.removeAllRanges();
    if (selection && contentRef.current) {
      const walker = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const index = node.nodeValue.indexOf(selection);
        if (index >= 0) {
          const range = document.createRange();
          range.setStart(node, index); range.setEnd(node, index + selection.length);
          const mark = document.createElement('mark');
          mark.className = 'saved-highlight';
          range.surroundContents(mark);
          break;
        }
      }
    }
  }

  async function askAi(event) {
    event?.preventDefault();
    if (!question.trim() || !selection || chatLoading) return;
    const askedQuestion = question.trim();
    setQuestion(''); setChatLoading(true);
    setConversation((items) => [...items, { role: 'user', text: askedQuestion }]);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ selection, question: askedQuestion, pageTitle: page?.title, pageUrl: page?.url }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to ask AI.');
      setConversation((items) => [...items, { role: 'assistant', text: result.answer }]);
    } catch (requestError) { setConversation((items) => [...items, { role: 'error', text: requestError.message }]); } finally { setChatLoading(false); }
  }

  const popoverSx = popoverPosition ? {
    position: 'absolute', top: popoverPosition.top, left: popoverPosition.left, width: popoverPosition.width,
    height: popoverPosition.height, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', zIndex: 10,
    backgroundColor: '#fff', color: '#101827', border: '1px solid #dbe4ef', borderRadius: 3,
    boxShadow: '0 16px 40px rgba(31,55,90,.24)', padding: { xs: 2, sm: 3 }, opacity: 1,
  } : {};

  return <Box className={`marketing-page ${page ? 'browser-mode' : ''}`}>
    <Container maxWidth="xl" className="marketing-container">
      <Box component="header" className="site-nav"><Link href="#top" underline="none" className="brand"><Typography component="span" className="brand-name">pageOracle</Typography></Link><Box component="nav" className="nav-links" aria-label="Main navigation">{navItems.map((item) => <Link key={item} href={`#${item.toLowerCase()}`} underline="none">{item}</Link>)}</Box><Stack direction="row" spacing={3} alignItems="center" className="nav-actions"><Link href="#signin" underline="none">Sign in</Link><Button variant="contained" className="dark-button">Sign up</Button></Stack></Box>
      <Box component="main" id="top" className="hero-section">
        <Typography component="h1" className="hero-title">Understand any <Box component="span">page</Box></Typography>
        <Typography component="p" className="hero-description">Fetch any public page into pageOracle and ask AI about selected text.<br />Enter a URL to get started.</Typography>
        <Stack component="form" direction="row" onSubmit={handleSubmit} noValidate className="signup-form"><TextField value={url} onChange={(event) => { setUrl(event.target.value); if (error) setError(''); }} placeholder="Enter a page URL" variant="outlined" aria-label="Page URL" error={Boolean(error)} helperText={error || ' '} fullWidth /><Button type="submit" variant="contained" className="dark-button start-button" disabled={loading}>{loading ? 'Fetching…' : 'Start now'}</Button></Stack>
        {page ? <Box className="browser-workspace" aria-label="Fetched page text"><Box className="browser-toolbar"><span className="browser-secure">●</span><Typography noWrap>{page.url}</Typography></Box><Box ref={contentRef} className="extracted-page" sx={{ position: 'relative', textAlign: 'left', '& h1, & h2, & h3, & h4, & h5, & h6': { color: '#101827', lineHeight: 1.25, margin: '1.5rem 0 .75rem' }, '& p': { color: '#42536f', fontSize: '18px', lineHeight: 1.8, margin: '0 0 1.25rem' }, '& li': { color: '#42536f', lineHeight: 1.7, margin: '.5rem 0' }, '& blockquote': { borderLeft: '4px solid #0878ee', color: '#52627d', fontStyle: 'italic', margin: '1.5rem 0', padding: '.75rem 1rem' }, '& img': { maxWidth: '100%', height: 'auto' } }}><Typography className="preview-kicker">FETCHED PAGE · {page.wordCount.toLocaleString()} WORDS</Typography><Typography component="h2">{page.title}</Typography><Box dangerouslySetInnerHTML={{ __html: page.html }} />{popoverPosition && <Box className="ai-popover" sx={popoverSx}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={700} fontSize="1.5rem">Ask AI</Typography><Button size="small" onClick={closeAsk}>Close</Button></Stack><Typography className="selection-preview">“{selection}”</Typography><Box className="conversation">{conversation.map((item, index) => <Box key={`${item.role}-${index}`} className={`chat-message ${item.role}`}><Typography>{item.text}</Typography></Box>)}</Box><Box component="form" onSubmit={askAi} className="chat-form"><TextField value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a follow-up…" size="small" fullWidth /><Button type="submit" disabled={chatLoading || !question.trim()}>{chatLoading ? '…' : 'Send'}</Button></Box></Box>}</Box>{selection && !popoverPosition && <Button className="ask-ai-sticky" variant="contained" onClick={openAsk} sx={{ position: 'fixed', right: { xs: 16, sm: 28 }, bottom: { xs: 16, sm: 28 }, zIndex: 20, minWidth: 140 }}>Ask AI</Button>}</Box> : <Box className="product-preview" aria-label="pageOracle product preview"><Box className="preview-toolbar"><span /><span /><span /></Box><Box className="preview-content"><Box className="preview-article"><Typography className="preview-kicker">READING CONTEXT</Typography><Typography component="h2">Turn every page into a conversation.</Typography><Typography>Fetch public page text, find the key ideas, and ask questions about it.</Typography></Box><Box className="assistant-card"><Typography className="preview-kicker">PAGEORACLE AI</Typography><Typography component="h3">What does this mean?</Typography><Typography>Highlight text after loading a page to start a conversation.</Typography></Box></Box></Box>}
      </Box>
    </Container>
  </Box>;
}
