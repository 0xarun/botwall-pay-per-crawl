-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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
  CONSTRAINT bots_pkey PRIMARY KEY (id),
  CONSTRAINT bots_developer_id_fkey FOREIGN KEY (developer_id) REFERENCES public.users(id)
);
CREATE TABLE public.crawls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL,
  site_id uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['success'::text, 'failed'::text, 'blocked'::text])),
  path text NOT NULL,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT crawls_pkey PRIMARY KEY (id),
  CONSTRAINT crawls_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT crawls_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id)
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
CREATE TABLE public.sites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  domain text NOT NULL,
  price_per_crawl numeric NOT NULL DEFAULT 0.01,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
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
  CONSTRAINT transactions_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
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