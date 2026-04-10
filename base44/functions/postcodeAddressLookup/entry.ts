import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { postcode } = await req.json();
    if (!postcode) return Response.json({ error: 'Postcode is required' }, { status: 400 });

    const clean = postcode.replace(/\s+/g, '').toUpperCase();

    // Validate postcode via postcodes.io
    const validateRes = await fetch(`https://api.postcodes.io/postcodes/${clean}`);
    const validateData = await validateRes.json();

    if (!validateRes.ok || validateData.status !== 200) {
      return Response.json({ error: 'Invalid postcode. Please check and try again.' }, { status: 400 });
    }

    const { latitude, longitude, admin_district, parish, region } = validateData.result;

    // Search for addresses near this postcode using Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(clean)}&country=United+Kingdom&format=json&addressdetails=1&limit=30`;
    const nominatimRes = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'CoTask-App/1.0' }
    });
    const nominatimData = await nominatimRes.json();

    // Also do a reverse geocode sweep around the postcode center to find more addresses
    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=17`;
    const reverseRes = await fetch(reverseUrl, {
      headers: { 'User-Agent': 'CoTask-App/1.0' }
    });
    const reverseData = await reverseRes.json();

    // Build address list from nominatim results
    const seen = new Set();
    const addresses = [];

    // Add reverse geocode result first (closest match)
    if (reverseData && reverseData.display_name) {
      const addr = buildAddress(reverseData.address, clean);
      if (addr && !seen.has(addr)) {
        seen.add(addr);
        addresses.push(addr);
      }
    }

    // Add nominatim search results
    for (const item of nominatimData) {
      const addr = buildAddress(item.address, clean);
      if (addr && !seen.has(addr)) {
        seen.add(addr);
        addresses.push(addr);
      }
    }

    // If very few results, add generic area-based entries
    if (addresses.length < 3) {
      const area = parish || admin_district || region || '';
      const generic = `${clean}, ${area}`.trim().replace(/,\s*,/, ',');
      if (generic && !seen.has(generic)) addresses.push(generic);
    }

    return Response.json({
      postcode: `${clean.slice(0, -3)} ${clean.slice(-3)}`,
      town: admin_district || region || '',
      addresses: addresses.slice(0, 20),
    });
  } catch (error) {
    console.error('Postcode lookup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildAddress(address, postcode) {
  if (!address) return null;
  const parts = [
    address.house_number,
    address.road || address.street,
    address.suburb || address.neighbourhood || address.hamlet,
    address.town || address.city || address.village,
    address.county,
  ].filter(Boolean);
  if (parts.length < 2) return null;
  return `${parts.join(', ')}, ${postcode.slice(0, -3)} ${postcode.slice(-3)}`;
}