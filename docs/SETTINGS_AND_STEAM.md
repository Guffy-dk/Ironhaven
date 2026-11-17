# Settings and Steam roadmap

## Available in 0.17.0

The Escape menu has separate pages for Save & load, Settings, Multiplayer, Colony tools and Help. Settings contains Controls, Audio, Graphics and Interface. Escape cancels an active tool before opening the menu, and returns one level at a time inside it.

- Controls: camera pan speed and zoom speed, 25–250%, with defaults restored per page. Pan applies to WASD/arrows and Shift; zoom applies to wheel and buttons.
- Audio: master volume, persistent mute and a test sound. There are currently synthesized game sounds, not separate music or ambience tracks.
- Graphics: existing Standard/Performance rendering choice, stored for this device.
- Interface: mineral names, building upgrade counts, existing panel toggles, layout reset and relocation confirmation reset.

## Next settings to implement

| Area | Priority | Options |
| --- | --- | --- |
| Controls | First | Rebind actions, duplicate-binding warnings, edge scrolling toggle/speed, middle-button drag, invert wheel zoom. |
| Audio | First | Separate UI, combat, machinery and ambience levels as those sound groups are added; music level when music exists; mute when unfocused. |
| Graphics | First | Windowed/borderless/fullscreen, resolution, render scale, frame limit and VSync; separate shadows, fog, bloom and particles. Apply/revert countdown for display changes. |
| Interface | First | UI scale, cursor size, health-bar visibility, readable resource markers, reduced flashes and color-independent warnings. |
| General | Next | Language, tooltip detail, restart training, confirmation preferences, autosave interval/checkpoint retention. |
| Solo play | Next | Optional pause on menu/focus loss; restore the preceding pause state. A guest must not pause a multiplayer host implicitly. |

Only expose working options: no empty sound mixers, Steam buttons or quality sliders that do not affect the game.

## Future Steam Cloud boundary — not integrated yet

`public/preferences.js` owns a versioned JSON schema and accepts a storage adapter. Its portable payload contains player controls, audio and interface preferences, separately from the world save. The current adapter uses local app storage. Graphics quality and window layout remain in device-local storage.

For Steam release, add a native adapter that atomically writes a dedicated player settings JSON file in an account-scoped directory under app user data. Keep different Steam accounts on the same PC separate. Sync that file with Steam Cloud. Do not sync Chromium's complete profile, Local Storage database, caches or hardware/display choices. Migrate existing local preferences once, preserve supported schema values, and define conflict handling before enabling Cloud sync. World saves need their own Cloud policy, backups and ownership rules.

Cloud-backed player preferences must not overwrite a host's world, difficulty, simulation speed or another player's settings.

## Future Steam co-op boundary — not integrated yet

Keep the host-authoritative commands and world snapshots in `public/shared/sim.js`. Add Steam identity, lobby creation/discovery and friend invitations in a platform/session layer, then connect a Steam-supported networking transport with relay/NAT traversal. The current LAN invitation flow is not Steam co-op.

Before shipping: validate lobby membership and command ownership, negotiate game/protocol versions, handle disconnect/rejoin, decide host-loss behavior, and test with distinct Steam accounts and networks. Guest settings remain local to that player. Steam Cloud settings sync and networked world simulation are separate features.
