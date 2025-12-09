# Code Style Guide – dnd-tabletop-companion

## 1. Angular Template Conventions

- Control Flow: Use block syntax only – `@if`, `@else`, `@for`, `@switch`, `@case`.
- Disallowed: `*ngIf`, `*ngFor`, `*ngSwitch` and `<ng-container>` used solely for structural directives.
- Tracking: Prefer explicit `track` for `@for` when iterating large arrays (`@for (c of classes(); track c)`).
- Condition Nesting: Flatten where possible; avoid deeply nested `@if` chains—extract to computed booleans in component/store.
  (interpolation guidance remains, but i18n is no longer used)

## 2. Signals & State

- Source of Truth: `CharacterStore` signals. Components must not mutate state directly except through exposed store methods (`patchCharacter`, `applyDamage`, `heal`).
- Computed Values: Derive percent HP and other aggregates using `computed` in the store.
- Side Effects: Persistence or cloud sync via `effect` in services (`CloudSyncService`), not in components.

## 3. Styling & Layout

- Font Stack: `"EB Garamond", "Source Serif 4", "Goudy Bookletter 1911", Georgia, serif`.
- Bold Text: Use only real font weights (400–700); do not simulate bold on fonts lacking weight variants.
- Component Styles: Keep per-component CSS minimal; share common layout rules in `styles.css`.
- Avoid Pixel Drift: Prefer flexbox and gap properties over manual margins for horizontal spacing.

## 4. Forms & Angular Material

- `mat-form-field`: Use `subscriptSizing="dynamic"` unless explicitly reserving hint/error space.
- Hints / Errors: Include only where meaningful; do not leave placeholder hints.
- Accessibility: Add `aria-label` or `aria-describedby` where icon-only buttons exist.

## 5. Cloud & Persistence

- LocalStorage: Transitional; Firestore becomes primary once stable. Avoid duplicating writes unless necessary for offline.
- Backup: Use `BackupService` for manual export/import JSON.
- Firestore Writes: Debounced or signal-driven; avoid writing on every keystroke of large fields.

## 6. File & Naming

- Service Files: `*.service.ts` suffix; store: `*.store.ts`.
- Avoid Abbreviations: Use full descriptive names (`character.store.ts` not `char.store.ts`).
- Interfaces: Export in singular files (e.g., `character.model.ts`).

## 7. Error Handling

- No `alert()` except temporary debug; replace with Material Snackbar (planned).
- Silent Failures: Catch external API errors and set an error state (`classesError`) rather than throwing.

## 8. Testing

- Unit Tests: Each service and store requires basic CRUD or logic tests.
- Signals: Test computed outputs by patching state and asserting new values.
- Cloud Sync: Mock Firestore (or abstract calls) for deterministic tests.

## 9. Performance

- Avoid Unnecessary Re-renders: Bind directly to signal getters; refrain from creating new object/array instances in templates.
- Track By: Always `track` for loops over character resource arrays and large lists.

## 10. Security

- Never commit service account JSON or private keys.
- Firebase config is public but keep only client-side web config in `firebase.config.ts`.
- Firestore rules must restrict documents to authenticated user (`uid` match).

## 11. Accessibility (a11y)

- Live Regions: Use `aria-live="polite"` for status updates (death saves, HP status).
- Focus Order: Interactive elements appear in logical order (header → primary controls → body).
- Icon Buttons: Provide `aria-label`.

## 12. Versioning / Migrations

- Backup Format: Maintain `version` in backup JSON; new fields require bump + migration logic.
- Firestore Docs: Include `updatedAt` (serverTimestamp) for conflict resolution if manual merging is needed.

## 13. Commit Guidelines

- Message Prefixes:
  - `feat:` feature additions
  - `fix:` bug fixes
  - `style:` formatting or CSS changes
  - `sync:` cloud/firestore related changes
- Avoid combining unrelated changes in one commit.

## 14. Prohibited Patterns

- Legacy structural directives (`*ngIf`, `*ngFor`).
- Direct state mutation (`character.whatever = ...`) in templates without emitting store patch (except controlled local ephemeral values).
  -- Hard-coded duplicated error messages should be consolidated into helper functions or constants.

## 15. Future Reserved

- Zoned vs Zoneless Migration: Keep code free of direct `setTimeout` for view updates; use signals/effects.
- Theming: Prepare for CSS custom properties to drive dark mode.

## Enforcement (CI/Git Hooks)

- Grep Check (CI):
