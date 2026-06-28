/**
 * White-label brand name fallback.
 *
 * The live name + logo come from the backend (`GET /api/site/branding` → the tenant's operating
 * agency), but the name is also baked in at build time via `NEXT_PUBLIC_APP_NAME` so the very
 * first paint (and metadata/title) is correct before the branding request resolves, and so the
 * mark still reads sensibly if a tenant has no agency/logo configured yet.
 */
export const BRAND_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'TimeMob';
