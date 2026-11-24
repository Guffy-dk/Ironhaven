# Ironhaven repository guidance

Read [SHARED_CONTEXT.md](SHARED_CONTEXT.md) first. It is the common durable project brain for Codex, Claude Code and the owner. Safely reconcile current GitHub/local changes before work. Record important owner decisions, implementation choices, test evidence, unresolved issues and next steps there; include the update in the same commit/PR as the work and push it so other agents can see it. Preserve other contributors' context, distinguish proposals from accepted/implemented behavior, and do not claim local-only work is synchronized.

Implementation pause: no game/content/modding changes before **2026-11-23 19:45 Europe/Copenhagen (18:45 UTC)** unless the owner supersedes it. Documentation is allowed. Check actual current time before resuming. Research is saved in `docs/design/MODDING_RESEARCH_AND_IDEAS.md`.

The latest mandate permits autonomous internal development but requires an explicit owner request before patcher publication, public release tags or latest-release promotion. The owner selected 0.21.1 for the harbor and modding release, superseding the earlier 0.20 ceiling. Use three-part public versions so the current patcher can install them. Keep internal build IDs separate. Follow the latest owner instructions over historical handoffs.

For graphics, textures, models, lighting, UI or visual readability, apply `.agents/skills/ironhaven-art-direction/SKILL.md` and read `docs/design/ART_DIRECTION.md`. Judge actual ingame captures, not concepts or passing code tests alone. Preserve Windows-only distribution and the factory-building-with-enemies direction.

When working on gameplay balance or playtests, read [the balance agent log](docs/playtests/balance-agent-log.md) for recent statistics, test limitations, decisions, and follow-up work. Follow its links to versioned reports and raw results.
