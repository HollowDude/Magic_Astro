import type { APIRoute } from 'astro';
import { Country } from 'country-state-city';

export const GET: APIRoute = async () => {
  const countries = Country.getAllCountries().map(c => ({
    code: c.isoCode,
    name: c.name,
  }));

  countries.sort((a, b) => a.name.localeCompare(b.name));

  return new Response(JSON.stringify(countries), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
