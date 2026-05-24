import type { APIRoute } from 'astro';
import { State } from 'country-state-city';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const countryCode = url.searchParams.get('country')?.toUpperCase();

  if (!countryCode) {
    return new Response(JSON.stringify({ error: 'Missing country parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const states = State.getStatesOfCountry(countryCode);

  const result = (states ?? []).map(s => ({
    code: s.isoCode,
    name: s.name,
  }));

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
