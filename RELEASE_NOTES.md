# Release notes

The source of truth is [public/shared/releases.js](public/shared/releases.js).

The game renders this history under **Menu → Patch notes & version history**. `npm run build` validates each version and generates `release/RELEASE_NOTES.md`, which the GitHub release workflow publishes with the standalone HTML file. Add notes for every minor version and patch; stay on 0.x until the first full stable release.
