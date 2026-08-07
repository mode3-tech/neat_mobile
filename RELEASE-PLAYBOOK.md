# Release Playbook

Internal. What to do each time a build goes out, and how to decide whether users get
nudged, forced, or left alone.

---

## The decision

After a production build is live on Play, pick one:

| | When | Action | User sees |
|---|---|---|---|
| **Silent** | Routine native change. No urgency. **This is the default.** | Nothing — don't touch the backend | Nothing. Play auto-updates them over a day or two |
| **Nudge** | You're announcing the feature, or draining the old population ahead of a force you know is coming | Set `android.latest_build` to the new versionCode | Dismissible "Update available" sheet — **Update Now** / **Later** |
| **Force** | Old build is unsafe, broken, or incompatible | Set `android.min_build` to the new versionCode | Non-dismissible "Update required" sheet over the app — **Update Now** only |

### Force is for these, and not much else

- Security vulnerability or a compromised build
- A bug that can move money wrongly or expose data
- A backend change the old app can't handle
- A compliance deadline (e.g. CBN liveness)

Rule of thumb: **force when leaving them alone is riskier than annoying them.**

### Don't nudge on every release

Play's silent auto-update already moves most users for free. If you prompt every time,
users learn to tap **Later** reflexively — the nudge stops working and the only tool left
is the hard gate, which is the escalation you built this to avoid.

---

## Per-release routine

1. `eas build --profile production` → note the versionCode
2. `eas submit --profile production` → Play review
3. Confirm it's live in **Play Console → Production → Releases**
4. **Decide: silent, nudge, or force** (table above)
5. If nudge or force, message the backend with the exact number:
   > "Build 11 is live. Set `android.latest_build` to 11."
   >
   > or, for a force:
   >
   > "Build 12 is live. Set `android.latest_build` to 12 **and** `android.min_build` to 12."
6. If it's a notable release, trigger the broadcast push
7. Verify on a real device before walking away from a force — a wrong `min_build` locks
   out everyone below it. It must be a **production** build: the gate is off on preview and
   internal APKs (see below), so a force can't be confirmed on one.

---

## Guardrails

**`min_build` should lag well behind and move rarely.** It means "the oldest build we're
still willing to be responsible for," not "the current build." If you find yourself moving
both values together every release, the soft prompt has stopped existing and you've
collapsed back to a single hard gate.

**Soft first, then force.** A hard gate landing on 70% of users at once is its own incident
— support tickets and one-star reviews. Nudge for a few weeks first and the same gate lands
on 5% as a non-event.

**A hard block costs the user something real.** Mid-transaction, 2% battery, metered data,
no storage space. In this market that's a genuine barrier. Spend it only when the
alternative is worse.

**The gate only governs builds that contain it.** Shipped in build 8, so it can never
prompt anyone on 7 or below — those users move only via Play auto-update. Every force you
issue reaches build 8+ and nobody else.

**Production builds only.** The gate runs when `EXPO_PUBLIC_APP_VARIANT` is `production` —
so never in development, and never on preview or internal APKs. Testers are rebuilt onto a
fresh APK for every change, and blocking one would push them to Play and overwrite their
test build with production. Consequence: a tester reporting "I never see the update prompt"
is correct behaviour, not a bug, and a force can only be verified on a production build.

**It fails open by design.** If `GET /app/version` errors or times out, the app opens
normally with no gate. So a backend outage doesn't lock users out — it silently switches
the gate off, exactly when you'd need it. Check the endpoint is healthy before relying on a
force.

---

## Reference

- Values live on the backend, editable without a deploy. Never in app source — that would
  need a store release to change, defeating the point.
- Gate on `versionCode`, not `version`. `autoIncrement` bumps versionCode every build while
  `version` stays `1.0.0`, so the version name can't tell two releases apart.
- Current production versionCode: **7** (gate ships in 8). Check with
  `npx eas-cli build:version:get --platform android --profile production`.
- Android `versionCode` and iOS `buildNumber` are unrelated sequences and can never share a
  threshold. See `THINGS-TO-DO-BEFORE-APP-STORE.md`.
