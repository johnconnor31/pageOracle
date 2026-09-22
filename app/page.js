'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Container, Link, Stack, TextField, Typography } from '@mui/material';

function validateUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter a page URL.';
  if (trimmed.length > 2048) return 'The URL must be 2,048 characters or fewer.';
  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) return 'Enter a valid HTTP or HTTPS URL.';
    return '';
  } catch {
    return 'Enter a valid URL, such as https://example.com.';
  }
}

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(null);
  const [renderMode, setRenderMode] = useState('fallback');
  const [selection, setSelection] = useState('');
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const contentRef = useRef(null);
  const iframeTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(iframeTimerRef.current), []);

  useEffect(() => {
    const handleSelection = () => {
      if (renderMode !== 'fallback') return;
      const currentSelection = window.getSelection();
      if (!currentSelection || currentSelection.isCollapsed || !contentRef.current?.contains(currentSelection.anchorNode)) return;
      const value = currentSelection.toString().trim();
      if (!value) return;
      const range = currentSelection.getRangeAt(0).getBoundingClientRect();
      const container = contentRef.current.getBoundingClientRect();
      setSelection(value.slice(0, 12000));
      setSelectionPosition({ top: range.bottom - container.top + 10, left: Math.max(8, range.left - container.left) });
    };
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [renderMode, page]);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateUrl(url);
    if (validationError) { setError(validationError); setPage(null); return; }
    const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    setUrl(normalizedUrl); setError(''); setLoading(true); setConversation([]); setSelection(''); setSelectionPosition(null);
    window.history.replaceState({}, '', `?url=${encodeURIComponent(normalizedUrl)}`);
    try {
      const response = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: normalizedUrl }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to read this page.');
      setPage(result);
      setRenderMode(result.canEmbed ? 'iframe' : 'fallback');
    } catch (requestError) { setPage(null); setError(requestError.message); } finally { setLoading(false); }
  }

  useEffect(() => {
    const savedUrl = new URLSearchParams(window.location.search).get('url');
    if (!savedUrl || validateUrl(savedUrl)) return;
    const normalized = /^https?:\/\//i.test(savedUrl) ? savedUrl : `https://${savedUrl}`;
    setUrl(normalized);
    fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: normalized }) })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Unable to read this page.'); setPage(result); setRenderMode(result.canEmbed ? 'iframe' : 'fallback'); })
      .catch((requestError) => setError(requestError.message));
  }, []);

  function handleIframeLoad() {
    window.clearTimeout(iframeTimerRef.current);
  }

  function handleIframeError() {
    window.clearTimeout(iframeTimerRef.current);
    setRenderMode('fallback');
  }

  function openAsk() {
    setSelectionPosition(null); setConversation([]); setQuestion('Explain this in simple terms.');
  }

  function closeAsk() {
    setSelectionPosition(null); window.getSelection()?.removeAllRanges();
    if (selection && contentRef.current) {
      const walker = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const index = node.nodeValue.indexOf(selection);
        if (index >= 0) {
          const range = document.createRange(); range.setStart(node, index); range.setEnd(node, index + selection.length);
          const mark = document.createElement('mark'); mark.className = 'saved-highlight'; range.surroundContents(mark); break;
        }
      }
    }
  }

  async function askAi(event) {
    event?.preventDefault();
    if (!question.trim() || !selection || chatLoading) return;
    const askedQuestion = question.trim(); setQuestion(''); setChatLoading(true);
    setConversation((items) => [...items, { role: 'user', text: askedQuestion }]);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ selection, question: askedQuestion, pageTitle: page?.title, pageUrl: page?.url }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Unable to ask AI.');
      setConversation((items) => [...items, { role: 'assistant', text: result.answer }]);
    } catch (requestError) { setConversation((items) => [...items, { role: 'error', text: requestError.message }]); } finally { setChatLoading(false); }
  }

  const popoverSx = { position: 'absolute', top: selectionPosition?.top + 42, left: selectionPosition?.left, zIndex: 4, width: { xs: 'calc(100% - 16px)', sm: 600, md: 780 }, maxWidth: 'calc(100% - 16px)', minHeight: { xs: 420, sm: 500 }, maxHeight: 'min(720px, calc(100vh - 24px))', overflowY: 'auto', backgroundColor: '#fff', color: '#101827', border: '1px solid #dbe4ef', borderRadius: '14px', boxShadow: '0 16px 40px rgba(31,55,90,.24)', padding: { xs: 2, sm: 3 }, opacity: 1 };

  return <Box className={`marketing-page ${page ? 'browser-mode' : ''}`}>
    <Container maxWidth="xl" className="marketing-container">
      <Box component="header" className="site-nav"><Link href="#top" underline="none" className="brand"><Typography component="span" className="brand-name">pageOracle</Typography></Link><Stack direction="row" spacing={2} alignItems="center" className="nav-actions" sx={{ marginLeft: 'auto' }}><Link href="#signin" underline="none">Sign in</Link><Button type="button" variant="contained" className="dark-button">Sign up</Button></Stack></Box>
      <Box component="main" id="top" className="hero-section">
        {!page && <><Typography component="h1" className="hero-title">Understand any <Box component="span">page</Box></Typography><Typography component="p" className="hero-description">Fetch any public page into pageOracle and ask AI about selected text.<br />Enter a URL to get started.</Typography></>}
        <Stack component="form" direction="row" onSubmit={handleSubmit} noValidate className="signup-form"><TextField value={url} onChange={(event) => { setUrl(event.target.value); if (error) setError(''); }} placeholder="Enter a page URL" variant="outlined" aria-label="Page URL" error={Boolean(error)} helperText={error || ' '} fullWidth /><Button type="submit" variant="contained" className="dark-button start-button" disabled={loading}>{loading ? 'Fetching…' : 'Start now'}</Button></Stack>
        {page ? <Box className="browser-workspace" aria-label="Fetched page">
          {page.title && <Typography component="h1" className="page-title">{page.title}</Typography>}
          {renderMode === 'iframe' ? <Box className="original-page-frame"><iframe title={page.title || 'Fetched page'} src={page.url} onLoad={handleIframeLoad} onError={handleIframeError} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" /></Box> : <Box ref={contentRef} className="extracted-page" sx={{ position: 'relative', textAlign: 'left', userSelect: 'text', '& h1, & h2, & h3, & h4, & h5, & h6': { color: '#101827', lineHeight: 1.25, margin: '1.5rem 0 .75rem' }, '& p': { color: '#42536f', fontSize: '18px', lineHeight: 1.8, margin: '0 0 1.25rem' }, '& li': { color: '#42536f', lineHeight: 1.7, margin: '.5rem 0' }, '& img': { maxWidth: '100%', height: 'auto' } }}><Typography className="preview-kicker">FETCHED PAGE · {page.wordCount.toLocaleString()} WORDS</Typography><Box dangerouslySetInnerHTML={{ __html: page.html }} />{selectionPosition && <Button className="ask-ai-button" variant="contained" onMouseDown={(event) => event.preventDefault()} onClick={openAsk} sx={{ position: 'absolute', top: selectionPosition.top, left: selectionPosition.left }}>Ask AI</Button>}</Box>}
          {renderMode === 'fallback' && selectionPosition && <Box className="ai-popover" sx={popoverSx}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={700} fontSize="1.5rem">Ask AI</Typography><Button size="small" onClick={closeAsk}>Close</Button></Stack><Typography className="selection-preview">“{selection}”</Typography><Box className="conversation">{conversation.map((item, index) => <Box key={`${item.role}-${index}`} className={`chat-message ${item.role}`}><Typography>{item.text}</Typography></Box>)}</Box><Box component="form" onSubmit={askAi} className="chat-form"><TextField value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a follow-up…" size="small" fullWidth /><Button type="submit" disabled={chatLoading || !question.trim()}>{chatLoading ? '…' : 'Send'}</Button></Box></Box>}
        </Box> : <Box className="product-preview" aria-label="pageOracle product preview"><Box className="preview-toolbar"><span /><span /><span /></Box><Box className="preview-content"><Box className="preview-article"><Typography className="preview-kicker">READING CONTEXT</Typography><Typography component="h2">Turn every page into a conversation.</Typography><Typography>Fetch public page text, find the key ideas, and ask questions about it.</Typography></Box><Box className="assistant-card"><Typography className="preview-kicker">PAGEORACLE AI</Typography><Typography component="h3">What does this mean?</Typography><Typography>Highlight text after loading a page to start a conversation.</Typography></Box></Box></Box>}
      </Box>
    </Container>
  </Box>;
}
