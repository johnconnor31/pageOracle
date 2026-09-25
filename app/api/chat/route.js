import { NextResponse } from 'next/server';

const MAX_SELECTION_LENGTH = 12_000;
const MAX_MESSAGE_LENGTH = 2_000;
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

export async function POST(request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  console.log('[pageOracle/api/chat] request started', { requestId });

  if (!process.env.GEMINI_API_KEY) {
    console.error('[pageOracle/api/chat] missing GEMINI_API_KEY', { requestId });
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured on the server.' },
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

    if (typeof selection !== 'string' || !selection.trim()) {
      console.warn('[pageOracle/api/chat] invalid selection', { requestId });
      return NextResponse.json({ error: 'Select some page text first.' }, { status: 400 });
    }

    if (typeof question !== 'string' || !question.trim()) {
      console.warn('[pageOracle/api/chat] invalid question', { requestId });
      return NextResponse.json({ error: 'Enter a question.' }, { status: 400 });
    }

    const selectedText = selection.trim().slice(0, MAX_SELECTION_LENGTH);
    const userQuestion = question.trim().slice(0, MAX_MESSAGE_LENGTH);
    const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const prompt = `Page: ${pageTitle || 'Untitled'}
URL: ${pageUrl || ''}

Selected text:
${selectedText}

Question:
${userQuestion}`;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;

    console.log('[pageOracle/api/chat] calling Gemini', {
      requestId,
      model,
      selectedTextLength: selectedText.length,
      questionLength: userQuestion.length,
    });

    const geminiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: 'You are pageOracle, a concise and helpful reading companion. Answer using the selected page text as context. If the answer is not supported by the selection, say so clearly instead of inventing facts.',
          }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    });

    const responseText = await geminiResponse.text();
    console.log('[pageOracle/api/chat] Gemini response received', {
      requestId,
      status: geminiResponse.status,
      ok: geminiResponse.ok,
      responseLength: responseText.length,
      elapsedMs: Date.now() - startedAt,
    });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[pageOracle/api/chat] Gemini returned non-JSON', {
        requestId,
        responsePreview: responseText.slice(0, 500),
        parseError: parseError.message,
      });
      throw new Error('Gemini returned an invalid response.');
    }

    if (!geminiResponse.ok) {
      console.error('[pageOracle/api/chat] Gemini API error', {
        requestId,
        status: geminiResponse.status,
        error: data?.error,
      });
      throw new Error(data?.error?.message || 'The Gemini request failed.');
    }

    const candidate = data?.candidates?.[0];
    const answer = candidate?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    console.log('[pageOracle/api/chat] Gemini candidate parsed', {
      requestId,
      candidateCount: data?.candidates?.length || 0,
      finishReason: candidate?.finishReason,
      answerLength: answer?.length || 0,
      promptFeedback: data?.promptFeedback,
    });

    if (!answer) {
      console.error('[pageOracle/api/chat] Gemini returned no answer', {
        requestId,
        responseKeys: Object.keys(data || {}),
        candidate,
      });
      throw new Error('Gemini returned an empty response.');
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
