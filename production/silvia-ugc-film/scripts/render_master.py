#!/usr/bin/env python3
"""Render the deterministic Silvia UGC master from locked source assets."""

from __future__ import annotations

import math
import random
import shutil
import subprocess
import wave
from array import array
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "04-source"
EDIT = ROOT / "05-edit"
MOTION = ROOT / "06-motion"
AUDIO = ROOT / "07-audio"
EXPORTS = ROOT / "exports"
WORK = EDIT / "render-work"

WIDTH = 1920
HEIGHT = 1080
FPS = 30
DURATION = 41.0

FONT_REGULAR = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
FONT_BOLD = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")

GREEN = (70, 132, 92)
GREEN_LIGHT = (153, 201, 163)
CREAM = (247, 239, 224)
COCOA = (48, 36, 31)
WHITE = (255, 255, 255)


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def cover(image: Image.Image, width: int = WIDTH, height: int = HEIGHT) -> Image.Image:
    return ImageOps.fit(image.convert("RGB"), (width, height), Image.Resampling.LANCZOS)


def zoomed(image: Image.Image, progress: float, amount: float) -> Image.Image:
    scale = 1.0 + amount * progress
    crop_w = int(image.width / scale)
    crop_h = int(image.height / scale)
    left = (image.width - crop_w) // 2
    top = (image.height - crop_h) // 2
    return image.crop((left, top, left + crop_w, top + crop_h)).resize(
        (image.width, image.height), Image.Resampling.LANCZOS
    )


def encode_frames(path: Path, duration: float, frame_fn) -> None:
    command = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{WIDTH}x{HEIGHT}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "16",
        "-profile:v",
        "high",
        "-level",
        "4.1",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(path),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    frame_count = round(duration * FPS)
    for index in range(frame_count):
        process.stdin.write(frame_fn(index, frame_count).convert("RGB").tobytes())
    process.stdin.close()
    if process.wait() != 0:
        raise subprocess.CalledProcessError(process.returncode, command)


def normalize_video(source: Path, output: Path, duration: float) -> None:
    run(
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(source),
        "-t",
        f"{duration:.3f}",
        "-an",
        "-vf",
        (
            f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,"
            f"crop={WIDTH}:{HEIGHT},fps={FPS},setsar=1,format=yuv420p"
        ),
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "16",
        "-profile:v",
        "high",
        "-level",
        "4.1",
        "-movflags",
        "+faststart",
        str(output),
    )


