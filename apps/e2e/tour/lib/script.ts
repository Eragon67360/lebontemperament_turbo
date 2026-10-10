import { readFileSync } from "node:fs";

export type Scene = {
  /** "2.1" — matches the key in scenes.ts. */
  id: string;
  title: string;
  /** What the recording shows: documentation for the reviewer only. */
  screen: string;
  /** What the voice says. */
  voice: string;
};

export type Chapter = {
  number: number;
  title: string;
  scenes: Scene[];
};

// Reads script-fr.md: « ## Chapitre N · Titre », « ### N.M Titre »,
// « **Écran** : … », « **Voix** : … ». Everything from « ## Notes » on is
// commentary for the reviewer and is ignored.
export function readScript(path: string): Chapter[] {
  const chapters: Chapter[] = [];
  let scene: Scene | undefined;

  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (/^## Notes/.test(line)) break;

    const chapter = line.match(/^## Chapitre (\d+) · (.+)$/);
    if (chapter) {
      chapters.push({
        number: Number(chapter[1]),
        title: chapter[2]!.trim(),
        scenes: [],
      });
      scene = undefined;
      continue;
    }

    const heading = line.match(/^### (\d+\.\d+) (.+)$/);
    if (heading) {
      const current = chapters.at(-1);
      if (!current) throw new Error(`Scene ${heading[1]} before any chapter`);
      scene = {
        id: heading[1]!,
        title: heading[2]!.trim(),
        screen: "",
        voice: "",
      };
      current.scenes.push(scene);
      continue;
    }

    const screen = line.match(/^\*\*Écran\*\* : (.+)$/);
    if (screen && scene) scene.screen = screen[1]!.trim();
    const voice = line.match(/^\*\*Voix\*\* : (.+)$/);
    if (voice && scene) scene.voice = voice[1]!.trim();
  }

  for (const chapter of chapters) {
    for (const s of chapter.scenes) {
      if (!s.voice) throw new Error(`Scene ${s.id} has no « **Voix** : » line`);
    }
  }
  return chapters;
}
