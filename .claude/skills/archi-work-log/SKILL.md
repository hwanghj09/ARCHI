---
name: archi-work-log
description: Keep ARCHI's numbered work logs ("1차 작업.md", "2차 작업.md", …) at the repo root up to date. Use this whenever any work is done on the project (code, assets, floors, skills, commits) so the current round's 현재 상태 is updated before the turn ends, and whenever the user sends "N차 작업 끝" (with the 고칠 점 and 다음 작업 they want), "작업 기록", "작업 정리", "몇 차 작업이야" or asks what was done. Each round has exactly three parts: 현재 상태, 고칠 점, 다음 작업.
---

# ARCHI work log (N차 작업.md)

The user tracks the project in rounds. Each round is one Markdown file at the repo root, named `N차 작업.md`
(`1차 작업.md`, `2차 작업.md`, …). Korean, plain and factual.

## Which file is the current round

1. List `*차 작업.md` at the repo root and take the highest N.
2. If that file's first lines contain the end marker `> N차 작업 끝 (YYYY-MM-DD)`, that round is closed: the next work
   starts a new file `N+1차 작업.md` (create it on the first piece of work, not before).
3. Otherwise file N is the current round; keep writing into it.

## File layout (exactly three parts)

```markdown
# N차 작업

(one line: what this round is about)

## 현재 상태

| N-1차 항목 | N차에서 한 것 | 상태 |
| --- | --- | --- |
| (each 고칠 점 / 다음 작업 item of round N-1) | (what was done for it) | 완료 / 일부 / 남음 |

### 그 밖에 한 것
- (work not listed in round N-1: new features, cleanups, skills, commits/branches, how it was verified)

## 고칠 점
- (filled when the round ends, from the user's "N차 작업 끝" message)

## 다음 작업
- (filled when the round ends, from the user's "N차 작업 끝" message)
```

Round 1 (`1차 작업.md`) predates this skill and keeps its own older layout; do not rewrite it.

## While working: update 현재 상태

- After every piece of work in a turn (before the final reply), update the current round's 현재 상태:
  - Read round N-1's 고칠 점 and 다음 작업. Each item gets one table row: what was done for it this round and a
    status (완료 / 일부 / 남음). Items nobody touched stay as 남음.
  - Anything else done goes under "그 밖에 한 것" (one line each; name files or folders, not long diffs).
  - Say how it was checked (screenshots, tests, Node missing, …) and anything left unverified.
- Keep it current, not a diary: edit rows when the state changes rather than appending repeats.
- Leave 고칠 점 and 다음 작업 of the current round alone (or as short placeholders) until the round ends.
- Never edit a closed round's file except for typos the user asks about.

## When the user sends "N차 작업 끝"

The message comes with the 고칠 점 and 다음 작업 the user wants for that round.
1. Bring 현재 상태 up to date one last time.
2. Write 고칠 점 and 다음 작업 from the user's message: keep every point they made, in their words where possible,
   and add only the concrete detail you know from the code (which floor, file or system is involved). Do not invent
   items they did not send.
3. Add the end marker right under the title: `> N차 작업 끝 (YYYY-MM-DD)`.
4. Reply briefly: the round is closed and the next work goes into `N+1차 작업.md`.
5. Commit or push only if the user asks (follow the repo's branch; archi-sync before pulling).

If the user sends "N차 작업 끝" for a number that is not the current round, ask which round they mean before writing.

## Other skills

Skills that used to say "update 다음작업.md" mean the current `N차 작업.md` now. README and each floor's
`GENERATED.md` still hold the technical details; the work log stays a summary that points to them.