def title_frame(background: Image.Image, index: int, count: int) -> Image.Image:
    progress = index / max(1, count - 1)
    frame = zoomed(background, progress, 0.018).convert("RGBA")
    shade = Image.new("RGBA", frame.size, (20, 28, 23, 112))
    frame = Image.alpha_composite(frame, shade)
    draw = ImageDraw.Draw(frame)

    fade = min(1.0, progress / 0.18, (1.0 - progress) / 0.12)
    alpha = max(0, min(255, round(255 * fade)))
    draw.rounded_rectangle((190, 280, 1050, 760), radius=42, fill=(21, 29, 24, 185))
    draw.text((260, 342), "CONHEÇA A", font=font(FONT_BOLD, 52), fill=(*CREAM, alpha))
    draw.text((255, 410), "SILVIA", font=font(FONT_BOLD, 132), fill=(*GREEN_LIGHT, alpha))

    baseline = 650
    for bar in range(22):
        phase = progress * math.tau * 3.0 + bar * 0.78
        height = 18 + int(52 * (0.45 + 0.55 * abs(math.sin(phase))))
        x = 265 + bar * 29
        draw.rounded_rectangle(
            (x, baseline - height // 2, x + 11, baseline + height // 2),
            radius=6,
            fill=(*GREEN_LIGHT, alpha),
        )
    return frame.convert("RGB")


def timecard_frame(index: int, count: int) -> Image.Image:
    progress = index / max(1, count - 1)
    frame = Image.new("RGB", (WIDTH, HEIGHT), COCOA)
    background_draw = ImageDraw.Draw(frame)
    for y in range(HEIGHT):
        blend = y / HEIGHT
        row = (
            int(COCOA[0] * (1 - blend) + 34 * blend),
            int(COCOA[1] * (1 - blend) + 56 * blend),
            int(COCOA[2] * (1 - blend) + 42 * blend),
        )
        background_draw.line((0, y, WIDTH, y), fill=row)
    draw = ImageDraw.Draw(frame)
    title = "ALGUNS MINUTOS DEPOIS"
    sub = "A FEW MINUTES LATER"
    title_font = font(FONT_BOLD, 78)
    sub_font = font(FONT_REGULAR, 34)
    title_box = draw.textbbox((0, 0), title, font=title_font)
    sub_box = draw.textbbox((0, 0), sub, font=sub_font)
    draw.text(
        ((WIDTH - (title_box[2] - title_box[0])) / 2, 438),
        title,
        font=title_font,
        fill=CREAM,
    )
    draw.text(
        ((WIDTH - (sub_box[2] - sub_box[0])) / 2, 548),
        sub,
        font=sub_font,
        fill=GREEN_LIGHT,
    )
    active = int(progress * 6) % 3
    for dot in range(3):
        colour = GREEN_LIGHT if dot == active else (92, 98, 86)
        x = WIDTH // 2 - 46 + dot * 46
        draw.ellipse((x, 644, x + 15, 659), fill=colour)
    return frame


def final_frame(background: Image.Image, index: int, count: int) -> Image.Image:
    progress = index / max(1, count - 1)
    frame = zoomed(background, progress, 0.026).convert("RGBA")
    gradient = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gradient_draw = ImageDraw.Draw(gradient)
    for x in range(WIDTH):
        alpha = max(0, int(185 * (1 - x / (WIDTH * 0.72))))
        gradient_draw.line((x, 0, x, HEIGHT), fill=(21, 27, 23, alpha))
    frame = Image.alpha_composite(frame, gradient)
    draw = ImageDraw.Draw(frame)
    fade = min(1.0, progress / 0.18)
    alpha = round(255 * fade)
    draw.text((150, 330), "Silvia", font=font(FONT_BOLD, 118), fill=(*GREEN_LIGHT, alpha))
    draw.text(
        (155, 485),
        "Ela conversa.",
        font=font(FONT_BOLD, 52),
        fill=(*WHITE, alpha),
    )
    draw.text(
        (155, 550),
        "Maria decide.",
        font=font(FONT_BOLD, 52),
        fill=(*WHITE, alpha),
    )
    return frame.convert("RGB")


def render_text_plate(
    output: Path,
    text: str,
    *,
    y: int = 820,
    size: int = 50,
    width: int = 1420,
    align: str = "center",
    background: tuple[int, int, int, int] = (16, 16, 16, 205),
) -> None:
    image = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    selected_font = font(FONT_BOLD, size)

    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        box = draw.textbbox((0, 0), trial, font=selected_font)
        if box[2] - box[0] <= width:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)

    line_height = size + 15
    plate_height = len(lines) * line_height + 44
    left = (WIDTH - width - 80) // 2
    right = WIDTH - left
    draw.rounded_rectangle((left, y, right, y + plate_height), radius=26, fill=background)
    for line_index, line in enumerate(lines):
        box = draw.textbbox((0, 0), line, font=selected_font)
        text_width = box[2] - box[0]
        x = (WIDTH - text_width) // 2 if align == "center" else left + 40
        draw.text(
            (x, y + 20 + line_index * line_height),
            line,
            font=selected_font,
            fill=WHITE,
            stroke_width=1,
            stroke_fill=(0, 0, 0),
        )
    image.save(output)


def render_product_label(output: Path) -> None:
    image = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    selected_font = font(FONT_BOLD, 30)
    text = "VISÃO DO PRODUTO  ·  PRODUCT VISION"
    box = draw.textbbox((0, 0), text, font=selected_font)
    left = WIDTH - (box[2] - box[0]) - 126
    draw.rounded_rectangle((left - 28, 54, WIDTH - 70, 116), radius=20, fill=(20, 27, 23, 210))
    draw.ellipse((left - 5, 77, left + 9, 91), fill=GREEN_LIGHT)
    draw.text((left + 25, 68), text, font=selected_font, fill=WHITE)
    image.save(output)


