import { NextResponse } from 'next/server';

const MAX_SELECTION_LENGTH = 12_000;
const MAX_MESSAGE_LENGTH = 2_000;

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured on the server.' }, { status: 500 });
  }

  try {
    const { selection, question, pageTitle, pageUrl } = await request.json();
    if (typeof selection !== 'string' || !selection.trim()) {
      return NextResponse.json({ error: 'Select some page text first.' }, { status: 400 });
    }
    if (typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Enter a question.' }, { status: 400 });
    }

    const selectedText = selection.trim().slice(0, MAX_SELECTION_LENGTH);
    const userQuestion = question.trim().slice(0, MAX_MESSAGE_LENGTH);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are pageOracle, a concise and helpful reading companion. Answer using the selected page text as context. If the answer is not supported by the selection, say so.' },
          { role: 'user', content: `Page: ${pageTitle || 'Untitled'}\nURL: ${pageUrl || ''}\n\nSelected text:\n${selectedText}\n\nQuestion:\n${userQuestion}` },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'The AI request failed.');
    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('The AI returned an empty response.');
    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to ask AI right now.' }, { status: 502 });
  }
}
