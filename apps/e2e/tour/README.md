# Admin tour video

A narrated walkthrough of the admin for its admins: Playwright films each scene on **admin-dev** (staging, fake data), ElevenLabs reads the French script in Thomas's cloned voice, and ffmpeg assembles the result.

- `script-fr.md`: the scenes and what the voice says. Edit a « **Voix** » line and only that scene is re-voiced.
- `scenes.ts`: what each scene does on screen. `d.cue("…")` waits for a phrase of the scene's narration, so clicks land on the words that describe them. Nothing saves: dialogs are closed with « Annuler ».

## Run it (on a Mac with Node 24 and `ffmpeg`)

```sh
# Silent draft with estimated timings (no ElevenLabs credits spent)
node apps/e2e/tour/run.ts --draft --chapters 1

# Voiced, one chapter / everything
node apps/e2e/tour/run.ts --chapters 2
node apps/e2e/tour/run.ts

# Voice only, to listen before filming
node apps/e2e/tour/run.ts --voice-only
```

Output goes to `~/Movies/lbt-admin-video/` (override with `--out` or `TOUR_OUT`): `presentation-admin.mp4` with chapters, one clip per chapter, `presentation-admin.srt`, and the cached voice takes in `audio/`. The output stays out of the repo: it shows logged-in pages, so it is shared privately, never published.

The run reads:

- the staging login and Vercel bypass from `apps/e2e/.env.local`, like the e2e suite (`E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `VERCEL_AUTOMATION_BYPASS_SECRET`, optional `ADMIN_URL`). It refuses the production admin.
- `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` from `~/.config/lbt-admin-video/elevenlabs.env`, outside the repo. Optional `ELEVENLABS_MODEL` (default `eleven_multilingual_v2`).

## On the production admin

`--production` films the real admin with a throwaway **administrator** account (not super-admin), read from `~/.config/lbt-admin-video/prod-login.env` (`TOUR_EMAIL`, `TOUR_PASSWORD`). In that mode:

- members' e-mails, phone numbers and postal addresses are blurred before they are painted (names stay readable);
- every request that could write is refused, except signing in, server actions and Supabase read functions, which are logged; the run prints the list at the end;
- delete the throwaway account once the video is done.

At the end, the run lists every step it skipped because a button or heading was not found: fix the selector in `scenes.ts` or the data on staging, and re-run that chapter.

Subtitles are burnt in when `ffmpeg` has libass (Homebrew's does); otherwise only the `.srt` file is written. `--no-subtitles` turns them off.
