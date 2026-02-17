# Contributing to Meridian

Thank you for your interest in contributing to Meridian.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Start infrastructure: `docker compose up -d`
4. Build: `pnpm turbo build`
5. Test: `pnpm turbo test`

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(sdk):` — New feature in the SDK
- `fix(contracts):` — Bug fix in smart contracts
- `docs:` — Documentation changes
- `test:` — Test additions or fixes
- `refactor:` — Code refactoring
- `chore:` — Build/tooling changes

## Pull Requests

1. Create a feature branch: `feat/your-feature`
2. Write tests for your changes
3. Ensure all tests pass: `pnpm turbo test`
4. Ensure types check: `pnpm turbo typecheck`
5. Submit a PR with a clear description

## Code Style

- TypeScript: ESM, strict mode, named exports only
- Solidity: 0.8.24+, NatSpec docs, CEI pattern
- See the [README](README.md) for full coding standards
