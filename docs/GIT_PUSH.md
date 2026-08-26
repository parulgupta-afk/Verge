# Push Verge to GitHub

**Repo:** https://github.com/parulgupta-afk/Verge

## First time

```bash
unzip verge-phase2-git.zip   # or current zip name
cd verge

git remote remove origin 2>/dev/null
git remote add origin https://github.com/parulgupta-afk/Verge.git
git branch -M main
git push -u origin main
git push origin --tags
```

If the GitHub repo already has a README commit and push is rejected:

```bash
git pull origin main --rebase
git push -u origin main
git push origin --tags
```

Or force only if you intend to replace remote history:

```bash
git push -u origin main --force
git push origin --tags --force
```

## After every new phase (from now on)

```bash
cd verge
git add -A
git commit -m "Phase N: short description"
git tag -a phase-N-name -m "message"
git push origin main
git push origin --tags
```

## Auth

- HTTPS: GitHub → Settings → Developer settings → Personal Access Token (classic) with `repo` scope  
- Password when `git push` asks = the token  

SSH alternative:

```bash
git remote set-url origin git@github.com:parulgupta-afk/Verge.git
git push -u origin main
git push origin --tags
```