def synthesize_sfx(output: Path) -> None:
    sample_rate = 48000
    total = int(DURATION * sample_rate)
    samples = [0.0] * total
    rng = random.Random(20260728)
    for index in range(total):
        samples[index] = 0.0008 * rng.uniform(-1.0, 1.0) + 0.0012 * math.sin(
            math.tau * 55 * index / sample_rate
        )

    def tone(start: float, duration: float, frequencies: tuple[float, ...], gain: float) -> None:
        start_index = int(start * sample_rate)
        length = int(duration * sample_rate)
        for offset in range(length):
            envelope = math.exp(-5.0 * offset / max(1, length))
            value = sum(
                math.sin(math.tau * frequency * offset / sample_rate) for frequency in frequencies
            ) / len(frequencies)
            index = start_index + offset
            if index < total:
                samples[index] += gain * envelope * value

    tone(4.20, 0.34, (2700, 3550), 0.16)
    tone(17.15, 0.16, (620, 780), 0.10)
    tone(20.65, 0.22, (780, 1040), 0.11)
    tone(24.30, 0.30, (660, 880, 1100), 0.12)
    tone(27.52, 0.38, (660, 990), 0.16)
    tone(27.98, 0.58, (494, 740), 0.14)
    tone(31.25, 0.24, (82, 116), 0.14)
    tone(33.42, 0.20, (2250, 3100), 0.09)

    with wave.open(str(output), "wb") as target:
        target.setnchannels(2)
        target.setsampwidth(2)
        target.setframerate(sample_rate)
        pcm = array("h")
        for value in samples:
            encoded = max(-32768, min(32767, round(value * 32767)))
            pcm.extend((encoded, encoded))
        target.writeframes(pcm.tobytes())


