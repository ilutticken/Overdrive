# Overdrive Minigame Implementation Plan

To cover the maximum amount of design space and ensure each new minigame feels distinct, this plan categorizes the minigames outlined in the Game Design Document by their primary input mechanic.

## 1. Mashing / Speed (Implemented)
*Mechanic: Raw speed and physical endurance.*
- **Overload (SPAM!)**: Button-mash a target number of times in a short window. *(Status: Implemented)*

## 2. Precision & Timing
*Mechanic: Waiting for the perfect moment to act. Tests patience and reflex speed.*
- **Melee Defensive Parry (DEFLECT!)**: Concentric arcs closing in on a target zone. The player must tap exactly when the arc intersects the green zone.
- **Social Bluff (INTERRUPT!)**: A scrolling audio waveform with brief physical gaps. The player must tap exactly inside the gap.
- **Heavy Weapons (Hold & Release)**: A power meter that charges and discharges cyclically. The player must press, hold, and release exactly at peak capacity.

## 3. Tracing, Pathing & Swiping
*Mechanic: Drawing paths or making rapid directional swipes.*
- **Node Breach (ROUTE!)**: Trace a continuous, unbroken path from a starting node to a terminal node on a grid without hitting firewall barriers.
- **Getaway / Evasion (THREAD!)**: Top-down view with blast shields closing. Swipe rapidly left and right to navigate through closing gaps.
- **Katanas & Monowires (Vector Slicing)**: Neon slash lines appear. Swipe accurately along the specified orientation lines in rapid succession.

## 4. Sequence Memory & Rhythm
*Mechanic: Recognizing patterns and inputting correct sequences.*
- **Encryption Scan (ISOLATE!)**: A hex sequence header is displayed. Scan a flashing 3x3 array of codes and tap the exact match.
- **Unarmed Combat (The Combo String)**: Left and Right panels with prompt blocks dropping downward. Tap alternating sides in precise rhythmical structures without dropping the chain.

## 5. Continuous Tracking
*Mechanic: Sustained accuracy over time.*
- **SMGs & Smart Pistols (Continuous Tracking)**: A high-frequency target dot maneuvers fluidly across the screen. Hold a finger on top of the dot, maintaining tracking integrity as it moves.

## 6. Device Hardware Sensors
*Mechanic: Utilizing the physical capabilities of modern smartphones.*
- **The Gyroscope (Tilt Calibration)**: Used for long-range targeting or stabilization. Tilt the physical device to keep an erratic indicator perfectly centered for a continuous duration.
- **The Haptic Motor (Blind Vault Crack)**: Screen goes black. Revolve a security dial via touchscreen and feel for a distinct double-buzz vibration pattern to release.
- **Multi-Touch (Pressure Leverage)**: Requires simultaneous twin-finger anchoring and steady mechanical sliding against an onscreen resistance bar.

## 7. Asymmetric / Co-op Puzzles
*Mechanic: Screen-sharing and verbal communication between players.*
- **The Dossier Hack**: The active player has negotiation tactics, while support players have biometric sensor suites displaying the target's weaknesses. The crew must communicate the weaknesses so the active player selects the correct tactics before the timer runs out.

---

### Recommended Next Steps
To best expand the design space, our next implemented minigame should pull from a completely different category than "Mashing".

**Top Candidates for Next Implementation:**
1. **Defensive Parry (Timing)**: Introduces precise timing and intersection logic.
2. **Node Breach (Tracing)**: Introduces drag/touch-move events and spatial pathing.
3. **Encryption Scan (Memory/Observation)**: Introduces visual scanning and matching under time pressure.
