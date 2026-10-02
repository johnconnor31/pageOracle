import { NextResponse } from 'next/server';

const MAX_SELECTION_LENGTH = 12_000;
const MAX_MESSAGE_LENGTH = 2_000;
const DEFAULT_SARVAM_MODEL = 'Meta-Llama-3-8B-Instruct';

export async function POST(request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  console.log('[pageOracle/api/chat] request started', { requestId });

  if (!process.env.SARVAM_API_KEY) {
    console.error('[pageOracle/api/chat] missing SARVAM_API_KEY', { requestId });
    return NextResponse.json(
      { error: 'SARVAM_API_KEY is not configured on the server.' },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { selection, question, pageTitle, pageUrl } = body || {};

    console.log('[pageOracle/api/chat] request parsed', {
      requestId,
      selectionLength: typeof selection === 'string' ? selection.length : null,
      questionLength: typeof question === 'string' ? question.length : null,
      pageTitle,
      pageUrl,
    });

    if (typeof question !== 'string' || !question.trim()) {
      console.warn('[pageOracle/api/chat] invalid question', { requestId });
      return NextResponse.json({ error: 'Enter a question.' }, { status: 400 });
    }

    const selectedText = selection && typeof selection === 'string' ? selection.trim().slice(0, MAX_SELECTION_LENGTH) : '';
    const userQuestion = question.trim().slice(0, MAX_MESSAGE_LENGTH);
    const model = process.env.SARVAM_MODEL || DEFAULT_SARVAM_MODEL;
    
    // Build context-aware prompt
    let prompt = `You are pageOracle, a helpful reading companion that answers questions about web content.`;
    
    if (pageTitle || pageUrl) {
      prompt += `\n\nCurrent page context:`;
      if (pageTitle) prompt += `\nTitle: ${pageTitle}`;
      if (pageUrl) prompt += `\nURL: ${pageUrl}`;
    }
    
    if (selectedText) {
      prompt += `\n\nSelected text from the page:\n"${selectedText}"`;
    }
    
    prompt += `\n\nUser question: ${userQuestion}`;
    prompt += `\n\nProvide a helpful, concise answer. If you're using the selected text as context, reference it. If the user asks a general question unrelated to the selection, answer it helpfully anyway.`;

    console.log('[pageOracle/api/chat] calling Sarvam', {
      requestId,
      model,
      selectedTextLength: selectedText.length,
      questionLength: userQuestion.length,
    });

    const sarvamResponse = await fetch('https://api.sarvam.ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        max_sampling_length: 1024,
        temperature: 0.2,
        top_p: 0.95,
      }),
    });

    const responseText = await sarvamResponse.text();
    console.log('[pageOracle/api/chat] Sarvam response received', {
      requestId,
      status: sarvamResponse.status,
      ok: sarvamResponse.ok,
      responseLength: responseText.length,
      elapsedMs: Date.now() - startedAt,
    });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[pageOracle/api/chat] Sarvam returned non-JSON', {
        requestId,
        responsePreview: responseText.slice(0, 500),
        parseError: parseError.message,
      });
      throw new Error('Sarvam returned an invalid response.');
    }

    if (!sarvamResponse.ok) {
      console.error('[pageOracle/api/chat] Sarvam API error', {
        requestId,
        status: sarvamResponse.status,
        error: data?.error || data?.message,
      });
      throw new Error(data?.error?.message || data?.message || 'The Sarvam request failed.');
    }

    const answer = data?.generatedText?.trim();

    console.log('[pageOracle/api/chat] Sarvam response parsed', {
      requestId,
      answerLength: answer?.length || 0,
    });

    if (!answer) {
      console.error('[pageOracle/api/chat] Sarvam returned no answer', {
        requestId,
        responseKeys: Object.keys(data || {}),
        data,
      });
      throw new Error('Sarvam returned an empty response.');
    }

    console.log('[pageOracle/api/chat] request completed', {
      requestId,
      elapsedMs: Date.now() - startedAt,
    });

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('[pageOracle/api/chat] request failed', {
      requestId,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to ask AI right now.' },
      { status: 502 },
    );
  }
}
