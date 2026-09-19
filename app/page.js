'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Container, Link, Stack, TextField, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

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

function ChatGptIcon() {
  return <svg className="ai-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" d="M12 3.3a4.1 4.1 0 0 1 3.9 2.9 4.1 4.1 0 0 1 3.9 5.8 4.1 4.1 0 0 1-3.3 6.2 4.1 4.1 0 0 1-7.1 2.1 4.1 4.1 0 0 1-5-4.9 4.1 4.1 0 0 1 2.9-6.8A4.1 4.1 0 0 1 12 3.3Z" /><path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" d="m12 3.3 3.9 2.9-.2 4.8-3.7 2.2-4.1-2.2V6.4M19.8 12l-4.1-1-3.7 2.2.1 4.5 3.7 2.5M16.5 18.2l-3.2-3.1-4.1 1.8-2.7-1.5M4.4 10.6l4.5.4 2.9-3.1-.1-4.6M5.3 15.4l-.8-4.8 4.1-2.7 4 2.1" /></svg>;
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
  const [isShaking, setIsShaking] = useState(false);
  const contentRef = useRef(null);
  const popoverRef = useRef(null);
  const aiButtonRef = useRef(null);
  const shakeTimerRef = useRef(null);

  function resetSelection() {
    setSelection('');
    setSelectionRect(null);
    setPopoverPosition(null);
    window.getSelection()?.removeAllRanges();
  }

  function readSelection() {
    const current = window.getSelection();
    if (!current || current.isCollapsed || !contentRef.current?.contains(current.anchorNode)) return null;
    const value = current.toString().trim();
    if (!value) return null;
    const rect = current.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) return null;
    return { value: value.slice(0, 12000), rect };
  }

  useEffect(() => {
    const handleSelection = () => {
      const selected = readSelection();
      if (!selected) return;
      setSelection(selected.value);
      setSelectionRect(selected.rect);
      setPopoverPosition(null);
      setIsShaking(true);
      window.clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = window.setTimeout(() => setIsShaking(false), 900);
    };
    const handlePointerDown = (event) => {
      if (contentRef.current?.contains(event.target) || popoverRef.current?.contains(event.target) || aiButtonRef.current?.contains(event.target)) return;
      resetSelection();
    };
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('mousedown', handlePointerDown);
      window.clearTimeout(shakeTimerRef.current);
    };
  }, [page]);

  useEffect(() => () => window.clearTimeout(shakeTimerRef.current), []);

  async function loadPage(targetUrl) {
    setLoading(true); setError(''); setConversation([]); resetSelection();
    try {
      const response = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: targetUrl }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to read this page.');
      setPage(result);
    } catch (requestError) { setPage(null); setError(requestError.message); } finally { setLoading(false); }
  }

  useEffect(() => {
    const savedUrl = new URLSearchParams(window.location.search).get('url');
    if (savedUrl && !validateUrl(savedUrl)) {
      const normalized = /^https?:\/\//i.test(savedUrl) ? savedUrl : `https://${savedUrl}`;
      setUrl(normalized); loadPage(normalized);
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateUrl(url);
    if (validationError) { setError(validationError); setPage(null); return; }
    const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    setUrl(normalizedUrl);
    window.history.replaceState({}, '', `?url=${encodeURIComponent(normalizedUrl)}`);
    await loadPage(normalizedUrl);
  }

  function openAsk() {
    if (!selectionRect) return;
    const gap = 14;
    const width = Math.min(780, window.innerWidth - 32);
    const height = Math.min(560, window.innerHeight - 32);
    const centeredLeft = selectionRect.left + selectionRect.width / 2 - width / 2;
    const left = Math.min(Math.max(16, centeredLeft), window.innerWidth - width - 16);
    const above = selectionRect.top - height - gap;
    const below = selectionRect.bottom + gap;
    let top = above;
    let finalLeft = left;
    if (above < 16 && below <= window.innerHeight - 16) top = below;
    else if (above < 16 && below > window.innerHeight - 16) {
      top = Math.max(16, Math.min(selectionRect.top, window.innerHeight - height - 16));
      if (selectionRect.left >= width + gap) finalLeft = selectionRect.left - width - gap;
      else if (selectionRect.right + width + gap <= window.innerWidth) finalLeft = selectionRect.right + gap;
    }
    setPopoverPosition({ top, left: finalLeft, width, height });
    setConversation([]);
    setQuestion('Explain this in simple terms.');
  }

  function closeAsk() {
    setPopoverPosition(null);
    window.getSelection()?.removeAllRanges();
    setSelection('');
    setSelectionRect(null);
  }

  async function askAi(event) {
    event?.preventDefault();
    if (!question.trim() || !selection || chatLoading) return;
    const askedQuestion = question.trim(); setQuestion(''); setChatLoading(true);
    setConversation((items) => [...items, { role: 'user', text: askedQuestion }]);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ selection, question: askedQuestion, pageTitle: page?.title, pageUrl: page?.url }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to ask AI.');
      setConversation((items) => [...items, { role: 'assistant', text: result.answer }]);
    } catch (requestError) { setConversation((items) => [...items, { role: 'error', text: requestError.message }]); } finally { setChatLoading(false); }
  }

  const popoverSx = popoverPosition ? { position: 'fixed', top: popoverPosition.top, left: popoverPosition.left, width: popoverPosition.width, height: popoverPosition.height, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', zIndex: 1000, backgroundColor: '#fff', color: '#101827', border: '1px solid #dbe4ef', borderRadius: 3, boxShadow: '0 16px 40px rgba(31,55,90,.24)', padding: { xs: 2, sm: 3 }, opacity: 1 } : {};

  return <Box className={`marketing-page ${page ? 'browser-mode' : ''}`}>
    <Container maxWidth="xl" className="marketing-container">
      <Box component="header" className="site-nav"><Link href="#top" underline="none" className="brand"><Typography component="span" className="brand-name">pageOracle</Typography></Link><Box component="nav" className="nav-links" aria-label="Main navigation">{navItems.map((item) => <Link key={item} href={`#${item.toLowerCase()}`} underline="none">{item}</Link>)}</Box><Stack direction="row" spacing={3} alignItems="center" className="nav-actions"><Link href="#signin" underline="none">Sign in</Link><Button type="button" variant="contained" className="dark-button">Sign up</Button></Stack></Box>
      <Box component="main" id="top" className="hero-section">
        <Typography component="h1" className="hero-title">Understand any <Box component="span">page</Box></Typography>
        <Typography component="p" className="hero-description">Fetch any public page into pageOracle and ask AI about selected text.<br />Enter a URL to get started.</Typography>
        <Stack component="form" direction="row" onSubmit={handleSubmit} noValidate className="signup-form"><TextField value={url} onChange={(event) => { setUrl(event.target.value); if (error) setError(''); }} placeholder="Enter a page URL" variant="outlined" aria-label="Page URL" error={Boolean(error)} helperText={error || ' '} fullWidth /><Button type="submit" variant="contained" className="dark-button start-button" disabled={loading}>{loading ? 'Fetching…' : 'Start now'}</Button></Stack>
        {page ? <Box className="browser-workspace" aria-label="Fetched page text"><Box className="browser-toolbar">{page.title && <Typography noWrap component="h1" className="page-title">{page.title}</Typography>}</Box><Box ref={contentRef} className="extracted-page" sx={{ position: 'relative', textAlign: 'left', userSelect: 'text', '& h1, & h2, & h3, & h4, & h5, & h6': { color: '#101827', lineHeight: 1.25, margin: '1.5rem 0 .75rem' }, '& p': { color: '#42536f', fontSize: '18px', lineHeight: 1.8, margin: '0 0 1.25rem' }, '& li': { color: '#42536f', lineHeight: 1.7, margin: '.5rem 0' }, '& blockquote': { borderLeft: '4px solid #0878ee', color: '#52627d', fontStyle: 'italic', margin: '1.5rem 0', padding: '.75rem 1rem' }, '& img': { maxWidth: '100%', height: 'auto' } }}><Typography className="preview-kicker">FETCHED PAGE · {page.wordCount.toLocaleString()} WORDS</Typography><Box dangerouslySetInnerHTML={{ __html: page.html }} /></Box><Tooltip title="Ask AI" placement="left" arrow><Button ref={aiButtonRef} type="button" aria-label="Ask AI" className={isShaking ? 'ai-button-shake' : ''} variant="contained" disabled={!selectionRect} onMouseDown={(event) => event.preventDefault()} onClick={openAsk} startIcon={<ChatGptIcon />} sx={{ position: 'fixed', top: { xs: 16, sm: 24 }, right: { xs: 16, sm: 28 }, zIndex: 20, minWidth: 52, width: 52, height: 52, borderRadius: '50%', padding: 0, color: '#fff', '& svg.ai-icon': { display: 'block', width: 24, height: 24, color: '#fff' }, opacity: selectionRect ? 1 : 0.5, transition: 'opacity .2s', '& .MuiButton-startIcon': { margin: 0 } }} /></Tooltip>{popoverPosition && <Box ref={popoverRef} className="ai-popover" sx={popoverSx}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={700} fontSize="1.5rem">Ask AI</Typography><Tooltip title="Close" arrow><Button type="button" aria-label="Close" onClick={closeAsk} sx={{ minWidth: 40, width: 40, height: 40, borderRadius: '50%', padding: 0 }}><CloseIcon /></Button></Tooltip></Stack><Typography className="selection-preview">“{selection}”</Typography><Box className="conversation">{conversation.map((item, index) => <Box key={`${item.role}-${index}`} className={`chat-message ${item.role}`}><Typography>{item.text}</Typography></Box>)}</Box><Box component="form" onSubmit={askAi} className="chat-form"><TextField value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a follow-up…" size="small" fullWidth /><Tooltip title="Send" arrow><Button type="submit" aria-label="Send" disabled={chatLoading || !question.trim()} sx={{ minWidth: 44, width: 44, height: 44, borderRadius: '50%', padding: 0 }}><SendIcon /></Button></Tooltip></Box></Box>}</Box> : <Box className="product-preview" aria-label="pageOracle product preview"><Box className="preview-toolbar"><span /><span /><span /></Box><Box className="preview-content"><Box className="preview-article"><Typography className="preview-kicker">READING CONTEXT</Typography><Typography component="h2">Turn every page into a conversation.</Typography><Typography>Fetch public page text, find the key ideas, and ask questions about it.</Typography></Box><Box className="assistant-card"><Typography className="preview-kicker">PAGEORACLE AI</Typography><Typography component="h3">What does this mean?</Typography><Typography>Highlight text after loading a page to start a conversation.</Typography></Box></Box></Box>}
      </Box>
    </Container>
  </Box>;
}
