---
description: Use when editing GNOME Shell extension files (extension.js, lib/, prefs.js). Contains patterns for GObject classes, GLib imports, UI construction, and GNOME-specific conventions.
applyTo: "**/{lib/*.js,extension.js,prefs.js}"
---

# GNOME Shell Extension Patterns

## GObject Classes

Use `GObject.registerClass` for all classes:

```javascript
const MyClass = GObject.registerClass(
  class MyClass extends GObject.Object {
    // class implementation
  }
);
```

## GI Imports

Always import from `gi://`:

```javascript
import St from "gi://St";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import Soup from "gi://Soup";
```

## Resource URLs

Use `resource:///` for GNOME built-in modules:

```javascript
import { Extension, gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
```

## Panel Menu Button

For main extension entry point, extend `PanelMenu.Button`:

```javascript
const Penguin = GObject.registerClass(
  class Penguin extends PanelMenu.Button {
    _init() {
      super._init(0, _("Extension Name"));
      // UI setup
    }
  }
);
```

## St widgets

Common St widgets: `St.BoxLayout`, `St.Label`, `St.Button`, `St.Entry`, `St.ScrollView`, `St.Icon`

## Signals

Connect signals using `connect()` method, not event listeners:

```javascript
this._button.connect('clicked', () => { /* handler */ });
```

## Settings

Access via `extension.settings` passed to `_init`:

```javascript
this._settings = extension.settings;
const value = this._settings.get_string('setting-name');
```