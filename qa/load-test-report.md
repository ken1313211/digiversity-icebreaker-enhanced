# 80-player load test — 2026-09-28

A temporary browser harness ran against the Firebase Realtime Database configured in `firebase-config.js`. It reserved a disposable six-digit game session, joined 80 simulated players in eight waves of ten, kept a full-session listener open for each player, submitted 80 answers concurrently, verified the database counts, then deleted the session. The final cleanup check confirmed the session was gone. The harness was removed after testing so it cannot be accidentally run against the live database from a deployed site.

| Measure | Result |
| --- | ---: |
| Registered and online players | 80 / 80 |
| Total join time, eight waves | 19.27 s |
| 95th-percentile individual join | 2.38 s |
| All 80 listeners saw the full roster | 111 ms after joins |
| Recorded answers and answer records | 80 / 80 |
| Concurrent answer phase | 3.60 s |
| 95th-percentile individual answer | 3.57 s |
| All 80 listeners saw the answer count | 112 ms after writes |
| Firebase errors | 0 |
| Temporary session cleaned up | Yes |

The first run exposed a presence bug: a transaction callback aborted when Firebase supplied an uncached `null` initial value, despite the player existing on the server. `setupPlayerPresence` now checks the player and patches only that player's presence fields and unique connection child. The successful run used the same registration pattern.

This is a real Firebase backend load test from one browser process, not a rehearsal with 80 physical phones or a complete question-and-boss-event playthrough. Network variability, device performance, and the deployment host remain outside this measurement.

A second run held the 80 simulated players online while the real `index.html` join form connected as **player 81** (`QA Real UI`). The actual game showed the connected waiting lobby with no browser console error. The harness independently confirmed that player was online, then recorded all 80 simulated answers and deleted its temporary session. On this run, the eight join waves took 20.11 s (2.61 s individual P95), and the concurrent answer phase took 3.57 s (3.51 s individual P95); there were no Firebase errors.
