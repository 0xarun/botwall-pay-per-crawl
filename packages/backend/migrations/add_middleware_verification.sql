-- Migration: Add middleware verification table
-- This table tracks whether middleware is properly installed on each site

CREATE TABLE IF NOT EXISTS public.middleware_verification (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['installed'::text, 'not_installed'::text, 'error'::text, 'unknown'::text])),
  last_check timestamp with time zone DEFAULT now(),
  last_successful_check timestamp with time zone,
  verification_token text NOT NULL,
  middleware_version text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT middleware_verification_pkey PRIMARY KEY (id),
  CONSTRAINT middleware_verification_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE,
  CONSTRAINT middleware_verification_site_id_unique UNIQUE (site_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_middleware_verification_site_id ON public.middleware_verification(site_id);
CREATE INDEX IF NOT EXISTS idx_middleware_verification_status ON public.middleware_verification(status);
CREATE INDEX IF NOT EXISTS idx_middleware_verification_last_check ON public.middleware_verification(last_check);

-- Add comment for documentation
COMMENT ON TABLE public.middleware_verification IS 'Tracks middleware installation and health status for each site';
COMMENT ON COLUMN public.middleware_verification.status IS 'Current status: installed, not_installed, error, unknown';
COMMENT ON COLUMN public.middleware_verification.verification_token IS 'Secret token for middleware to authenticate health checks';
COMMENT ON COLUMN public.middleware_verification.middleware_version IS 'Version of middleware detected during health check'; 