def main() -> None:
    if WORK.exists():
        shutil.rmtree(WORK)
    WORK.mkdir(parents=True)
    EXPORTS.mkdir(parents=True, exist_ok=True)
    (MOTION / "overlays").mkdir(parents=True, exist_ok=True)
    (AUDIO / "generated-sfx").mkdir(parents=True, exist_ok=True)

    normalized = [
        ("01-S1.mp4", SOURCE / "shots/S1.mp4", 5.0),
        ("02-S2.mp4", SOURCE / "shots/S2.mp4", 9.0),
        ("04-S3.mp4", SOURCE / "shots/S3.mp4", 4.0),
        ("05-proof.mp4", SOURCE / "real-product-proof.mp4", 5.0),
        ("07-S4.mp4", SOURCE / "shots/S4.mp4", 5.0),
        ("08-S5.mp4", SOURCE / "shots/S5.mp4", 5.0),
    ]
    for name, source, duration in normalized:
        normalize_video(source, WORK / name, duration)

    s3_background = cover(Image.open(SOURCE / "start-frames/S3.png"))
    encode_frames(
        WORK / "03-title.mp4",
        3.0,
        lambda index, count: title_frame(s3_background, index, count),
    )
    encode_frames(WORK / "06-timecard.mp4", 2.0, timecard_frame)

    final_still = WORK / "final-still.jpg"
    run(
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-ss",
        "4.85",
        "-i",
        str(SOURCE / "shots/S5.mp4"),
        "-frames:v",
        "1",
        str(final_still),
    )
    final_background = cover(Image.open(final_still))
    encode_frames(
        WORK / "09-final.mp4",
        3.0,
        lambda index, count: final_frame(final_background, index, count),
    )

    sequence = [
        "01-S1.mp4",
        "02-S2.mp4",
        "03-title.mp4",
        "04-S3.mp4",
        "05-proof.mp4",
        "06-timecard.mp4",
        "07-S4.mp4",
        "08-S5.mp4",
        "09-final.mp4",
    ]
    concat_file = WORK / "concat.txt"
    concat_file.write_text("".join(f"file '{WORK / item}'\n" for item in sequence))
    cut_only = EXPORTS / "silvia-cut-only.mp4"
    run(
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(concat_file),
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "16",
        "-profile:v",
        "high",
        "-level",
        "4.1",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(cut_only),
    )

    captions = [
        ("caption-01.png", "I just got home exhausted from work.", 0.15, 2.30),
        (
            "caption-02.png",
            "My daughter, the one who knows these apps, isn't home.",
            4.75,
            9.90,
        ),
        (
            "caption-03.png",
            "I just wanted dinner without relying on anyone.",
            10.00,
            13.80,
        ),
        ("caption-04.png", "That's when I met Silvia.", 14.25, 16.60),
        (
            "caption-05.png",
            "Silvia, grilled salmon with vegetables and an orange juice.",
            16.90,
            21.75,
        ),
        (
            "caption-06.png",
            "Silvia reads it back, shows the total, and waits for yes.",
            21.55,
            26.15,
        ),
        ("caption-08.png", "She talks. I decide.", 38.40, 40.95),
    ]
    overlay_paths: list[Path] = []
    for name, text, _, _ in captions:
        output = MOTION / "overlays" / name
        render_text_plate(output, text)
        overlay_paths.append(output)
    label = MOTION / "overlays/product-vision.png"
    render_product_label(label)
    overlay_paths.append(label)

    inputs = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(cut_only)]
    for path in overlay_paths:
        inputs.extend(["-loop", "1", "-i", str(path)])

    filters: list[str] = []
    previous = "0:v"
    for index, (_, _, start, end) in enumerate(captions, start=1):
        output = f"v{index}"
        filters.append(
            f"[{previous}][{index}:v]overlay=0:0:enable='between(t,{start:.2f},{end:.2f})'[{output}]"
        )
        previous = output
    label_input = len(captions) + 1
    filters.append(
        f"[{previous}][{label_input}:v]overlay=0:0:enable='between(t,28.0,33.0)'[vout]"
    )

    captioned = EXPORTS / "silvia-captioned.mp4"
    run(
        *inputs,
        "-filter_complex",
        ";".join(filters),
        "-map",
        "[vout]",
        "-t",
        f"{DURATION:.3f}",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "16",
        "-profile:v",
        "high",
        "-level",
        "4.1",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(captioned),
    )

    sfx = AUDIO / "generated-sfx/silvia-first-party-sound-bed.wav"
    synthesize_sfx(sfx)

    narration = AUDIO / "maria-narration.wav"
    music = AUDIO / "music/classical-6-jonny-s.mp3"
    master = EXPORTS / "silvia-master-v1.mp4"
    audio_filter = """
[1:a]asplit=8[n1][n2][n3][n4][n5][n6][n7][n8];
[n1]atrim=start=0:end=1.970333,asetpts=PTS-STARTPTS,adelay=200|200[a1];
[n2]atrim=start=2.954750:end=7.978167,asetpts=PTS-STARTPTS,adelay=4750|4750[a2];
[n3]atrim=start=8.717604:end=12.330250,asetpts=PTS-STARTPTS,adelay=10000|10000[a3];
[n4]atrim=start=12.921875:end=14.843542,asetpts=PTS-STARTPTS,adelay=14350|14350[a4];
[n5]atrim=start=15.368021:end=20.217354,asetpts=PTS-STARTPTS,adelay=16900|16900[a5];
[n6]atrim=start=20.714562:end=25.156646,asetpts=PTS-STARTPTS,adelay=21550|21550[a6];
[n7]atrim=start=25.822021:end=27.168958,asetpts=PTS-STARTPTS,adelay=26250|26250[a7];
[n8]atrim=start=27.820271:end=30.175875,asetpts=PTS-STARTPTS,adelay=38400|38400[a8];
[a1][a2][a3][a4][a5][a6][a7][a8]amix=inputs=8:normalize=0:duration=longest,
highpass=f=75,lowpass=f=12500,volume=1.12,atrim=0:41,
aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[voice-sidechain][voice-mix];
[2:a]atrim=start=0:end=41,asetpts=PTS-STARTPTS,
afade=t=in:st=0:d=1.2,afade=t=out:st=37.5:d=3.5,volume=0.12[music];
[music][voice-sidechain]sidechaincompress=threshold=0.015:ratio=8:attack=18:release=280[ducked];
[ducked][voice-mix][3:a]amix=inputs=3:normalize=0:duration=longest:dropout_transition=0,
atrim=0:41,alimiter=limit=0.891,loudnorm=I=-14:TP=-1:LRA=7[aout]
""".replace("\n", "")
    run(
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(captioned),
        "-i",
        str(narration),
        "-i",
        str(music),
        "-i",
        str(sfx),
        "-filter_complex",
        audio_filter,
        "-map",
        "0:v:0",
        "-map",
        "[aout]",
        "-t",
        f"{DURATION:.3f}",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        "48000",
        "-movflags",
        "+faststart",
        str(master),
    )


if __name__ == "__main__":
    main()
