// Classify swept places into approve / pending / discard.
// Usage: STATES=GO,MT,MS node classify.mjs <raw.json> <candidates.json>
import fs from 'fs';

const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const REGION = new Set((process.env.STATES || '').split(','));

const comp = (p, t) => (p.addressComponents || []).find(c => (c.types || []).includes(t));
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const BRANDS = [
  [/ciee|integracao empresa.?escola/, 'CIEE', 'instituto'],
  [/euvaldo lodi|\biel\b/, 'IEL', 'instituto'],
  [/\bnube\b|nucleo brasileiro de estagio/, 'Nube', 'agencia_privada'],
  [/super estagio/, 'Super Estágios', 'agencia_privada'],
  [/isbet/, 'ISBET', 'instituto'],
  [/^gerar\b|gerar -/, 'GERAR', 'instituto'],
  [/estagios? cin\b|centro de integracao de estudantes/, 'Estágios CIN', 'agencia_privada'],
  [/ceinee|centro de integracao nacional de estagio/, 'CEINEE', 'agencia_privada'],
  [/\banie\b|agente nacional de integracao/, 'ANIE', 'agencia_privada'],
  [/\babre\b.*(estagio|emprego)|agencia brasileira de emprego e estagio/, 'ABRE', 'agencia_privada'],
  [/agiel/, 'Agiel', 'agencia_privada'],
  [/\bmudes\b/, 'Fundação Mudes', 'fundacao'],
  [/central de estagio/, 'Central de Estágio', null],
];
const PUBLIC = /agencia do trabalhador|\bsine\b|fgtas|casa do trabalhador|secretaria (municipal )?(de |do )?(trabalho|emprego)|estagio na prefeitura|centro publico de emprego|balcao de emprego|agencia (municipal )?de emprego.*prefeitura|ministerio do trabalho|atendimento aos? trabalhador/;
const UNI_SECTOR = /estagio|carreira|empregabilidade|prograd|pro.?reitoria de graduacao|central de empregos|coordenacao de estagios|nucleo de estagio|setor de estagio|integracao academica|egresso/;
const UNI = /universi|faculdade|centro universitario|instituto federal|\bif(ac|am|ap|pa|ro|rr|to|go|mt|ms|ba|ce|ma|pb|pe|pi|rn|se|al|mg|rj|sp|es|goiano|baiano|sertao)\b|utfpr|ufg\b|ufmt|ufms|ufam|ufpa|ufac|unir\b|ufrr|uft\b|ufba|ufc\b|ufpe|ufrn|ufpb|ufal|ufs\b|ufma|ufpi|ufmg|ufrj|ufes|usp\b|unicamp|unesp|uerj|uff\b|ufscar|unifesp|uema|uece|uepa|ueg\b|uems|unemat|uneb|uepb|uern|upe\b|uespi|unitins|unifap|uea\b|uerr|unir|puc|senac|senai|catolica|católica|unip\b|anhanguera|estacio|unopar|cruzeiro do sul|uninassau|unifacs|unifor|uninorte|unama|fiocruz|fgv/;
const UNI_NOISE = /hospital|moradia|alojamento|bloco|\bpolo\b|\bead\b|pos.?gradua|programa de pos|laborat|biblioteca|restaurante|ru\b|casa do estudante|estacionamento|ginasio|museu|teatro|clinica|creche|escola de aplicacao|colegio|nead|nutead|inova|incubadora|diretorio|centro academico|atletica|predio|campus [^a-z]*$/;
const RH_NOISE = /domestic|baba|japao|terceiriza|limpeza|zeladoria|portaria|temporari|mao de obra/;

