# Digiversity game redesign plan

## Implementation status

The EY-colored phone and projector UI, power deck, targeting sheet, answer and result states, event animations, and responsive dashboard layout are implemented in the live game. Local join, presence, attack, and buff regressions pass, and the 320 px phone and projector previews were inspected in a browser. A real host plus multiple-device Firebase playthrough is still needed to verify network behavior under a full audience load.

## Goal

Make the existing live quiz feel like a fast, polished game on the projector and on each player's phone. Keep the current question types, Firebase sessions, team play, scoring, and power mechanics. This is a redesign of the working game, not a new marketing site or a separate concept page.

## Design direction

- Use EY charcoal `#2E2E38`, deep charcoal `#1A1A24`, EY yellow `#FFE600`, and white as the foundation. Use the existing red, blue, green, and yellow answer colors only to identify choices; never rely on color alone.
- Give the game a distinct visual language: angled highlights, strong typography, high-contrast score and timer displays, tactile controls, and subtle data/grid motifs. Reduce the current mix of glass panels, glow, emojis, and inline styles.
- Use motion to explain game events: a player joins, an answer locks, points are awarded, a rank changes, or a power lands. Avoid constant decorative animation during questions.
- Preserve legibility on a projected screen and thumb-friendly controls on a 320–430 px phone. Support keyboard focus and reduced motion.

## Player journey

1. **Join and lobby:** Make the PIN form more direct, show connection and team status clearly, and make a successful join feel immediate. In the waiting room, show nickname, team, and a compact how-to-play entry point. A player arriving should briefly animate into the host roster.
2. **Question screen:** Keep the timer, question, answer choices, points, and powers visible in a clear order. Make answer tiles feel pressable and show a single decisive locked state after selection. Adapt the same shell to multiple choice, dashboard tapping, text, number, poll, and jumbled questions.
3. **After answering:** Show an immediate answer receipt with points earned, streak, and status while waiting for the host. Keep any applicable power controls available without obscuring the receipt.
4. **Results and leaderboard:** Reveal the correct answer, score change, rank movement, and next round state as a short sequence. Give the player one clear place to see their standing.

## Power-up experience

- Replace emoji-only inventory slots with compact, labeled power cards. Each card shows the effect, whether it is ready, queued, active, or spent, and the action it will take.
- Separate **buffs** (shield, double shield, speed boost, multiplier) from **attacks** (blur, shuffle, glitch, emoji flood, redacted, steal, freeze) through label and icon as well as color.
- Use a focused target sheet for attacks: player/team name, effect, timing, and one clear **Use power** action. Close the sheet with an explicit queued or launched state. Keep team donation and pooled powers in the same visual system.
- Give incoming powers a brief named impact cue and a persistent, readable effect indicator with an undo/clear instruction where applicable. Keep answer controls and the timer usable whenever the game rules allow them.
- Audit the power event path while implementing the UI. The current `executeAttack` writes to `queuedAttacks` even during a question, so the plan includes aligning the actual send timing with the label shown to players. Avoid consuming an item if its attack write fails; prevent duplicate activation from rapid taps.

## Host and projector journey

- **Lobby:** Make the PIN and QR code the focal point, with a readable online player count, joined/offline summary, team setup, and roster. Animate roster changes once rather than continuously.
- **Question:** Establish a strong question hierarchy with the timer and answer progress visible from across a room. Give the host controls a separate area so players do not mistake them for game content.
- **Results:** Use answer reveals and chart/bar growth tied to real response counts. Keep labels and exact numbers visible.
- **Leaderboard:** Give rank changes a short, understandable transition. Keep team scores, hype, and special events present without crowding the ranking.
- The presenter sandbox should reuse the final phone layout so it remains a faithful preview.

## Implementation sequence

1. **Inventory and structure:** Identify the shared elements in `index.html`, `style.css`, and `app.js`; consolidate repeated player and host UI patterns. Record visual states for lobby, active question, answered, results, and power effects before replacing styles.
2. **Foundation:** Add reusable design tokens and components in `style.css`, remove conflicting late overrides, and apply the new typography, spacing, buttons, focus states, and responsive rules.
3. **Phone screens:** Update join, lobby, classic question, dashboard question, waiting, results, and leaderboard markup and rendering. Preserve existing element IDs used by game logic or update their references together.
4. **Powers:** Rebuild inventory and target selection, then wire status feedback to the real Firebase lifecycle. Review queued and live attack behavior, shield blocks, effect cleanup, donation, and team pools.
5. **Projector screens:** Update lobby, question, results, and leaderboard. Use the same event and color language as the phone screens.
6. **Motion and polish:** Add short event-driven transitions, cap particles and effects on lower-powered phones, and provide a complete `prefers-reduced-motion` path. Remove obsolete CSS and dead presentation code.

## Validation

- Test a full game with host plus multiple phones: joins, reconnects, online count, several question types, scoring, results, and next round transitions.
- Test each power as sender and recipient, including shielded targets, queued attacks, failed writes, and team pool use.
- Check 320 px, 390 px, tablet, and projector layouts; ensure no clipped controls or hidden question content. Check keyboard use, contrast, and reduced motion.
- Run the existing join and presence regressions, JavaScript syntax checks, and browser smoke checks after each functional stage.

## Done when

The projector and phone views read as one EY-branded game; players can answer and use powers without guessing their state; host controls remain clear; every existing question type and game feature still works; and the full multiplayer flow passes the checks above.
