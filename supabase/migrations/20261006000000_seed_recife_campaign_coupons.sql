-- Campaign coupons for the Recife metropolitan region launch (one per channel).
-- Share as https://estagionauta.com.br/?cupom=<CODE>&utm_source=<canal>
-- Adjust credits / max_uses / expires_at before pushing if needed.
INSERT INTO public.coupons (code, credits, max_uses, expires_at)
VALUES
  ('UFPE15',     15, 200, '2026-12-31 23:59:59-03'),
  ('UFRPE15',    15, 200, '2026-12-31 23:59:59-03'),
  ('UPE15',      15, 200, '2026-12-31 23:59:59-03'),
  ('UNICAP15',   15, 200, '2026-12-31 23:59:59-03'),
  ('IFPE15',     15, 200, '2026-12-31 23:59:59-03'),
  ('CESAR15',    15, 200, '2026-12-31 23:59:59-03'),
  ('NASSAU15',   15, 200, '2026-12-31 23:59:59-03'),
  ('PORTO15',    15, 200, '2026-12-31 23:59:59-03'),
  ('OFICINA15',  15, 300, '2026-12-31 23:59:59-03'),
  ('VAGASPE15',  15, 300, '2026-12-31 23:59:59-03'),
  ('INSTA15',    15, 300, '2026-12-31 23:59:59-03'),
  ('AGENCIA15',  15, 200, '2026-12-31 23:59:59-03')
ON CONFLICT (code) DO NOTHING;
