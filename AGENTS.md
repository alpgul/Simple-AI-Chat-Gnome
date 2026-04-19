# Project Guidelines

## Quick Start

```bash
npm run build      # Compile schemas and pack extension
npm run install-ext  # Install to GNOME
npm run enable     # Enable extension
npm run run        # Test in nested GNOME Shell
npm run clean     # Clean build artifacts
```

## Project Structure

```
├── extension.js      # Main entry - Penguin class (extends PanelMenu.Button)
├── prefs.js         # Extension preferences UI
├── lib/             # Core modules (ES modules)
├── tool-server/     # Python server (web search proxy)
├── schemas/         # GSettings schema XML
├── po/              # Translations (gettext)
├── assets/          # Icons and static assets
├── stylesheet.css   # UI styling
└── md2pango.js     # Markdown → Pango converter
```

## Architecture

- **Main entry**: `extension.js` - Penguin class extending `PanelMenu.Button`
- **Core modules** (`lib/`):
  - `settings.js` - SettingsManager for GNOME schema storage
  - `llmProviders.js` - LLMProvider base class + factory (Anthropic, OpenAI, Gemini, OpenRouter)
  - `chatUI.js` - ChatMessageDisplay handles message rendering
  - `tools.js` - ToolExecutor for function calling (web search, location)
  - `utils.js` - Utilities (shortcuts, formatting, input focus)
  - `constants.js` - MessageRoles, CSS, LLMProviders enums
  - `tooltip.js` - Copy-to-clipboard tooltips

## Code Style

- GObject.registerClass for GNOME classes
- ES modules (`import`/`export`)
- GJS (GI imports from `gi://`)
- Follow [GNOME-specific patterns →](./.github/instructions/gnome-instructions.md)

## Dependencies

- **Runtime**: GJS, GNOME Shell 47+
- **Dev**: ESLint, Prettier

## Conventions

- Settings via GSettings schema (`schemas/`)
- i18n via gettext (`po/` files)
- Panel button icon in `assets/`
- CSS styling in `stylesheet.css`
- Linting: `npm run lint`
- Formatting: `npm run format`