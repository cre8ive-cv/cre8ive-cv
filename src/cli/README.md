# Resume Generator CLI

Minimal CLI that turns a JSON resume payload into a themed HTML (and optional PDF) bundle. The script lives in `src/cli/index.js`, so the commands below assume you're running `node index.js` from that directory (which keeps the relative paths straightforward).

## Run Commands
```bash
# default: generates every theme/color combo using src/cli/sample_resume_config.json
node index.js

# single theme + color
node index.js --theme modern --color blue

# supply a custom resume file and optional photo (--theme and --color flags overwrite values from JSON)
node index.js --input sample_resume_config.json --photo sample_resume_image.png --theme corpo --color green
```

## Options & Defaults
| Flag | Default | Details |
| --- | --- | --- |
| `--input <path>` | `<repo>/src/cli/sample_resume_config.json` | JSON source. Relative paths are resolved from `src/cli`. First positional argument is treated as `--input` for backward compatibility. |
| `--output <dir>` | `<repo>/src/cli/output` | Output root (next to the CLI). Relative paths (e.g. `--output results`) are resolved from `src/cli` and created automatically. CLI writes `output/<theme>/html` and `output/<theme>/pdf`. |
| `--theme <name>` | `null` | Theme slug from `src/core/themes` (`classic`, `corpo`, `default`, `modern`). Required unless `--generateAll` is active. Monochromatic themes ignore `--color`. |
| `--color <name>` | `null` | Palette name from `src/core/colors` (`blue`, `cyan`, `green`, `grey`, `magenta`, `orange`, `red`, `violet`, `yellow`). Required when targeting a theme with colors. |
| `--generateAll` | `true` when no `--theme`/`--color`, otherwise `false` | When enabled, iterates through every theme and color combination found in the repo. |
| `--photo <path>` | `null` | Optional JPG/PNG photo path. Relative values are resolved from `src/cli`. If omitted, CLI checks `src/cli/sample_resume_image.png`, `src/cli/sample_resume_image.jpg`, `assets/sample_image.jpg`, `sample_image.jpg`, `assets/photo.jpg`, then `photo.jpg`. Falls back to images embedded as `photoBase64` inside the JSON. |
| `--htmlOnly` | `false` | Produces only HTML files and skips PDF generation. |

## Data & Sections
- The JSON `_meta.selectedTheme` / `_meta.selectedColor` fields are used when the corresponding CLI flags are omitted, so `node index.js --input my.json` will honor the theme/color stored in your resume file.
- The JSON `_meta.customSectionNames` map lets you rename non-standard sections; provide it at the root of the resume file to propagate to every template.
- Embedding a `photoBase64` field in the JSON overrides `--photo` and file-system lookups.

## Dev Notes
- Color-aware themes require at least one color file in `src/core/colors`; the CLI fails fast if none exist.
- Errors exit with non-zero status so pipelines can bail early.
- Logs echo resolved paths and generated artifacts—check the console for quick diagnostics. Relative paths are always interpreted from `src/cli` so commands behave consistently no matter where they are executed.
