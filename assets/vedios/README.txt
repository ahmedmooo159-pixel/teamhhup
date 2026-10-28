Expected Closing Video Files in assets/vedios/
==============================================
(Note: folder name is intentionally spelled "vedios" per project requirements)

Expected file:
- thank-you.mp4 (or thank-you.webm)
- (Alternative: IMG_8849.MP4 as provided)

Configuration:
The filename is configured in a single place in `js/content.js` under `config.closingVideo`.

Behavior on Closing Slide:
- Automatically starts playing with sound upon reaching Section 11 (Closing Coda).
- If the browser policy blocks autoplay with audio, it smoothly falls back to muted autoplay
  and displays a sleek "Tap to unmute" badge.
- If the video file is missing or fails to load, it cleanly and silently falls back to the static
  closing screen without broken players or console errors.
