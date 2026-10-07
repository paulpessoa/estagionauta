// Sweep Google Places (New) for internship-related places in southern Brazil.
// Usage: node sweep.mjs <path-to-api/.env> <out.json>
import fs from 'fs';

const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/)
  .filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]));
const KEY = env.GOOGLE_MAPS_BACKEND_KEY;
const OUT = process.argv[3];

const CITIES = {
  AC: ['Rio Branco','Cruzeiro do Sul','Sena Madureira','Tarauacá','Feijó'],
  AM: ['Manaus','Parintins','Itacoatiara','Manacapuru','Coari','Tefé','Tabatinga'],
  AP: ['Macapá','Santana','Laranjal do Jari','Oiapoque'],
  PA: ['Belém','Ananindeua','Santarém','Marabá','Parauapebas','Castanhal','Abaetetuba','Cametá','Bragança','Altamira','Tucuruí','Redenção','Paragominas','Barcarena'],
  RO: ['Porto Velho','Ji-Paraná','Ariquemes','Vilhena','Cacoal','Rolim de Moura','Jaru'],
  RR: ['Boa Vista','Rorainópolis','Caracaraí'],
  TO: ['Palmas','Araguaína','Gurupi','Porto Nacional','Paraíso do Tocantins','Colinas do Tocantins'],
};
const TERMS = ['agência de estágio', 'CIEE', 'central de estágios universidade'];
const EXTRA = [];
for (const uf of Object.keys(CITIES)) for (const t of ['IEL Instituto Euvaldo Lodi','Nube Núcleo Brasileiro de Estágios','Super Estágios','agente de integração de estágio']) EXTRA.push([t, uf]);

const FIELDS = ['id','displayName','formattedAddress','addressComponents','location','nationalPhoneNumber','internationalPhoneNumber','websiteUri','rating','userRatingCount','businessStatus','googleMapsUri','types','primaryType'].map(f => 'places.' + f).join(',');

async function search(q) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': FIELDS, Referer: 'http://localhost:8080' },
      body: JSON.stringify({ textQuery: q, languageCode: 'pt-BR', regionCode: 'BR', pageSize: 20 }),
    });
    if (r.ok) return (await r.json()).places || [];
    console.error('ERR', q, r.status, (await r.text()).slice(0, 200));
    await new Promise(res => setTimeout(res, 2000));
  }
  return [];
}

const queries = [];
for (const [uf, cities] of Object.entries(CITIES)) for (const c of cities) for (const t of TERMS) queries.push([`${t} em ${c} - ${uf}`, uf, c]);
for (const [t, uf] of EXTRA) queries.push([`${t} ${uf}`, uf, null]);

const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { done: [], places: {} };
let n = 0;
for (const [q, uf, city] of queries) {
  if (out.done.includes(q)) continue;
  const res = await search(q);
  for (const p of res) {
    const prev = out.places[p.id];
    if (prev) { if (!prev.queries.includes(q)) prev.queries.push(q); continue; }
    out.places[p.id] = { ...p, queries: [q], targetUf: uf, targetCity: city };
  }
  out.done.push(q);
  if (++n % 20 === 0) { fs.writeFileSync(OUT, JSON.stringify(out)); console.log(n, 'queries,', Object.keys(out.places).length, 'places'); }
  await new Promise(res => setTimeout(res, 150));
}
fs.writeFileSync(OUT, JSON.stringify(out));
console.log('DONE', out.done.length, 'queries,', Object.keys(out.places).length, 'places');
