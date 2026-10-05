---
name: archi-sync
description: Sync this ARCHI checkout with GitHub before any work starts. Run it first thing in every new session (a SessionStart hook in .claude/settings.json reminds you), before reading or editing project files, and whenever the user says things like "풀 받아", "최신화", "동기화", "pull 해줘", "다른 사람 커밋 받아", "시작하자". It checks for uncommitted or unpushed local work, fetches origin, pulls new commits safely (fast-forward only unless the user picks otherwise), reports what came in, and then goes back to the user's actual request.
---

# ARCHI sync (pull before work)

Several people work on ARCHI at the same time and push to `origin`
(github.com/hwanghj09/ARCHI). Starting on a stale checkout means editing the same floor, scene
and asset files someone already changed, which ends in conflicts. So every session pulls first,
then works.

Run the git commands below with the Bash tool (POSIX shell, Git Bash on Windows). In PowerShell
`@{u}` must be quoted as `'@{u}'`.

## 1. Snapshot local and remote state

One Bash call:

```bash
git rev-parse --abbrev-ref HEAD
git status --porcelain
git fetch origin --prune
git rev-parse --abbrev-ref --symbolic-full-name @{u}
git rev-list --left-right --count HEAD...@{u}
```

- `rev-list` prints `<ahead> <behind>`: commits only you have, commits only origin has.
- If the branch is not `main`, also run `git rev-list --left-right --count HEAD...origin/main`
  so you can tell the user how far the branch is behind `main`, where everyone else pushes.

## 2. Decide what to do

| State | Action |
|---|---|
| ahead 0, behind 0 | Up to date. Say so in one line and continue. |
| ahead 0, behind > 0, clean tree | `git pull --ff-only` |
| ahead 0, behind > 0, dirty tree | Try `git pull --ff-only`. Git only refuses if an incoming commit touches a locally modified file. If it refuses, stop and ask the user: commit the local work first, or stash it (`git stash push -u -m "archi-sync"`, pull, `git stash pop`). |
| ahead > 0, behind 0 | Local commits are not pushed. Tell the user which ones (`git log --oneline @{u}..HEAD`) and ask whether to push now. Do not push without a yes. |
| ahead > 0, behind > 0 | Diverged. Show both sides (`git log --oneline HEAD..@{u}` and `git log --oneline @{u}..HEAD`) and ask: `git pull --rebase` (recommended while the local commits are unpublished) or `git pull --no-rebase` (merge commit). |
| no upstream (`@{u}` errors) | Say the branch has no remote tracking branch, report how far it is from `origin/main`, and ask before pushing or creating a remote branch. |
| fetch fails (offline, auth) | Show the error, warn that work would start on possibly stale code, and ask whether to continue anyway. |

On a feature branch that is behind `origin/main`, report it and ask before merging or rebasing
`main` into it. Never do that on your own.

## 3. Report what came in

Before pulling, save the old head: `PREV=$(git rev-parse HEAD)`. After a successful pull:

```bash
git log --oneline "$PREV"..HEAD
git diff --stat "$PREV" HEAD
```

Give the user a short summary: how many commits, who/what (commit subjects), and the main areas
touched (for example `js/floors/`, `assets/`, `tests/`). Then flag follow-ups:

- `package.json` or `package-lock.json` changed: tell the user and offer to run `npm install`.
- Anything under `.claude/` changed (skills, settings, hooks): mention that a new session is the
  sure way to pick it up.
- A file the user's request is about changed: say so before starting on it.

## 4. Continue

After the sync report, go straight on with what the user asked for in the same turn. If their
first message was only a greeting or "시작", the sync report is the answer.

## Rules

- Never use `git reset --hard`, `git push --force`, `git clean`, `git checkout -- .`,
  `git stash drop` or `git stash clear` as part of syncing.
- Never commit or discard the user's in-progress work just to make a pull succeed. Ask.
- Pushing is visible to the whole team: push only after the user says yes.
- Run once per session. If this conversation already synced, skip unless the user asks again.
- Keep the report to a few lines. The point is to start work, not to read a git log.
