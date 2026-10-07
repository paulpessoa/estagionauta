import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load both .env files (frontend for Google Maps key, api for Supabase keys)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Frontend .env
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Backend .env

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_BACKEND_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_FRONTEND_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_MAPS_API_KEY) {
  console.error("Faltam variáveis de ambiente! Verifique SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e VITE_GOOGLE_MAPS_API_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Types
interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
  rating?: number;
  user_ratings_total?: number;
  photos?: { photo_reference: string }[];
}

/**
 * Busca detalhes de um local na API do Google Places (Text Search)
 */
async function searchGooglePlaces(query: string): Promise<PlaceResult | null> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
  
  try {
    const response = await fetch(url, { headers: { 'Referer': 'http://localhost:8080' } });
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Retorna o melhor resultado (primeiro)
      return data.results[0] as PlaceResult;
    }
    return null;
  } catch (err) {
    console.error(`Erro ao buscar no Google Places: ${query}`, err);
    return null;
  }
}

/**
 * FUNÇÃO 1: Auditoria (Valida as agências que já estão no banco)
 */
async function runAudit() {
  console.log("=== INICIANDO AUDITORIA DE AGÊNCIAS ===");
  
  // Buscar agências que ainda não foram auditadas ou que estão pendentes
  const { data: agencies, error } = await supabase
    .from('agencies')
    .select('*')
    .or('status.eq.pending,verified_at.is.null');

  if (error) {
    console.error("Erro ao buscar agências no Supabase:", error);
    return;
  }

  console.log(`Encontradas ${agencies?.length || 0} agências para auditar.`);

  for (const agency of agencies || []) {
    console.log(`\nAuditando: ${agency.name} (${agency.city}/${agency.state})`);
    
    // Constrói uma query boa para o Google
    const query = `${agency.name} ${agency.city || ''} ${agency.state || ''} agência de estágio`;
    const place = await searchGooglePlaces(query);

    if (place) {
      console.log(`✅ Encontrado no Google: ${place.name} - Rating: ${place.rating}`);
      
      const updateData: any = {
        status: 'approved',
        verified_at: new Date().toISOString(),
        address: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating || null,
        total_reviews: place.user_ratings_total || 0,
      };

      // Se tiver foto, monta a URL da foto via Google API
      if (place.photos && place.photos.length > 0) {
        const photoRef = place.photos[0].photo_reference;
        updateData.logo_url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${GOOGLE_MAPS_FRONTEND_KEY}`;
      }

      const { error: updateErr } = await supabase
        .from('agencies')
        .update(updateData)
        .eq('id', agency.id);

      if (updateErr) console.error("Erro ao atualizar banco:", updateErr);
      else console.log("   -> Salvo no banco com sucesso.");
      
    } else {
      console.log(`❌ Não encontrado no Google Places.`);
      // Opcional: Você pode marcar como 'rejected' se preferir, ou apenas atualizar o verified_at para não tentar de novo
      await supabase
        .from('agencies')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', agency.id);
    }

    // Aguarda um pouco para não estourar rate limit da API do Google
    await new Promise(r => setTimeout(r, 1000));
  }
}

/**
 * FUNÇÃO 2: Prospecção (Busca Novas Agências como IEL, CIEE)
 */
async function runDiscovery() {
  console.log("\n=== INICIANDO PROSPECÇÃO DE NOVAS AGÊNCIAS ===");
  
  // Buscar um usuário válido para usar no campo created_by
  const { data: users } = await supabase.auth.admin.listUsers();
  const created_by = users?.users?.[0]?.id;

  if (!created_by) {
    console.error("ERRO: Nenhum usuário encontrado no banco para ser atribuído como criador das agências (created_by). Crie um usuário no sistema primeiro!");
    return;
  }
  
  // Foco total na região SUL
  const targets = [
    // Paraná
    { city: 'Curitiba', state: 'PR' }, { city: 'Londrina', state: 'PR' },
    { city: 'Maringá', state: 'PR' }, { city: 'Ponta Grossa', state: 'PR' },
    { city: 'Cascavel', state: 'PR' },
    // Santa Catarina
    { city: 'Florianópolis', state: 'SC' }, { city: 'Joinville', state: 'SC' },
    { city: 'Blumenau', state: 'SC' }, { city: 'São José', state: 'SC' },
    { city: 'Chapecó', state: 'SC' },
    // Rio Grande do Sul
    { city: 'Porto Alegre', state: 'RS' }, { city: 'Caxias do Sul', state: 'RS' },
    { city: 'Canoas', state: 'RS' }, { city: 'Pelotas', state: 'RS' },
    { city: 'Santa Maria', state: 'RS' }
  ];

  const searchTerms = ['IEL', 'CIEE', 'Nube', 'Agência de estágios', 'Central de estágios universidade', 'Núcleo de estágios universidade'];

  for (const target of targets) {
    for (const term of searchTerms) {
      const query = `${term} em ${target.city} ${target.state}`;
      console.log(`\nBuscando: "${query}"`);
      
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url, {
        headers: {
          'Referer': 'http://localhost:8080'
        }
      });
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        for (const place of data.results as PlaceResult[]) {
          // Filtro rigoroso: Só aceita lugares com mais de 4 avaliações para garantir que existem no mundo físico.
          if (!place.user_ratings_total || place.user_ratings_total < 5) {
            console.log(`❌ Ignorado (suspeito/sem avaliações): ${place.name}`);
            continue;
          }

          // Checa se já existe no banco (busca pelo nome ou pela lat/lng pra evitar duplicados)
          const { data: existing } = await supabase
            .from('agencies')
            .select('id')
            .ilike('name', `%${place.name}%`)
            .eq('state', target.state)
            .maybeSingle();

          if (!existing) {
            console.log(`✨ Nova agência encontrada: ${place.name}`);
            
            // Fazemos um scraping profundo via Place Details API para pegar site e telefone
            let website = null;
            let phone = null;
            if (place.place_id) {
              try {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number&key=${process.env.GOOGLE_MAPS_BACKEND_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY}`;
                const detailsRes = await fetch(detailsUrl, { headers: { 'Referer': 'http://localhost:8080' } });
                const detailsData = await detailsRes.json();
                if (detailsData.result) {
                  website = detailsData.result.website || null;
                  phone = detailsData.result.formatted_phone_number || null;
                }
              } catch (e) {
                console.error("Erro ao buscar detalhes da agência", e);
              }
            }

            // Extrair cidade e estado reais do endereço retornado pelo Google
            let realCity = target.city;
            let realState = target.state;
            if (place.formatted_address) {
              const match = place.formatted_address.match(/([^,]+)\s*-\s*([A-Z]{2}),\s*\d{5}-\d{3}/);
              if (match) {
                realCity = match[1].trim();
                realState = match[2].trim();
              }
            }
            
            if (realState !== target.state && !place.formatted_address?.includes(`- ${target.state}`) && !place.formatted_address?.includes(` ${target.state},`)) {
              console.log(`❌ Ignorado (Lixo geográfico - Fora do estado ${target.state}): ${place.name} em ${place.formatted_address}`);
              continue;
            }

            const insertData: any = {
              name: place.name,
              city: realCity,
              state: realState,
              status: 'approved',
              agency_type: null,
              address: place.formatted_address,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              website: website,
              phone: phone,
              rating: place.rating || null,
              total_reviews: place.user_ratings_total || 0,
              verified_at: new Date().toISOString(),
              created_by: created_by
            };

            if (place.photos && place.photos.length > 0) {
              const photoRef = place.photos[0].photo_reference;
              insertData.logo_url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${GOOGLE_MAPS_FRONTEND_KEY}`;
            }

            const { error: insertErr } = await supabase.from('agencies').insert(insertData);
            if (insertErr) console.error("   -> Erro ao salvar:", insertErr);
            else console.log("   -> Salvo no banco!");
          }
        }
      }
      
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// Execução
const mode = process.argv[2];

if (mode === 'audit') {
  runAudit();
} else if (mode === 'discover') {
  runDiscovery();
} else {
  console.log(`
Uso do script:
  npx tsx scripts/sync-agencies.ts audit     -> Valida agências atuais no banco
  npx tsx scripts/sync-agencies.ts discover  -> Busca novas agências nas principais cidades
`);
}
