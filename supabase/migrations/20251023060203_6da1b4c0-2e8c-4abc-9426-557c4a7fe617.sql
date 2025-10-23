-- Add new roles to the enum (must be in separate transaction)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'doctor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'patient';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'labs';