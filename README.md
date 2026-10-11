This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

This repository uses **pnpm 12.11.2**. With Node.js installed, install pnpm once:

```bash
npm install --global pnpm@12.11.2
```

Install the project dependencies, then start development:

```bash
pnpm install
pnpm dev
```

Use `pnpm add <package>` to add a dependency and `pnpm add -D <package>` for a development dependency. For CI, use `pnpm install --frozen-lockfile`.

## Code quality

Biome handles linting, formatting and import organisation, with recommended React/Next.js rules and Tailwind CSS directive support. TypeScript checking remains a separate step.

| Command | Purpose |
| --- | --- |
| `pnpm check` | Check formatting, lint rules, imports and TypeScript types |
| `pnpm check:fix` | Apply formatting, import organisation and safe lint fixes |
| `pnpm format` | Format supported files |
| `pnpm format:check` | Check formatting without changing files |
| `pnpm lint` | Run lint rules only |
| `pnpm typecheck` | Generate Next.js route types and check TypeScript |
| `pnpm build` | Create a production build |

For VS Code or compatible editors, install the recommended **Biome** extension (`biomejs.biome`). Workspace settings enable formatting and safe fixes on save for supported source/config files. Static files in `public`, generated Next.js types and Git-ignored build/dependency files are excluded from Biome checks.

Commit `pnpm-lock.yaml` when dependencies change. The `packageManager` field pins the pnpm version; use pnpm consistently in this repository.

Project requirements and handoff notes are in [docs/BUILD_BRIEF.md](docs/BUILD_BRIEF.md), [docs/DECISIONS.md](docs/DECISIONS.md), and [docs/PROGRESS.md](docs/PROGRESS.md).

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
