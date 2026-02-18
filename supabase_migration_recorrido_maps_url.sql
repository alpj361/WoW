-- Add recorrido_maps_url column to procesiones
-- Manual Google Maps URL for curated routes (vs auto-generated from puntos_referencia)
ALTER TABLE procesiones
ADD COLUMN IF NOT EXISTS recorrido_maps_url TEXT;
