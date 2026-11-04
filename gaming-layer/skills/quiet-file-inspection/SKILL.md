---
name: quiet-file-inspection
description: "How to read and check large files without flooding the terminal — use when a bash command's output comes back as a huge scrollback dump instead of just its results."
---

# Quiet file inspection (flooded terminal workaround)

## Symptom
Every `Bash` command in this environment returns the **entire terminal scrollback** before the actual result. A `sed -n '140,230p' big.txt` returns ~11 KB of echoed history plus the lines you wanted. Budget is burned, and real output gets lost in the noise.

## Procedure
1. **Do not use bash (cat/sed/head/tail/awk) to read files.** Use the file tools instead:
   - `ReadFile` with `offset` + `limit` for a line range (clean, no echo).
   - `GrepTool` for content search; it returns matching file paths, not a dump.
   - `GlobTool` to find files by name.
2. **When bash is needed, make its output tiny:**
   - `grep -c pattern file` (a count, one line) instead of printing matches.
   - `grep -n '^## ' file` to get a table of contents as line numbers, then `ReadFile` the ranges you care about.
   - Chain checks with `&&` so one noisy call replaces several.
   - `wc -lwc file` for size, `ls` for existence.
3. **Long jobs:** start the command, then poll with `action="status"` rather than re-issuing it.
4. If output is truncated or garbled, re-run the same check with a count instead of a listing — never re-run a dump to "see it again".

## Gotchas
- `GrepTool` with a `^#{1,3} ` style pattern can miss markdown headings; `grep -n '^## '` in bash is reliable (and its one-line-per-heading output is small).
- `MultiEdit`/`EditFile` echo a snippet of the changed region, which is usually enough to confirm an edit — do not also `cat` the file to verify.
- Keep scratch files out of `/home/team/shared`; use `~` for anything temporary.
