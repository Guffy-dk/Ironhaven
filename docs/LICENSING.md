# Licensing register (commercial release on Steam)

Status as of 25 November 2026. This register covers everything that ships in the Windows and Linux game packages and the patchers. `test/licensing.test.mjs` checks it against the repository on every test run. This is an engineering compliance record and not legal advice; have it reviewed before a paid launch.

## What ships, and under which terms

| Component | Licence | Commercial use | Obligation and how it is met |
|---|---|---|---|
| Electron 45.3.3 runtime | MIT | Yes | `LICENSE` ships next to the executable |
| Chromium (inside Electron) | BSD-3 and others | Yes | `LICENSES.chromium.html` ships next to the executable |
| ffmpeg (media) | LGPL-2.1, open-source build | Yes | The build scripts replace Electron's default `libffmpeg`/`ffmpeg.dll` with Electron's pinned open-source build, which has no H.264/AAC patent-encumbered codecs. It is a separate shared library, so users can replace it. The studio intro is WebM. |
| three.js 0.180.0 | MIT | Yes | Licence text in `THIRD-PARTY-NOTICES.txt` |
| Fengari 0.1.5 + readline-sync, sprintf-js, tmp | MIT, BSD-3-Clause | Yes | `FENGARI-LICENSE.txt` and `THIRD-PARTY-NOTICES.txt` |
| Big Shoulders Display, IBM Plex Sans Condensed, IBM Plex Mono | SIL OFL 1.1 | Yes (embedding and bundling allowed; selling the fonts on their own is not) | `FONT-LICENSES.txt` |
| Poly Haven textures and summer HDRI | CC0 1.0 | Yes, no attribution required | Listed in `ASSET-LICENSES.txt` anyway; pinned by MD5 in `assets/manifest.json` |
| Grab3D crab and horror bases | CC0 1.0 | Yes | `THIRD_PARTY_ASSETS.txt`; upstream receipts in `docs/design/third-party-assets.json` |
| Coastal surface atlas and concept images | Generated with OpenAI image generation | Yes, per OpenAI's terms the output is the user's | Must be declared in Steam's AI content survey (below) |
| Linux patcher: .NET 8 runtime, Avalonia, SkiaSharp, HarfBuzzSharp, MicroCom, Tmds.DBus | MIT (plus notices for Skia, HarfBuzz and .NET dependencies) | Yes | `Ironhaven-Patcher-Linux-NOTICES.txt` is built next to the patcher. The patcher uses system fonts (no bundled Inter font). Avalonia build telemetry is turned off in the build. |
| Windows patcher | .NET Framework (part of Windows) | Yes | Nothing to ship |
| Ironhaven code, models, intro and music | Owner | — | All rights reserved. The public GitHub repository has no open-source licence, so it is visible but not licensed to others. |

Build-time tools that do not ship (Node, esbuild, Playwright, happy-dom, Blender, .NET SDK, Avalonia.BuildServices) carry no distribution obligations.

## Rules for new content

1. Use only CC0, MIT, BSD, Apache-2.0, zlib or OFL sources, or assets bought with a licence that explicitly allows use in a commercially sold game. No CC-BY-NC, CC-BY-SA, GPL or "editorial use only" material.
2. Add every new file to `assets/manifest.json` (source, licence, size, MD5) or to `docs/design/third-party-assets.json`. The licensing test fails otherwise.
3. Record AI-generated or AI-assisted art, audio and text in the provenance files, so the Steam disclosure stays accurate.
4. Add any new runtime npm dependency to `scripts/write-notices.mjs`. The build refuses unknown dependencies.

## Steam: owner actions before a paid release

- **AI content disclosure.** On the Steamworks content survey, disclose pre-generated AI content: the creature bases (Grab3D, generated with Meshy and cleaned in Blender), the OpenAI-generated surface atlas and concept art, and that code and art were made with AI assistance (Claude, Codex). Suggested text: "Some 3D creature base meshes, textures and concept art were generated with AI tools (Meshy, OpenAI image generation) and then edited by hand in Blender. Parts of the game code were written with AI coding assistants. No live AI generation happens in the game."
- **Name.** Check that "Ironhaven" is free to use as a product and trademark name in the target markets before buying the store page.
- **Steamworks SDK.** If added later, it falls under Valve's SDK licence and must not be committed to the public repository.
- **Repository.** The public repository shows the source. If that is not wanted, make it private before launch.
