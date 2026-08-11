# deployment/dns/

Placeholder. Once a production domain is registered, document the required DNS records here (not the actual zone file — most providers manage this via their own dashboard):

- A/CNAME for the frontend domain → Vercel
- CNAME for the API subdomain (e.g. `api.yourdomain.tld`) → Railway
- DKIM/Return-Path records for the Postmark-verified sending domain
- Any additional records the chosen hosting providers require for custom-domain verification

No real domain or DNS values exist in this repository.
