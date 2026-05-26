ALTER TABLE public.kanban_applications DROP CONSTRAINT IF EXISTS kanban_applications_status_check;

ALTER TABLE public.kanban_applications ADD CONSTRAINT kanban_applications_status_check 
  CHECK (status IN ('interested', 'applied', 'test', 'group_dynamics', 'interview', 'cultural_fit', 'resource', 'offer', 'hired', 'rejected'));
