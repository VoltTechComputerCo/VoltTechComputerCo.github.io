-- Applied to VoltTech Production as Supabase migration 20261103140737.
-- Customer-facing URLs must never expose supplier identity.
-- Preserve the preexisting 'slug' and immutable 'id' for historical links,
-- stock sync, orders, quotes, saved carts and product relationships.
ALTER TABLE public.store_products
  ADD COLUMN public_slug text GENERATED ALWAYS AS (
    coalesce(
      nullif(trim(both '-' from left(
        regexp_replace(
          lower(regexp_replace(trim(name),
            '^(syntech|tarsus|esquire|lunatech)([^a-z0-9]+|$)', '', 'i')),
          '[^a-z0-9]+', '-', 'g'
        ),
        72
      )), ''),
      'product'
    ) || '-' || right(id, 12)
  ) STORED;

CREATE UNIQUE INDEX store_products_public_slug_key
  ON public.store_products (public_slug);

COMMENT ON COLUMN public.store_products.public_slug IS
  'Customer-facing product permalink. Never expose internal supplier ID via the public product URL; legacy slug retained for inbound links.';
