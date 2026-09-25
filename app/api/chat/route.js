import { NextResponse } from 'next/server';

const MAX_SELECTION_LENGTH = 12_000;
const MAX_MESSAGE_LENGTH = 2_000;
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

export async function POST(request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured on the server.' },
      { status: 500 },
    );
  }

  try {
    const { selection, question, pageTitle, pageUrl } = await request.json();
    console.log('got request',selection, question, pageTitle, pageUrl);

    if (typeof selection !== 'string' || !selection.trim()) {
      return NextResponse.json({ error: 'Select some page text first.' }, { status: 400 });
    }

    if (typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Enter a question.' }, { status: 400 });
    }

    const selectedText = selection.trim().slice(0, MAX_SELECTION_LENGTH);
    const userQuestion = question.trim().slice(0, MAX_MESSAGE_LENGTH);
    const prompt = `Page: ${pageTitle || 'Untitled'}
URL: ${pageUrl || ''}

Selected text:
${selectedText}

Question:
${userQuestion}`;
    const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;

    const response = await fetch(endpoint, {
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
    const data = await response.json();
       console.log('response from gemini',data);
 
    if (!response.ok) {
      throw new Error(data?.error?.message || 'The Gemini request failed.');
    }

    const answer = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    if (!answer) {
      throw new Error('Gemini returned an empty response.');
    }

    return NextResponse.json({ answer });
  } catch (error) {
       console.log('error from gemini',error);
    return NextResponse.json(
      { error: error.message || 'Unable to ask AI right now.' },
      { status: 502 },
    );
  }
}
