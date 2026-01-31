-- Migration: Add WhatsApp Flyers System
-- Date: 2026-01-30
-- Description: Adds table to store WhatsApp flyers for processing with flyer analyzer

-- 1. Create whatsapp_flyers table
CREATE TABLE IF NOT EXISTS whatsapp_flyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Metadata del flyer
  sender_phone VARCHAR(20),                    -- Número de teléfono del remitente (opcional)
  sender_name TEXT,                            -- Nombre del contacto/remitente
  
  -- Almacenamiento de imagen
  image_url TEXT NOT NULL,                     -- URL de la imagen en Supabase Storage
  storage_path TEXT NOT NULL,                  -- Path en el bucket (whatsapp-flyers/...)
  thumbnail_url TEXT,                          -- URL del thumbnail (opcional)
  
  -- Estado de procesamiento
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',        -- Pendiente de procesar
    'processing',     -- En proceso por el analyzer
    'processed',      -- Procesado exitosamente
    'failed',         -- Falló el procesamiento
    'invalid',        -- No es un flyer válido
    'duplicate'       -- Detectado como duplicado
  )),
  
  -- Datos extraídos por el analyzer (JSON)
  analysis_result JSONB,                       -- Resultado completo del análisis
  confidence_score DECIMAL(3,2),               -- Score de confianza (0.00-1.00)
  
  -- Información del evento detectado
  event_name TEXT,                             -- Nombre del evento extraído
  event_date DATE,                             -- Fecha del evento
  event_time TIME,                             -- Hora del evento
  event_location TEXT,                         -- Ubicación/venue
  event_description TEXT,                      -- Descripción extraída
  
  -- Relación con evento creado
  created_event_id UUID REFERENCES events(id) ON DELETE SET NULL,  -- Si se creó un evento
  
  -- Usuario que subió el flyer (si aplica)
  uploaded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata adicional
  whatsapp_message_id TEXT,                    -- ID del mensaje de WhatsApp (si disponible)
  received_at TIMESTAMPTZ,                     -- Cuándo se recibió el mensaje
  file_size_bytes INTEGER,                     -- Tamaño del archivo
  mime_type VARCHAR(50) DEFAULT 'image/jpeg',  -- Tipo de archivo
  
  -- Control de versiones y timestamps
  processing_attempts INTEGER DEFAULT 0,       -- Número de intentos de procesamiento
  last_processing_error TEXT,                  -- Último error al procesar
  processed_at TIMESTAMPTZ,                    -- Cuándo se procesó
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_flyers_status ON whatsapp_flyers(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_flyers_created_at ON whatsapp_flyers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_flyers_event_date ON whatsapp_flyers(event_date) WHERE event_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_flyers_created_event ON whatsapp_flyers(created_event_id) WHERE created_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_flyers_uploaded_by ON whatsapp_flyers(uploaded_by_user_id) WHERE uploaded_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_flyers_sender_phone ON whatsapp_flyers(sender_phone) WHERE sender_phone IS NOT NULL;

-- 3. Create full-text search index on extracted text
CREATE INDEX IF NOT EXISTS idx_whatsapp_flyers_event_name_search 
  ON whatsapp_flyers USING gin(to_tsvector('spanish', COALESCE(event_name, '')));

-- 4. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_flyers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_whatsapp_flyers_updated_at ON whatsapp_flyers;
CREATE TRIGGER trigger_update_whatsapp_flyers_updated_at
  BEFORE UPDATE ON whatsapp_flyers
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_flyers_updated_at();

-- 6. Enable Row Level Security
ALTER TABLE whatsapp_flyers ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Public can view processed flyers (eventos públicos)
CREATE POLICY "Anyone can view processed flyers"
  ON whatsapp_flyers
  FOR SELECT
  USING (status = 'processed');

-- Authenticated users can insert flyers
CREATE POLICY "Authenticated users can upload flyers"
  ON whatsapp_flyers
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can view their own uploaded flyers
CREATE POLICY "Users can view own uploaded flyers"
  ON whatsapp_flyers
  FOR SELECT
  USING (uploaded_by_user_id = auth.uid());

-- Admin users can view all flyers (crear rol admin si no existe)
CREATE POLICY "Admin users can view all flyers"
  ON whatsapp_flyers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admin users can update any flyer
CREATE POLICY "Admin users can update flyers"
  ON whatsapp_flyers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Service role (backend) can do everything
-- (Se maneja a nivel de cliente con service_role key)

-- 8. Create storage bucket for flyer images (ejecutar desde Supabase Dashboard o via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('whatsapp-flyers', 'whatsapp-flyers', true)
-- ON CONFLICT (id) DO NOTHING;

-- 9. Add comments for documentation
COMMENT ON TABLE whatsapp_flyers IS 'Stores WhatsApp flyer images for automated event extraction';
COMMENT ON COLUMN whatsapp_flyers.status IS 'Processing status: pending, processing, processed, failed, invalid, duplicate';
COMMENT ON COLUMN whatsapp_flyers.analysis_result IS 'Full JSON result from flyer analyzer';
COMMENT ON COLUMN whatsapp_flyers.confidence_score IS 'AI confidence score for extracted data (0.00-1.00)';
COMMENT ON COLUMN whatsapp_flyers.created_event_id IS 'Reference to auto-created event if analysis was successful';

-- 10. Create view for pending flyers (to process)
CREATE OR REPLACE VIEW pending_flyers AS
SELECT 
  id,
  image_url,
  sender_name,
  sender_phone,
  received_at,
  processing_attempts,
  created_at
FROM whatsapp_flyers
WHERE status = 'pending'
  AND processing_attempts < 3  -- Max 3 attempts
ORDER BY created_at ASC;

COMMENT ON VIEW pending_flyers IS 'Flyers pending processing (max 3 attempts)';

-- 11. Create function to mark flyer as processed and create event
CREATE OR REPLACE FUNCTION process_flyer_to_event(
  p_flyer_id UUID,
  p_analysis_result JSONB,
  p_confidence_score DECIMAL(3,2),
  p_event_data JSONB  -- {name, description, date, time, location, category, etc.}
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_user_id UUID;
BEGIN
  -- Get uploader user_id or use a default system user
  SELECT uploaded_by_user_id INTO v_user_id
  FROM whatsapp_flyers
  WHERE id = p_flyer_id;
  
  -- If no user, you might want to set a default "system" user
  -- or handle it differently based on your requirements
  
  -- Create the event (assuming events table structure)
  INSERT INTO events (
    user_id,
    title,
    description,
    date,
    time,
    location,
    category,
    image_url,
    source_type,
    created_at
  )
  VALUES (
    COALESCE(v_user_id, (SELECT id FROM auth.users LIMIT 1)), -- Fallback to any user if null
    (p_event_data->>'name')::TEXT,
    (p_event_data->>'description')::TEXT,
    (p_event_data->>'date')::DATE,
    (p_event_data->>'time')::TIME,
    (p_event_data->>'location')::TEXT,
    COALESCE((p_event_data->>'category')::TEXT, 'General'),
    (SELECT image_url FROM whatsapp_flyers WHERE id = p_flyer_id),
    'whatsapp',
    NOW()
  )
  RETURNING id INTO v_event_id;
  
  -- Update the flyer record
  UPDATE whatsapp_flyers
  SET 
    status = 'processed',
    analysis_result = p_analysis_result,
    confidence_score = p_confidence_score,
    event_name = (p_event_data->>'name')::TEXT,
    event_date = (p_event_data->>'date')::DATE,
    event_time = (p_event_data->>'time')::TIME,
    event_location = (p_event_data->>'location')::TEXT,
    event_description = (p_event_data->>'description')::TEXT,
    created_event_id = v_event_id,
    processed_at = NOW()
  WHERE id = p_flyer_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_flyer_to_event IS 'Processes a flyer analysis result and creates an event';

-- 12. Create function to mark flyer as failed
CREATE OR REPLACE FUNCTION mark_flyer_failed(
  p_flyer_id UUID,
  p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE whatsapp_flyers
  SET 
    status = 'failed',
    processing_attempts = processing_attempts + 1,
    last_processing_error = p_error_message,
    updated_at = NOW()
  WHERE id = p_flyer_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_flyer_failed IS 'Marks a flyer as failed with error message';
