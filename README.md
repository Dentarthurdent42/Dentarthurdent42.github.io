# Mathieu Poulin

Personal GitHub Pages site and portfolio.

Visit the live site: [Dentarthurdent42.github.io](https://Dentarthurdent42.github.io/)

## Featured projects

- [RotorVision](https://github.com/Dentarthurdent42/RotorVision)
- [physical-metric-space](https://github.com/Dentarthurdent42/physical-metric-space)

The homepage embeds live copies of these demos from `projects/`. Those copies
are kept current automatically by the [`sync-projects`](.github/workflows/sync-projects.yml)
workflow, which mirrors the latest default-branch contents of each source repo
on a daily schedule (and can also be run manually or triggered via
`repository_dispatch`).

For near-instant updates, each source repo can ping this repo on push so the
sync runs within seconds. See [docs/auto-update-setup.md](docs/auto-update-setup.md)
for the one-time setup (a trigger workflow plus a token secret in each source repo).
