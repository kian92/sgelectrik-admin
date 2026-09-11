-- Allow house (SGElectrik-run) promotions
-- Run this in the Supabase SQL editor for the SGElectrik project
-- (xolqiionlysdarlpfhvi.supabase.co)
--
-- A promotion with a null dealer_id is run by SGElectrik itself rather than
-- by a dealer. The public site already falls back to an SGElectrik label when
-- the joined dealer row is absent.

alter table promotions alter column dealer_id drop not null;
