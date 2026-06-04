# GitHub Repo Handoff

## Recommended Repo Shape

You can push the whole current workspace, but the cleanest repo would contain:

```text
.github/workflows/production-check.yml
.gitignore
README.md
assets/
production/
```

The old mockup files can stay out of the production repo:

```text
bjrc-v6.html
bjrc-v7.html
bjrc-v8.html
bjrc-v8-share.html
```

They are useful history, but not needed for launch.

## Vercel Settings

In Vercel:

```text
Root Directory: production
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

## Before Push

Run:

```sh
cd production
npm run check
```

Then skim:

```text
BUILD_REPORT.md
```

## After Push

GitHub Actions should run:

```text
Production Check
```

It should pass before you import or redeploy in Vercel.

## If You Want The Cleanest Possible Repo

Create a new folder/repo with only:

```text
.github/
.gitignore
README.md
assets/
production/
```

Then push that.

Do not put only `production/dist` in GitHub unless you want a manual-deploy-only site. The source files and build scripts matter for future updates.
