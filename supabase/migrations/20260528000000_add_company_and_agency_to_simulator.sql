-- Migration: Add company and agency columns to interview_simulations
-- Created at: 2026-05-28 00:00:00

ALTER TABLE public.interview_simulations 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;
