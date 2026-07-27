# Live iFood gateway decision

Status: intentionally not deployed for the hackathon demo.

The reviewed iFood consumer connector relies on private consumer-session
credentials and an unofficial API. Silvia has no authorized credentials for
that interface, and iFood's official public API is aimed at merchant
operations rather than consumer checkout.

The shipped `LiveConnector` therefore fails closed when credentials are
absent, requires HTTPS and a shared gateway secret, bounds requests to ten
seconds, validates responses, and keeps checkout disabled by default. The
complete contest path uses `DemoConnector` and labels every receipt as a
demonstration.

Revisit this only with an authorized commerce partner, a written API
agreement, sandbox credentials, and the same confirmation and exactly-once
tests used by the demo connector.
