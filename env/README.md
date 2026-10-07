# Environment variables

Proton Pass is the single source of truth for every secret and setting the sites, the apps and the workflows need. This folder says **where each value goes**; Proton Pass holds **the values**. Nothing here is secret: each line is a variable name and a `pass://vault/item/field` reference.

To change a value: edit it in Proton Pass, then push it from the owner's Mac with `npm run env:push`. Never edit a value directly in Vercel or GitHub: the next push overwrites it.

## The files

| Template                                        | Pushed to                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `website.production.env`                        | Vercel `lebontemperament`, Production                               |
| `website.dev.env`                               | Vercel `lebontemperament`, Preview + Development                    |
| `admin.production.env`                          | Vercel `lebontemperament-admin`, Production                         |
| `admin.dev.env`                                 | Vercel `lebontemperament-admin`, Preview + Development              |
| `github.repo.env`                               | GitHub repository secrets                                           |
| `github.app-store.env`, `github.play-store.env` | GitHub environments `app-store` and `play-store`                    |
| `sync.env`                                      | The Vercel token the push itself uses (GitHub uses your `gh` login) |

`targets.json` maps each template to its destination and holds the vault rules: production targets never read `LBT Staging` (except the e2e item for the repository secrets), and dev targets never read the production `Supabase` or `Sites` items.

## The vaults

Two vaults, one item per service, each value stored once even when several destinations use it. `npm run env:check -- --items` lists every item and field the templates read. Field names are the part after the item, in lower snake case (`pass://LBT Production/Cloudinary/api_secret` is the field `api_secret` of the item `Cloudinary`).

- `LBT Production`: production Supabase and sites, shared services (Cloudinary, Google, mailbox, Stripe, Mapbox), the mobile app's signing and store credentials, the backup passphrase, and `Sync tokens`.
- `LBT Staging`: staging Supabase and sites, and the e2e user.

## Filling the vaults (once, owner's Mac)

`npm run env:seed` creates each missing item as a custom item with exactly the fields the templates read, and fills the values it can find. Items that already exist are left alone. Dry run unless `--apply`.

```bash
npm run env:seed -- --vault "LBT Staging" --vercel        # dry run: what it would create, and from where
npm run env:seed -- --vercel --ask --apply \
  --base64 "LBT Production/Android signing/keystore_base64=$HOME/keys/upload-keystore.jks" \
  --file "LBT Production/App Store Connect/key_p8=$HOME/keys/AuthKey.p8" \
  --file "LBT Production/Google Play/service_account_json=$HOME/keys/play.json" \
  --file "LBT Production/Google service account/json=$HOME/keys/service-account.json"
```

| Source                     | Gives                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--vercel`                 | Vercel's current values, through the `Sync tokens` item; **sensitive** variables can't be read back |
| `--dotenv <target>=<path>` | a dotenv file of that target's variables (e.g. from `vercel env pull`)                              |
| `--file <ref>=<path>`      | one field from a text file (JSON keys, the `.p8` key)                                               |
| `--base64 <ref>=<path>`    | one field from a binary file, base64-encoded (the Android keystore)                                 |
| `--ask`                    | prompts, without echo, for each field still empty (single-line values only)                         |

A stronger source wins (asked, then files, then dotenv, then Vercel). Two different values from the same kind of source (say Vercel's Production and Preview copies of a shared key) are a conflict: the field stays empty, or `--ask` asks for it. The run refuses to write anything if a staging Supabase value points at another project or a production value points at staging. Values reach `pass-cli` on standard input; the output names fields only. Fill any field left empty in the Proton Pass app (keep the field name), then check with `npm run env:push -- dev`, which stops on a missing value.

## Pushing (owner's Mac)

One-time set-up: install the Proton Pass CLI ([docs](https://protonpass.github.io/pass-cli/get-started/installation/); the script was written for the version in `targets.json`, and warns on another one), run `pass-cli login`, install the GitHub CLI and run `gh auth login`. Store a Vercel token (team Le Bon Tempérament, with an expiry) in `LBT Production / Sync tokens / vercel_token`.

```bash
npm run env:push -- dev                         # dry run: website.dev and admin.dev
npm run env:push -- dev --apply                 # write what changed
npm run env:push -- github.repo                 # dry run of the repository secrets
npm run env:push -- production --apply --prod   # production: asks you to type the target name
```

Groups: `dev`, `production`, `github`; or name targets one by one. `--force` rewrites values even when they look unchanged.

What a run does:

1. `pass-cli run` resolves the template's references into the push script's environment. No value is written to a file, and the CLI masks values in the output.
2. The script lists each name as `create`, `update` (changed since the last push from this Mac), `overwrite` (exists but never pushed from this Mac), `unchanged`, `split` (a Vercel variable shared with other environments gets its own copy; the others keep their value) or `conflict` (fix by hand). Names only in the destination show as `extra` and are never deleted.
3. With `--apply`, it writes. Vercel production variables are created as **sensitive**; dev ones as encrypted (Vercel refuses sensitive variables on Development). GitHub values go to `gh secret set` on standard input.
4. It remembers a keyed fingerprint of each pushed value in `~/.config/lbt-env/` (outside the repo), because Vercel sensitive variables and GitHub secrets can't be read back.

Vercel uses new values from the next build only. For dev, merge the next PR into `dev` with `[vercel deploy]` in the merge title (a plain redeploy is cancelled, see [DEPLOYMENT.md](../DEPLOYMENT.md)). For production, the next release. Each deployment keeps the values it was built with, so an Instant Rollback also rolls the values back.

## Checking (anywhere, no secrets)

`npm run env:check` validates the templates and compares them with the names the code (`process.env.*`) and the workflows (`secrets.*`) read; CI runs it with `npm run test:env`. Names the code reads but that are deliberately not managed are listed under `unmanaged` in `targets.json`.

## Not covered yet

- Supabase edge-function secrets stay in Supabase.
- Local development still uses `.env.local`; `pass-cli run --env-file env/website.dev.env -- npm run dev -- --filter=website` is the intended replacement.