function classify(p) {
  const name = p.displayName?.text || '';
  const n = norm(name);
  const types = p.types || [];
  const status = p.businessStatus || 'UNKNOWN';
  const reviews = p.userRatingCount || 0;
  const closed = status !== 'OPERATIONAL';

  if (/instituto estadual do livro|shopping|la nube clinica|teatro|bosque|parque/.test(n) || types.includes('shopping_mall')) return { tier: 'discard', reason: 'não relacionado a estágio' };

  for (const [re, brand, type] of BRANDS) {
    if (re.test(n)) {
      if (brand === 'Central de Estágio' && !closed && reviews < 5) return { tier: 'pending', reason: `central de estágios com só ${reviews} avaliações no Google`, agency_type: /sms|prefeitura|secretaria/.test(n) ? 'orgao_publico' : 'outro' };
      if (closed) return { tier: 'discard', reason: `${brand}: Google marca como ${status}`, brand };
      const t = type ?? (PUBLIC.test(n) || types.includes('government_office') ? 'orgao_publico' : UNI.test(n) ? 'faculdade' : 'outro');
      return { tier: 'approve', reason: `agente de integração conhecido (${brand})`, brand, agency_type: t };
    }
  }
  if (PUBLIC.test(n)) {
    if (closed) return { tier: 'discard', reason: `órgão público fechado (${status})` };
    return { tier: 'pending', reason: 'órgão público de emprego/trabalho — confirmar se intermedeia estágio', agency_type: 'orgao_publico' };
  }
  const isUni = UNI.test(n) || types.includes('university') || types.includes('academic_department');
  if (/estagi/.test(n) && !isUni) {
    if (closed) return { tier: 'discard', reason: `agência de estágio fechada (${status})` };
    if (reviews >= 5) return { tier: 'approve', reason: `agência com "estágio" no nome, ${reviews} avaliações no Google`, agency_type: 'agencia_privada' };
    return { tier: 'pending', reason: `agência com "estágio" no nome, só ${reviews} avaliações no Google`, agency_type: 'agencia_privada' };
  }
  if (isUni) {
    if (closed) return { tier: 'discard', reason: `instituição fechada (${status})` };
    if (UNI_SECTOR.test(n)) return { tier: 'pending', reason: 'setor universitário de estágio/carreira — confirmar atendimento ao público', agency_type: 'faculdade' };
    if (UNI_NOISE.test(n)) return { tier: 'discard', reason: 'unidade universitária não relacionada (hospital, moradia, polo EAD etc.)' };
    if (reviews >= 250) return { tier: 'pending', reason: 'instituição de ensino relevante — verificar se tem central de estágios aberta ao público', agency_type: 'faculdade' };
    return { tier: 'discard', reason: 'campus/instituição menor sem indício de setor de estágio' };
  }
  if (RH_NOISE.test(n)) return { tier: 'discard', reason: 'agência de domésticas/terceirização/temporários' };
  return { tier: 'discard', reason: 'agência de RH/empregos genérica sem indício de estágio' };
}

const mapped = new Set(Object.values(raw.existingMap || {}));
const out = [];
for (const p of Object.values(raw.places)) {
  const uf = comp(p, 'administrative_area_level_1')?.shortText;
  if (!REGION.has(uf) && !mapped.has(p.id)) continue;
  const city = comp(p, 'administrative_area_level_2')?.longText || p.targetCity;
  const cep = comp(p, 'postal_code')?.longText || null;
  const c = classify(p);
  out.push({
    place_id: p.id, name: p.displayName?.text, state: uf, city, cep,
    address: p.formattedAddress, latitude: p.location?.latitude, longitude: p.location?.longitude,
    phone: p.nationalPhoneNumber || null, website: p.websiteUri || null,
    google_rating: p.rating ?? null, google_reviews: p.userRatingCount || 0,
    business_status: p.businessStatus || null, maps_url: p.googleMapsUri?.split('&g_mp')[0] || null,
    primary_type: p.primaryType || null, ...c,
  });
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
const cnt = {}; for (const o of out) { const k = `${o.state} ${o.tier}`; cnt[k] = (cnt[k] || 0) + 1; }
console.log(out.length, cnt);
