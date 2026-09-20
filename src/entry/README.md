# Priya entry trial

Open `/entry.html`. This isolated trial reuses the parametric Priya model, motion API, dialogue state and projected speech bubbles. It does not mount the product or write to visitor sessions.

Priya walks in, faces the visitor and presents clickable options. Branches introduce her QA role, demonstrate celebration, or let the visitor choose a feature. Feature choices acknowledge selection and stop at the trial boundary; they do not start a build.

Each selection dispatches a bubbling `entry:choice` CustomEvent from the stage with `detail.choiceId`. The local scene handles the dialogue branches. Use this boundary when connecting feature orchestration later.

Reset interrupts movement/dialogue, performs a short sweep and walk-off, and leaves the page blank with a manual replay control. It is a one-bot trial reset, not the planned full-team application dismantling or backend archival. Run tokens and abort signals prevent interrupted dialogue returning after reset. There is no inactivity reset.
