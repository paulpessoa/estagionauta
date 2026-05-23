-- Migration: Fix update_agency_rating trigger to only count approved reviews
-- Created at: 2026-05-23

CREATE OR REPLACE FUNCTION public.update_agency_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.agencies 
  SET 
    rating = COALESCE((
      SELECT AVG(rating)::DECIMAL(3,2) 
      FROM public.agency_reviews 
      WHERE agency_id = COALESCE(NEW.agency_id, OLD.agency_id) AND status = 'approved'
    ), 0),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.agency_reviews 
      WHERE agency_id = COALESCE(NEW.agency_id, OLD.agency_id) AND status = 'approved'
    )
  WHERE id = COALESCE(NEW.agency_id, OLD.agency_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
