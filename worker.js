// Cloudflare Worker — proxy para Anthropic API
// Certifique-se de que a API_KEY está nas "Settings > Variables" do painel!

// CORREÇÃO: Adicionado aspas e removido a barra final para bater com a origem do navegador
const ALLOWED_ORIGIN = "https://investimentos.rian1-meliodas.workers.dev";

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, anthropic-beta',
    'Access-Control-Max-Age': '86400',
  };
}

async function handleRequest(request) {
  // 1. Trata o Preflight (CORS) - Essencial para evitar o erro 405/bloqueio
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // 2. Bloqueia qualquer coisa que não seja POST (vinda do seu formulário/app)
  if (request.method !== 'POST') {
    return new Response('Método não permitido. Use POST.', { 
      status: 405, 
      headers: corsHeaders() 
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Body inválido', { status: 400, headers: corsHeaders() });
  }

  // Busca a chave configurada no dashboard da Cloudflare
  const apiKey = typeof API_KEY !== 'undefined' ? API_KEY : '';
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API_KEY não configurada no Cloudflare' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  // Faz a chamada real para a Anthropic
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
