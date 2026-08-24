// This function runs on Netlify's servers, never in the user's browser.
// Your Anthropic API key lives here as an environment variable — it is
// never sent to, or visible from, anyone's device.

const { getStore } = require('@netlify/blobs');

const DAILY_LIMIT = 50; // questions per visitor per day — change this number to adjust the limit

// Works out which visitor is asking, using their IP address as a rough
// fingerprint. Not perfect (people on the same office WiFi share one count),
// but it's a solid, privacy-friendly first line of defence with no login needed.
function getVisitorId(event) {
  return event.headers['x-nf-client-connection-ip']
    || event.headers['client-ip']
    || 'unknown-visitor';
}

// Tracks how many questions this visitor has asked today, using Netlify's
// built-in key-value storage (Blobs) — no extra sign-up or service needed.
async function checkDailyLimit(visitorId) {
  const store = getStore('kip-usage');
  const today = new Date().toISOString().slice(0, 10); // e.g. 2026-08-21, resets at midnight UTC
  const key = `${today}:${visitorId}`;

  const existing = await store.get(key, { type: 'json' });
  const count = existing?.count || 0;

  if (count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  await store.setJSON(key, { count: count + 1 });
  return { allowed: true, remaining: DAILY_LIMIT - (count + 1) };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server is missing ANTHROPIC_API_KEY. Set it in Netlify site settings.' })
    };
  }

  // ---- Daily limit check, before we spend anything on Claude ----
  const visitorId = getVisitorId(event);
  let usage;
  try {
    usage = await checkDailyLimit(visitorId);
  } catch {
    usage = { allowed: true, remaining: null }; // if the usage store hiccups, fail open rather than blocking real students
  }
  if (!usage.allowed) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: `You've reached today's limit of ${DAILY_LIMIT} questions. Come back tomorrow for more!` })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { system, messages } = payload;

  // ---- Basic abuse / cost protection ----
  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing messages' }) };
  }
  if (messages.length > 20) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Conversation too long' }) };
  }
  const tooLong = messages.some(m => typeof m.content === 'string' && m.content.length > 4000);
  if (tooLong) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Message too long' }) };
  }
  if (typeof system === 'string' && system.length > 6000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'System prompt too long' }) };
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1000,
        system,
        messages
      })
    });

    const data = await res.json();
    if (usage.remaining !== null) data.remaining = usage.remaining;

    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Could not reach Claude — try again shortly.' }) };
  }
};
