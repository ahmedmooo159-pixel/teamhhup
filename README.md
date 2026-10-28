# TeamHub presentation

Plain HTML + CSS + vanilla JS. No build step, no libraries.

## Run
Double-click `index.html` (Chrome or Edge recommended). **Click anywhere** to fill the whole screen (or press **F**). Exit with **F** or **Esc**.
The stage is a fixed 1920x1080 canvas that scales to any screen. There is no header or footer.

## Keys (clicker friendly)
| Key | Action |
|---|---|
| Right / Space / PageDown / Down / Enter | next step |
| Left / PageUp / Up / Backspace | previous step |
| F | fullscreen |
| N | speaker cue ("Next: name - section") |

A click while an animation is playing finishes it instantly and moves on, so no click is lost.
Move the mouse to show the small progress dots (they hide again).

## Add your assets
- `assets/logo/` - logo-full, logo-symbol, logo-wordmark (png/svg). Stand-ins cut from the storyboard are included.
- `assets/screens/` - phone screenshots. After adding a file, list its name in `screenFiles` in `js/content.js`.
- `assets/vedios/` - `thank-you.mp4` (name set in `closingVideo`). Folder name keeps the spelling "vedios".

## Edit content (js/content.js)
Everything editable is in that one file: names (MEMBER_1..10), SUPERVISOR_NAME, UNIVERSITY, FACULTY,
headlines (`*word*` gets the underline), bullet points, the three real pain stats in section 02,
milestones, the section -> screens map, and the emulator scene scripts.

### Emulator scenes
Each step can have `phone` (layout: center, right, rightSmall, focus, coming, hidden) and `scene`
(a list of commands). Coordinates are percent of the screenshot image: `[x, y]`, so they stay
correct on any screenshot. Commands: `swap`, `scroll`, `zoom`, `unzoom`, `moveTo`, `tap`, `tapAt`,
`highlight`, `callout`, `type`, `pulse`, `clear`, `wait`, `boot`. Start every scene with `swap`.

## Deploy
Upload the folder to Vercel, GitHub Pages or any static host. Nothing to build.
