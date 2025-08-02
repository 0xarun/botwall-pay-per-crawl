-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bot_crawl_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  bot_id uuid,
  known_bot_id uuid,
  user_agent text NOT NULL,
  bot_name text NOT NULL,
  path text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['success'::text, 'blocked'::text, 'failed'::text])),
  ip_address text,
  timestamp timestamp with time zone DEFAULT now(),
  raw_headers jsonb,
  extra jsonb,
  CONSTRAINT bot_crawl_logs_pkey PRIMARY KEY (id),
  CONSTRAINT bot_crawl_logs_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id),
  CONSTRAINT bot_crawl_logs_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT bot_crawl_logs_known_bot_id_fkey FOREIGN KEY (known_bot_id) REFERENCES public.known_bots(id)
);
CREATE TABLE public.bots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL,
  bot_name text NOT NULL,
  bot_id text NOT NULL UNIQUE,
  api_key text,
  credits integer NOT NULL DEFAULT 0,
  usage_reason text,
  public_key text,
  private_key text,
  generated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  total_requests integer NOT NULL DEFAULT 0,
  successful_requests integer NOT NULL DEFAULT 0,
  CONSTRAINT bots_pkey PRIMARY KEY (id),
  CONSTRAINT bots_developer_id_fkey FOREIGN KEY (developer_id) REFERENCES public.users(id)
);
CREATE TABLE public.crawls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL,
  site_id uuid,
  status text NOT NULL CHECK (status = ANY (ARRAY['success'::text, 'failed'::text, 'blocked'::text])),
  path text NOT NULL,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT crawls_pkey PRIMARY KEY (id),
  CONSTRAINT crawls_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id),
  CONSTRAINT crawls_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id)
);
CREATE TABLE public.known_bots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_agent_pattern text NOT NULL,
  website text,
  description text,
  default_blocked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT known_bots_pkey PRIMARY KEY (id)
);
CREATE TABLE public.middleware_verification (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL UNIQUE,
  status text NOT NULL CHECK (status = ANY (ARRAY['installed'::text, 'not_installed'::text, 'error'::text, 'unknown'::text])),
  last_check timestamp with time zone DEFAULT now(),
  last_successful_check timestamp with time zone,
  verification_token text NOT NULL,
  middleware_version text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT middleware_verification_pkey PRIMARY KEY (id),
  CONSTRAINT middleware_verification_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role = ANY (ARRAY['site_owner'::text, 'bot_developer'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.site_bot_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  known_bot_id uuid NOT NULL,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_bot_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT site_bot_preferences_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT site_bot_preferences_known_bot_id_fkey FOREIGN KEY (known_bot_id) REFERENCES public.known_bots(id)
);
CREATE TABLE public.sites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  domain text NOT NULL,
  price_per_crawl numeric NOT NULL DEFAULT 0.01,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  total_earnings numeric NOT NULL DEFAULT 0,
  total_requests integer NOT NULL DEFAULT 0,
  successful_requests integer NOT NULL DEFAULT 0,
  site_id text UNIQUE,
  frontend_domain text,
  backend_domain text,
  monetized_routes jsonb DEFAULT '["/*"]'::jsonb,
  analytics_routes jsonb DEFAULT '["/*"]'::jsonb,
  CONSTRAINT sites_pkey PRIMARY KEY (id),
  CONSTRAINT sites_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bot_id uuid,
  amount numeric NOT NULL,
  credits integer NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])),
  lemon_order_id text,
  created_at timestamp with time zone DEFAULT now(),
  pack_name text,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT transactions_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role = ANY (ARRAY['site_owner'::text, 'bot_developer'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);