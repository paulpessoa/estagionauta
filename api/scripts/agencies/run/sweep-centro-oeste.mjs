// Sweep Google Places (New) for internship-related places in southern Brazil.
// Usage: node sweep.mjs <path-to-api/.env> <out.json>
import fs from 'fs';

const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/)
  .filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]));
const KEY = env.GOOGLE_MAPS_BACKEND_KEY;
const OUT = process.argv[3];

const CITIES = {
  GO: ['Goiânia','Anápolis','Aparecida de Goiânia','Rio Verde','Luziânia','Águas Lindas de Goiás','Formosa','Senador Canedo','Trindade','Morrinhos','Inhumas','Mineiros','Jataí','Santo Antônio do Descoberto','Novo Gama','Itumbiara','Pirenópolis','Araçu','Catalão','Firminópolis','Planaltina','Ipameri','Caçu','Cristalina','Niquelândia','Itauçu','Almeida','Santa Helena de Goiás','Acreúna','Ceres','Itapaci'],
  MT: ['Cuiabá','Várzea Grande','Rondonópolis','Sinop','Tangará da Serra','Lucas do Rio Verde','Cáceres','Sorriso','Nova Mutum','Campo Verde','Santo Antônio do Leverger','Barra do Garças','Poconé','Primavera do Leste','Jaciara','Chapada dos Guimarães','Araguaína','Colider','Alto Araguaia','Juína','Araguanã','Diamantino','Pontes e Lacerda','General Carneiro','Mirassol de Oeste'],
  MS: ['Campo Grande','Dourados','Três Lagoas','Maracaju','Ponta Porã','Corumbá','Naviraí','Aquidauana','Nova Andradina','Paranaíba','Cassilândia','Aparecida do Taboado','Batayporã','Vicentina','Inocência','Ribas do Rio Pardo','Itaporã','Rancho Alegre','São Gabriel do Oeste','Figueirão','Chapadão do Sul','Glória de Dourados'],
};
const TERMS = ['agência de estágio', 'CIEE', 'central de estágios universidade'];
const EXTRA = [
  ['IEL Instituto Euvaldo Lodi', 'GO'], ['IEL Instituto Euvaldo Lodi', 'MT'], ['IEL Instituto Euvaldo Lodi', 'MS'],
  ['Nube Núcleo Brasileiro de Estágios', 'GO'], ['Nube Núcleo Brasileiro de Estágios', 'MT'], ['Nube Núcleo Brasileiro de Estágios', 'MS'],
  ['Super Estágios', 'GO'], ['Super Estágios', 'MT'], ['Super Estágios', 'MS'],
  ['Estágios CIN', 'GO'], ['Estágios CIN', 'MT'], ['Global Estágios', 'GO'], ['CEDEP estágios', 'GO'], ['Pró Estágios Brasil', 'GO'],
  ['Agiel estágios', 'GO'], ['Agiel estágios', 'MT'], ['Agiel estágios', 'MS'], ['ABRE estágios', 'GO'], ['ABRE estágios', 'MT'], ['ABRE estágios', 'MS'],
  ['Estágio Centro-Oeste', 'GO'], ['Integrar GO estágios', 'GO'], ['Futura Estágios', 'MT'], ['Seibras estágios', 'MS'], ['Estagiar integradora', 'GO'],
  ['agente de integração de estágio', 'GO'], ['agente de integração de estágio', 'MT'], ['agente de integração de estágio', 'MS'],
];

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
for (const [t, uf] of EXTRA) queries.push([`${t} ${uf === 'PR' ? 'Paraná' : uf === 'SC' ? 'Santa Catarina' : 'Rio Grande do Sul'}`, uf, null]);

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
