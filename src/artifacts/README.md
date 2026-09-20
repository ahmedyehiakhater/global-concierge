# Product and feature artefacts

The catalogue contains Global Concierge product strategy and per-feature specifications,
not documentation of the animated cast. Each role has a product-level document and a
login/workspace feature document. Product includes an extensive master brief and a
separate feature PRD; Design includes actual component previews; Engineering records
product behaviour/boundaries; QA distinguishes authored cases from observed evidence;
Delivery records scope, risks, the staged schedule and the absence of an approved budget.

`ArtifactProduction` publishes documents incrementally during the scene, records status
history and actual check outcomes, and notifies the reusable viewer. Runtime results
never mutate authored templates. Unexecuted manual cases remain Not run. The local
session-storage record is keyed by visitor-session ID and archived before manual reset;
it is a browser-local artefact history, not a backend document-management service.

`createArtifactViewer({ production, onOpen, onClose, onReset })` accepts an optional
production store. With a store it shows only published documents from that run. Without
one, `/artifacts.html` shows the complete authored draft library. Future feature scenes
must register their own complete documents in the catalogue and publish them at their
production beats; they must not pre-mark later work as released.
