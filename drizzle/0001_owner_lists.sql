-- Provisioning the one private account seeds the same lists as the manual demo.
-- This trigger deliberately uses the caller's privileges, not SECURITY DEFINER.
CREATE FUNCTION public.seed_owner_lists() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  INSERT INTO public.bookmakers(owner_id, name)
  SELECT NEW.owner_id, name FROM unnest(ARRAY[
    'Unibet', 'Coral', 'Betfred', 'Paddy Power', 'Virgin Bet', 'Betway',
    'Sky Bet', 'SBK', '888sport', 'BetMGM', 'BoyleSports', 'Ladbrokes', 'bet365'
  ]) AS name;
  INSERT INTO public.sources(owner_id, name) VALUES (NEW.owner_id, 'Me');
  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.seed_owner_lists() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER seed_lists AFTER INSERT ON public.app_accounts
FOR EACH ROW EXECUTE FUNCTION public.seed_owner_lists();
