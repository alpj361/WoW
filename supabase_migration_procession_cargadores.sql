-- Create the procession_cargadores table
CREATE TABLE IF NOT EXISTS public.procession_cargadores (
    id bigint generated always as identity primary key,
    user_id uuid references auth.users not null,
    procesion_id text not null, -- References id_unico from procesiones JSON
    numero_turno integer not null,
    created_at timestamptz default now(),
    UNIQUE(user_id, procesion_id)
);

-- Enable Row Level Security
ALTER TABLE public.procession_cargadores ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Allow users to insert their own records
DROP POLICY IF EXISTS "Users can insert their own turn" ON public.procession_cargadores;
CREATE POLICY "Users can insert their own turn" 
ON public.procession_cargadores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own records
DROP POLICY IF EXISTS "Users can view their own turns" ON public.procession_cargadores;
CREATE POLICY "Users can view their own turns" 
ON public.procession_cargadores 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own records
DROP POLICY IF EXISTS "Users can update their own turns" ON public.procession_cargadores;
CREATE POLICY "Users can update their own turns" 
ON public.procession_cargadores 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own records
DROP POLICY IF EXISTS "Users can delete their own turns" ON public.procession_cargadores;
CREATE POLICY "Users can delete their own turns" 
ON public.procession_cargadores 
FOR DELETE 
USING (auth.uid() = user_id);
