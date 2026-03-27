// Cloudflare Worker — proxy para Anthropic API
// Deploy em: https://workers.cloudflare.com
// Adicione a variável de ambiente: API_KEY = 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

const ALLOWED_ORIGIN = "https://investimentos.rian1-meliodas.workers.dev";

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

async function handleRequest(request) {
  // Preflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Body inválido', { status: 400 });
  }

  // API_KEY é variável de ambiente configurada no Cloudflare Dashboard
  const apiKey = typeof API_KEY !== 'undefined' ? API_KEY : '';
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API_KEY não configurada' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'tools-2024-05-16',
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();

  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}
