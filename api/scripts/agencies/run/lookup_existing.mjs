// For existing rows not within 60m of any swept place, look them up individually and merge into raw.json.
// Usage: node lookup_existing.mjs <api/.env> <dir>
import fs from 'fs';
const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(l => l.includes('='))
  .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]));
const D = process.argv[3];
const raw = JSON.parse(fs.readFileSync(`${D}/raw.json`, 'utf8'));
const existing = JSON.parse(fs.readFileSync(`${D}/backup.json`, 'utf8'));
const FIELDS = ['id','displayName','formattedAddress','addressComponents','location','nationalPhoneNumber','websiteUri','rating','userRatingCount','businessStatus','googleMapsUri','types','primaryType'].map(f => 'places.' + f).join(',');

function distM(a, b) {
  const R = 6371000, toR = x => x * Math.PI / 180;
  const dLat = toR(b.latitude - a.latitude), dLng = toR(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.latitude)) * Math.cos(toR(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const places = Object.values(raw.places).filter(p => p.location);
const map = {};
let n = 0;
for (const row of existing) {
  const near = row.latitude != null && places.some(p => distM(row, p.location) < 60);
  if (near) continue;
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_MAPS_BACKEND_KEY, 'X-Goog-FieldMask': FIELDS, Referer: 'http://localhost:8080' },
    body: JSON.stringify({ textQuery: `${row.name} ${row.address || row.city + ' ' + row.state}`, languageCode: 'pt-BR', regionCode: 'BR', pageSize: 1 }),
  });
  const p = r.ok ? ((await r.json()).places || [])[0] : null;
  n++;
  if (!p) { console.log('not found:', row.name); continue; }
  map[row.id] = p.id;
  if (!raw.places[p.id]) raw.places[p.id] = { ...p, queries: ['lookup-existing'], targetUf: row.state, targetCity: row.city };
}
raw.existingMap = map;
fs.writeFileSync(`${D}/raw.json`, JSON.stringify(raw));
console.log('looked up', n, 'mapped', Object.keys(map).length);
