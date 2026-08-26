# Push Verge to GitHub (with phase tags)

## 1. Create an empty repo on GitHub

- github.com → New repository  
- Name: `verge` (or `verge-india`)  
- **Do not** add README, .gitignore, or license (repo must be empty)

## 2. Unzip and push

```bash
unzip verge-india-mvp-git.zip
cd verge

# Point at your repo (HTTPS or SSH)
git remote add origin https://github.com/YOUR_USERNAME/verge.git
# git remote add origin git@github.com:YOUR_USERNAME/verge.git

git branch -M main
git push -u origin main
git push origin --tags
```

## 3. Verify tags on GitHub

```bash
git ls-remote --tags origin
```

You should see:

- `phase-1-foundation`
- `phase-3-routing`
- `v0.1.0-india-mvp`

## 4. Optional: release notes on GitHub

Create a Release from tag `v0.1.0-india-mvp` with body pointing at `PHASES.md`.

## Auth tips

- HTTPS: use a [Personal Access Token](https://github.com/settings/tokens) as the password  
- SSH: ensure `ssh -T git@github.com` works  

## Vercel / Render

After push, connect the same GitHub repo:

- Vercel → Root Directory `client`  
- Render → Root Directory `server`  

See `docs/DEPLOY.md`.
