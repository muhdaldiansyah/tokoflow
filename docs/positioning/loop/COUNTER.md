# Cycle counter

**Authoritative source:** `runs/.loop-counter` (binary, wrapper-managed).
This file is a human-readable mirror — current as of last cycle commit.

```
last_completed_cycle: 0
next_cycle: 1
next_mode: HYPOTHESIZE_RADICAL
```

> The wrapper increments `runs/.loop-counter` after each cycle exits. Read `$LOOP_CYCLE` env var inside a cycle to know your cycle number.
