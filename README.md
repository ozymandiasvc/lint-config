# lint-config

The shared lint baseline for my TypeScript repos. Its job is to constrain AI coding
agents: every rule is an error, the usual escape hatches are banned, and every repo
exposes one `check` command that agents, the command-center hooks and the pre-push hook all run.

The `lint-baseline` skill in [command-center](https://github.com/ozymandiasvc/command-center)
onboards a repo (mode **add**) and moves it to a new version (mode **update**). Use the
skill rather than wiring things by hand.

## What it exports

| Import                                           | What it is                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@ozymandiasvc/lint-config/eslint`               | `base({ tsconfigRootDir })`: ESLint 10 flat config. `typescript-eslint` `strict-type-checked` + `stylistic-type-checked`, bans on `any`, `@ts-ignore`/`@ts-expect-error`, `!`, `console` and comments (tool directives allowed), suppressions need a description, Vitest rules for test files, Prettier conflicts off. |
| `@ozymandiasvc/lint-config/eslint/react`         | `react()`: React and hooks rules for `.tsx`/`.jsx`; bans `useEffect` and `useLayoutEffect` in every file.                                                                                                                                                                                                              |
| `@ozymandiasvc/lint-config/eslint/next`          | `next()`: the React layer plus Next.js core-web-vitals rules. Use it instead of `react()`.                                                                                                                                                                                                                             |
| `@ozymandiasvc/lint-config/tsconfig/strict.json` | `strict` plus the extra strictness flags. Each repo sets its own `module`, `target` and `lib`.                                                                                                                                                                                                                         |
| `@ozymandiasvc/lint-config/prettier`             | Prettier config (Prettier defaults).                                                                                                                                                                                                                                                                                   |
| `@ozymandiasvc/lint-config/depcruise`            | dependency-cruiser rules: no cycles, no orphans, no unresolvable or undeclared imports, no devDependencies in `src`, no importing another workspace package's internals. Repos add their own layer rules.                                                                                                              |
| `@ozymandiasvc/lint-config/knip`                 | knip policy. Repos add their own workspaces and entries.                                                                                                                                                                                                                                                               |

## Using it in a repo

Install it as a git dependency pinned to a tag, plus its peers:

```sh
pnpm add -D github:ozymandiasvc/lint-config#v1.0.0 eslint typescript prettier dependency-cruiser knip
```

`eslint.config.js`:

```js
import { base } from "@ozymandiasvc/lint-config/eslint";
import { react } from "@ozymandiasvc/lint-config/eslint/react";

export default [...base({ tsconfigRootDir: import.meta.dirname }), ...react()];
```

Add `react()` only if the repo has React. Repo-only rules go after the baseline; changing the
baseline happens here.

Comments are banned (`lint-config/no-comments`). Turn a comment into a better name, a type or a
test, or move the reason to the commit message or an ADR. Directives stay allowed:
`eslint-disable`, `prettier-ignore`, `@ts-…`, coverage ignores, `/// <reference>`, `#__PURE__` and
bundler hints like `/* webpackChunkName: … */`. Plain JS files may keep JSDoc type annotations.

`tsconfig.json` (or `tsconfig.base.json` in a monorepo):

```json
{ "extends": "@ozymandiasvc/lint-config/tsconfig/strict.json" }
```

`package.json`:

```json
{
  "prettier": "@ozymandiasvc/lint-config/prettier",
  "scripts": {
    "lint": "eslint . --prune-suppressions",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "format": "prettier --write .",
    "depcruise": "depcruise src",
    "knip": "knip",
    "check": "prettier --check . && pnpm lint && pnpm typecheck && pnpm depcruise && pnpm knip && pnpm test"
  }
}
```

`.prettierignore` must list the lockfile and `eslint-suppressions.json`: ESLint writes the
suppressions file in its own format, so Prettier would fail every prune.

`lefthook.yml`, with `lefthook` in devDependencies and `"prepare": "lefthook install"`:

```yaml
extends:
  - node_modules/@ozymandiasvc/lint-config/lefthook/base.yml
```

Before each commit it runs ESLint and Prettier on the staged files; before each push it runs
`pnpm check`. The pre-push hook is the gate: repos have no CI. Repo-only hooks (another
language's formatter) go in the repo's own file; on a command with the same name, the shared
file wins.

In a monorepo, `depcruise` takes the workspace folders (`depcruise apps packages`), and
`typecheck`/`test` run across workspaces (`pnpm -r typecheck`).

## TypeScript 7 repos (temporary)

`typescript-eslint` 8.x needs the TypeScript API, and TypeScript 7.0 has none. In a repo on
TypeScript 7, alias the TypeScript 6 API for the tools and keep `tsc` on 7:

```json
"devDependencies": {
  "typescript": "npm:@typescript/typescript6@^6.0.2",
  "@typescript/native": "npm:typescript@^7.0.2"
}
```

Check with `pnpm exec tsc --version` (7.x) and `pnpm exec tsc6 --version` (6.x). The repo's
tsconfig must also be valid under TypeScript 6. Remove the alias when `typescript-eslint`
ships TypeScript 7.1 support ([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)).

## Changing the baseline

1. Change the rule here and run `pnpm check` (Prettier and the smoke test in `test/`).
2. Bump `version` in `package.json`, commit, and tag `vX.Y.Z`. Breaking rule changes are a
   major version.
3. Run the `lint-baseline` skill in **update** mode in each repo.
