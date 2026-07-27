export async function transcribePtBr(input: {
  audio: Uint8Array;
  mimeType: string;
  apiKey: string;
  timeoutMs?: number;
}): Promise<{
  text: string;
  provider: "elevenlabs";
  elapsedMs: number;
}> {
  const started = Date.now();
  const form = new FormData();
  const audio = new Uint8Array(input.audio.byteLength);
  audio.set(input.audio);
  form.append("model_id", "scribe_v2");
  form.append("language_code", "por");
  form.append(
    "file",
    new Blob([audio.buffer], { type: input.mimeType }),
    "voice.ogg",
  );
  const response = await fetch(
    "https://api.elevenlabs.io/v1/speech-to-text",
    {
      method: "POST",
      headers: { "xi-api-key": input.apiKey },
      body: form,
      signal: AbortSignal.timeout(input.timeoutMs ?? 12_000),
    },
  );
  if (!response.ok) throw new Error(`transcription_${response.status}`);
  const body = await response.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) throw new Error("transcription_empty");
  return {
    text,
    provider: "elevenlabs",
    elapsedMs: Date.now() - started,
  };
}
