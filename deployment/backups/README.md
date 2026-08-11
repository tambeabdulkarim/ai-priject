# deployment/backups/

Placeholder. Documents the backup approach once production infrastructure exists — not a place to store actual backup files (database backups belong in the provider's own backup system, e.g. Neon's point-in-time recovery; media backups depend on the storage provider's own versioning/lifecycle rules).

Once live, record here: the confirmed retention window, how to trigger a manual on-demand backup before a risky change, and the last-tested restore date (a backup that has never been restored from is unverified).
