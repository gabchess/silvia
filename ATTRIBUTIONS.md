# Attributions

## iFood MCP research

Silvia's disabled live-connector boundary was informed by
[AriOliv/ifood-mcp](https://github.com/AriOliv/ifood-mcp) at commit
[`887c73c9a01701d3fa8e5d15ea75e4b53bacbc6a`](https://github.com/AriOliv/ifood-mcp/commit/887c73c9a01701d3fa8e5d15ea75e4b53bacbc6a).
The repository is MIT licensed; its license is preserved in
`LICENSES/ifood-mcp-MIT.txt`.

No source file from that project is shipped in Silvia. We reviewed its
consumer-session approach and then wrote a smaller connector boundary for
this demo. The iFood integration is not enabled or described as official.

## Platform APIs

- Base44 CLI and SDK provide the app, entities, auth, functions, AI agent,
  real-time data, and deployment target.
- Meta's WhatsApp Cloud API documentation informed webhook signature checks,
  media download, and button payloads.
- ElevenLabs Scribe v2 is the configured Portuguese transcription provider.
