/**
 * Preferences for Penguin AI Chatbot
 *
 * Provides the UI for configuring the extension.
 */

/// <reference path="./global.d.ts" />
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import GLib from "gi://GLib";
import Gdk from "gi://Gdk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import { SettingsKeys, LLMProviders } from "./lib/constants.js";

const keyvalIsForbidden$1 = (keyval) => {
  return [
    Gdk.KEY_Home,
    Gdk.KEY_Left,
    Gdk.KEY_Up,
    Gdk.KEY_Right,
    Gdk.KEY_Down,
    Gdk.KEY_Page_Up,
    Gdk.KEY_Page_Down,
    Gdk.KEY_End,
    Gdk.KEY_Tab,
    Gdk.KEY_KP_Enter,
    Gdk.KEY_Return,
    Gdk.KEY_Mode_switch,
  ].includes(keyval);
};

const isValidAccel$1 = (mask, keyval) => {
  return (
    Gtk.accelerator_valid(keyval, mask) ||
    (keyval === Gdk.KEY_Tab && mask !== 0)
  );
};

// eslint-disable-next-line complexity
const isValidBinding$1 = (mask, keycode, keyval) => {
  return !(
    mask === 0 ||
    (mask === Gdk.ModifierType.SHIFT_MASK &&
      keycode !== 0 &&
      ((keyval >= Gdk.KEY_a && keyval <= Gdk.KEY_z) ||
        (keyval >= Gdk.KEY_A && keyval <= Gdk.KEY_Z) ||
        (keyval >= Gdk.KEY_0 && keyval <= Gdk.KEY_9) ||
        (keyval >= Gdk.KEY_kana_fullstop &&
          keyval <= Gdk.KEY_semivoicedsound) ||
        (keyval >= Gdk.KEY_Arabic_comma && keyval <= Gdk.KEY_Arabic_sukun) ||
        (keyval >= Gdk.KEY_Serbian_dje &&
          keyval <= Gdk.KEY_Cyrillic_HARDSIGN) ||
        (keyval >= Gdk.KEY_Greek_ALPHAaccent &&
          keyval <= Gdk.KEY_Greek_omega) ||
        (keyval >= Gdk.KEY_hebrew_doublelowline &&
          keyval <= Gdk.KEY_hebrew_taf) ||
        (keyval >= Gdk.KEY_Thai_kokai && keyval <= Gdk.KEY_Thai_lekkao) ||
        (keyval >= Gdk.KEY_Hangul_Kiyeog &&
          keyval <= Gdk.KEY_Hangul_J_YeorinHieuh) ||
        (keyval === Gdk.KEY_space && mask === 0) ||
        keyvalIsForbidden$1(keyval)))
  );
};

/**
 * Extension preferences management class
 */
export default class PenguinPreferences extends ExtensionPreferences {
  /**
   * Load current settings from schema
   * @private
   */
  _loadCurrentSettings() {
    // Provider settings
    this.defaultProvider = this._settings.get_string(SettingsKeys.LLM_PROVIDER);

    // API keys
    this.defaultAnthropicKey = this._settings.get_string(
      SettingsKeys.ANTHROPIC_API_KEY,
    );
    this.defaultOpenAIKey = this._settings.get_string(
      SettingsKeys.OPENAI_API_KEY,
    );
    this.defaultGeminiKey = this._settings.get_string(
      SettingsKeys.GEMINI_API_KEY,
    );
    this.defaultOpenRouterKey = this._settings.get_string(
      SettingsKeys.OPENROUTER_API_KEY,
    );

    // Models
    this.defaultModel = this._settings.get_string(SettingsKeys.ANTHROPIC_MODEL);
    this.defaultOpenAIModel = this._settings.get_string(
      SettingsKeys.OPENAI_MODEL,
    );
    this.defaultGeminiModel = this._settings.get_string(
      SettingsKeys.GEMINI_MODEL,
    );
    this.defaultOpenRouterModel = this._settings.get_string(
      SettingsKeys.OPENROUTER_MODEL,
    );

    // Colors
    this.defaultHumanColor = this._settings.get_string(
      SettingsKeys.HUMAN_MESSAGE_COLOR,
    );
    this.defaultLLMColor = this._settings.get_string(
      SettingsKeys.LLM_MESSAGE_COLOR,
    );
    this.defaultHumanTextColor = this._settings.get_string(
      SettingsKeys.HUMAN_MESSAGE_TEXT_COLOR,
    );
    this.defaultLLMTextColor = this._settings.get_string(
      SettingsKeys.LLM_MESSAGE_TEXT_COLOR,
    );

    // Shortcut
    this.defaultShortcut = this._settings.get_strv(
      SettingsKeys.OPEN_CHAT_SHORTCUT,
    )[0];

    // Tool server settings
    this.defaultToolServerUrl = this._settings.get_string(
      SettingsKeys.TOOL_SERVER_URL,
    );
    this.defaultWeatherLat = this._settings.get_double(
      SettingsKeys.WEATHER_LATITUDE,
    );
    this.defaultWeatherLon = this._settings.get_double(
      SettingsKeys.WEATHER_LONGITUDE,
    );
  }

  /**
   * Create the LLM provider selection section
   * @private
   */
  _createProviderSection(group) {
    const adwrow = new Adw.ComboRow({ title: _("Choose LLM Provider:") });
    adwrow.set_tooltip_text(
      _("Select the Large Language Model (LLM) provider you want to use."),
    );
    group.add(adwrow);

    const providerList = new Gtk.StringList();
    providerList.append(_("Anthropic"));
    providerList.append(_("OpenAI"));
    providerList.append(_("Gemini"));
    providerList.append(_("OpenRouter"));

    adwrow.set_model(providerList);
    // Set the default provider
    let defaultProviderIndex = 0; // Default to Anthropic
    const providers = [
      LLMProviders.ANTHROPIC,
      LLMProviders.OPENAI,
      LLMProviders.GEMINI,
      LLMProviders.OPENROUTER,
    ];

    for (let i = 0; i < providers.length; i++) {
      if (providers[i] === this.defaultProvider) {
        defaultProviderIndex = i;
        break;
      }
    }
    adwrow.set_selected(defaultProviderIndex);
    this.provider = adwrow;
  }

  /**
   * Create the API key section
   * @private
   */
  _createAPIKeySection(group) {
    // Anthropic API Key
    this.anthropicApiKey = new Adw.PasswordEntryRow({
      title: _("Anthropic API Key:"),
    });
    this.anthropicApiKey.set_tooltip_text(
      _("Enter your Anthropic API key here."),
    );
    group.add(this.anthropicApiKey);
    this.anthropicApiKey.set_text(this.defaultAnthropicKey);

    const howToAnthropicAPI = new Gtk.LinkButton({
      label: _("Get Anthropic API Key"),
      uri: "https://console.anthropic.com/account/keys",
    });
    this.anthropicApiKey.add_suffix(howToAnthropicAPI);
    // OpenAI API Key
    this.openaiApiKey = new Adw.PasswordEntryRow({
      title: _("OpenAI API Key:"),
    });
    this.openaiApiKey.set_tooltip_text(_("Enter your OpenAI API key here."));
    this.openaiApiKey.set_text(this.defaultOpenAIKey);

    const howToOpenAIAPI = new Gtk.LinkButton({
      label: _("Get OpenAI API Key"),
      uri: "https://platform.openai.com/api-keys",
    });
    this.openaiApiKey.add_suffix(howToOpenAIAPI);
    // Gemini API Key
    this.geminiApiKey = new Adw.PasswordEntryRow({
      title: _("Gemini API Key:"),
    });

    this.geminiApiKey.set_tooltip_text(_("Enter your Gemini API key here."));
    group.add(this.geminiApiKey);
    this.geminiApiKey.set_text(this.defaultGeminiKey);

    const howToGeminiAPI = new Gtk.LinkButton({
      label: _("Get Gemini API Key"),
      uri: "https://makersuite.google.com/app/apikey",
    });
    this.geminiApiKey.add_suffix(howToGeminiAPI);
    // OpenRouter API Key
    this.openrouterApiKey = new Adw.PasswordEntryRow({
      title: _("OpenRouter API Key:"),
    });

    this.openrouterApiKey.set_tooltip_text(
      _("Enter your OpenRouter API key here."),
    );
    group.add(this.openrouterApiKey);
    this.openrouterApiKey.set_text(this.defaultOpenRouterKey);

    const howToOpenRouterAPI = new Gtk.LinkButton({
      label: _("Get OpenRouter API Key"),
      uri: "https://openrouter.ai/settings/keys",
    });
    this.openrouterApiKey.add_suffix(howToOpenRouterAPI);
  }

  /**
   * Create the model selection section
   * @private
   */
  _createModelSection(group) {
    // Anthropic Model
    this.model = new Adw.EntryRow({
      title: _("Anthropic Model:"),
    });
    this.model.set_tooltip_text(
      _("Specify the Anthropic model you want to use. Example: claude-v1.3"),
    );
    group.add(this.model);
    this.model.set_text(this.defaultModel);

    const howToModel = new Gtk.LinkButton({
      label: _("Available Anthropic Models"),
      uri: "https://docs.anthropic.com/claude/docs/models-overview",
    });
    this.model.add_suffix(howToModel);
    // OpenAI Model
    this.openaiModel = new Adw.EntryRow({
      title: _("OpenAI Model:"),
    });
    this.openaiModel.set_tooltip_text(
      _("Specify the OpenAI model you want to use. Example: gpt-3.5-turbo"),
    );
    group.add(this.openaiModel);
    this.openaiModel.set_text(this.defaultOpenAIModel);

    const howToOpenAIModel = new Gtk.LinkButton({
      label: _("Available OpenAI Models"),
      uri: "https://platform.openai.com/docs/models",
    });
    this.openaiModel.add_suffix(howToOpenAIModel);
    // Gemini Model
    this.geminiModel = new Adw.EntryRow({
      title: _("Gemini Model:"),
    });
    this.geminiModel.set_tooltip_text(
      _("Specify the Gemini model you want to use. Example: gemini-1.0-pro"),
    );
    group.add(this.geminiModel);
    this.geminiModel.set_text(this.defaultGeminiModel);

    const howToGeminiModel = new Gtk.LinkButton({
      label: _("Available Gemini Models"),
      uri: "https://ai.google.dev/models/gemini",
    });
    this.geminiModel.add_suffix(howToGeminiModel);
    // OpenRouter Model
    this.openrouterModel = new Adw.EntryRow({
      title: _("OpenRouter Model:"),
    });
    this.openrouterModel.set_tooltip_text(
      _(
        "Specify the OpenRouter model you want to use. Example: meta-llama/llama-3.3-70b-instruct:free",
      ),
    );
    group.add(this.openrouterModel);
    this.openrouterModel.set_text(this.defaultOpenRouterModel);

    const howToOpenRouterModel = new Gtk.LinkButton({
      label: _("Available OpenRouter Models"),
      uri: "https://openrouter.ai/models",
    });
    this.openrouterModel.add_suffix(howToOpenRouterModel);
  }
  /**
   * Create the color selection section
   * @private
   */
  _createColorSection(group) {
    // Set up color dialog
    this.colorDialog = new Gtk.ColorDialog({
      with_alpha: false,
    });

    // Human Message Background Color
    this.humanColorRow = new Adw.ActionRow({
      title: _("Your Message Background Color:"),
      subtitle: _("Select the background color for your messages."),
    });
    this.humanColorRow.set_tooltip_text(
      _("Select the background color for your messages."),
    );
    group.add(this.humanColorRow);
    this.humanColor = new Gtk.ColorDialogButton({
      valign: Gtk.Align.CENTER,
      dialog: this.colorDialog,
    });
    this.humanColorRow.add_suffix(this.humanColor);
    const humanColorGTK = this.humanColor.rgba;
    humanColorGTK.parse(this.defaultHumanColor);
    this.humanColor.set_rgba(humanColorGTK);

    // Human Message Text Color
    this.humanTextColorRow = new Adw.ActionRow({
      title: _("Your Message Text Color:"),
      subtitle: _("Select the text color for your messages."),
    });
    this.humanTextColorRow.set_tooltip_text(
      _("Select the text color for your messages."),
    );
    group.add(this.humanTextColorRow);
    this.humanTextColor = new Gtk.ColorDialogButton({
      valign: Gtk.Align.CENTER,
      dialog: this.colorDialog,
    });
    this.humanTextColorRow.add_suffix(this.humanTextColor);

    const humanTextColorGTK = this.humanTextColor.rgba;
    humanTextColorGTK.parse(this.defaultHumanTextColor);
    this.humanTextColor.set_rgba(humanTextColorGTK);

    // LLM Message Background Color
    this.llmColorRow = new Adw.ActionRow({
      title: _("Chatbot Message Background Color:"),
      subtitle: _("Select the background color for the chatbot's messages."),
    });
    this.llmColorRow.set_tooltip_text(
      _("Select the background color for the chatbot's messages."),
    );
    group.add(this.llmColorRow);
    this.llmColor = new Gtk.ColorDialogButton({
      valign: Gtk.Align.CENTER,
      dialog: this.colorDialog,
    });
    this.llmColorRow.add_suffix(this.llmColor);

    const llmColorGTK = this.llmColor.rgba;
    llmColorGTK.parse(this.defaultLLMColor);
    this.llmColor.set_rgba(llmColorGTK);

    // LLM Message Text Color
    this.llmTextColorRow = new Adw.ActionRow({
      title: _("Chatbot Message Text Color:"),
      subtitle: _("Select the text color for the chatbot's messages."),
    });
    this.llmTextColorRow.set_tooltip_text(
      _("Select the text color for the chatbot's messages."),
    );
    group.add(this.llmTextColorRow);
    this.llmTextColor = new Gtk.ColorDialogButton({
      valign: Gtk.Align.CENTER,
      dialog: this.colorDialog,
    });
    this.llmTextColorRow.add_suffix(this.llmTextColor);
    const llmTextColorGTK = this.llmTextColor.rgba;
    llmTextColorGTK.parse(this.defaultLLMTextColor);
    this.llmTextColor.set_rgba(llmTextColorGTK);
  }

  /**
   * Create the tool server configuration section
   * @private
   */
  _createToolServerSection(group) {
    // Tool Server URL
    this.toolServerUrl = new Adw.EntryRow({
      title: _("Tool Server URL:"),
    });
    this.toolServerUrl.set_tooltip_text(
      _(
        "URL of the local tool server for function calling (weather, search, system info).",
      ),
    );
    group.add(this.toolServerUrl);
    this.toolServerUrl.set_text(this.defaultToolServerUrl);

    // Weather Latitude
    this.weatherLat = new Adw.EntryRow({
      title: _("Weather Latitude:"),
    });
    this.weatherLat.set_tooltip_text(
      _("Latitude coordinate for weather queries."),
    );
    group.add(this.weatherLat);
    this.weatherLat.set_text(this.defaultWeatherLat.toString());

    // Weather Longitude
    this.weatherLon = new Adw.EntryRow({
      title: _("Weather Longitude:"),
    });
    this.weatherLon.set_tooltip_text(
      _("Longitude coordinate for weather queries."),
    );
    group.add(this.weatherLon);
    this.weatherLon.set_text(this.defaultWeatherLon.toString());
  }

  /**
   * Create the keyboard shortcut section
   * @private
   */
  _createShortcutSection(page, group) {
    const adwrowShortcut = new Adw.ActionRow({
      title: _("Open Chat Shortcut:"),
      subtitle: _(
        "Click on the row to set a keyboard shortcut for opening the chat window.",
      ),
    });
    adwrowShortcut.set_tooltip_text(
      _("Set the keyboard shortcut to open the chat window."),
    );
    group.add(adwrowShortcut);
    this.shortcutLabel = new Gtk.ShortcutLabel({
      accelerator: this.defaultShortcut,
      halign: Gtk.Align.CENTER,
      valign: Gtk.Align.CENTER,
    });

    this._settings.connect(
      "changed::" + SettingsKeys.OPEN_CHAT_SHORTCUT,
      () => {
        this.shortcutLabel.set_accelerator(
          this._settings.get_strv(SettingsKeys.OPEN_CHAT_SHORTCUT)[0],
        );
      },
    );
    adwrowShortcut.connect("activated", () => {
      const ctl = new Gtk.EventControllerKey();
      const content = new Adw.StatusPage({
        title: _("New shortcut"),
        icon_name: "preferences-desktop-keyboard-shortcuts-symbolic",
      });
      const editor = new Adw.Window({
        modal: true,
        transient_for: page.get_root(),
        hide_on_close: true,
        width_request: 320,
        height_request: 240,
        resizable: false,
        content,
      });
      editor.add_controller(ctl);
      // eslint-disable-next-line no-shadow
      ctl.connect("key-pressed", (_, keyval, keycode, state) => {
        let mask = state & Gtk.accelerator_get_default_mod_mask();
        mask &= ~Gdk.ModifierType.LOCK_MASK;
        if (!mask && keyval === Gdk.KEY_Escape) {
          editor.close();
          return Gdk.EVENT_STOP;
        }
        if (
          !isValidBinding$1(mask, keycode, keyval) ||
          !isValidAccel$1(mask, keyval)
        ) {
          return Gdk.EVENT_STOP;
        }
        this._settings.set_strv(SettingsKeys.OPEN_CHAT_SHORTCUT, [
          Gtk.accelerator_name_with_keycode(null, keyval, keycode, mask),
        ]);
        editor.destroy();
        return Gdk.EVENT_STOP;
      });
      editor.present();
    });

    adwrowShortcut.add_suffix(this.shortcutLabel);
    adwrowShortcut.activatable_widget = this.shortcutLabel;
  }

  /**
   * Create the save button section
   * @private
   */
  _createSaveSection(group) {
    const adwrowSaveButton = new Adw.ButtonRow({
      title: _("Save Preferences"),
    });

    group.add(adwrowSaveButton);
    adwrowSaveButton.connect("activated", () =>
      this._saveSettings(adwrowSaveButton),
    );
  }

  /**
   * Save settings to schema
   * @private
   */
  _saveSettings(adwrowSaveButton) {
    // Get provider
    const providerList = [
      LLMProviders.ANTHROPIC,
      LLMProviders.OPENAI,
      LLMProviders.GEMINI,
      LLMProviders.OPENROUTER,
    ];
    const selectedProvider = providerList[this.provider.get_selected()];

    // Save provider
    this._settings.set_string(SettingsKeys.LLM_PROVIDER, selectedProvider);

    // Save API keys
    this._settings.set_string(
      SettingsKeys.ANTHROPIC_API_KEY,
      this.anthropicApiKey.get_text(),
    );
    this._settings.set_string(
      SettingsKeys.OPENAI_API_KEY,
      this.openaiApiKey.get_text(),
    );
    this._settings.set_string(
      SettingsKeys.GEMINI_API_KEY,
      this.geminiApiKey.get_text(),
    );
    this._settings.set_string(
      SettingsKeys.OPENROUTER_API_KEY,
      this.openrouterApiKey.get_text(),
    );

    // Save models
    this._settings.set_string(
      SettingsKeys.ANTHROPIC_MODEL,
      this.model.get_text(),
    );
    this._settings.set_string(
      SettingsKeys.OPENAI_MODEL,
      this.openaiModel.get_text(),
    );
    this._settings.set_string(
      SettingsKeys.GEMINI_MODEL,
      this.geminiModel.get_text(),
    );
    this._settings.set_string(
      SettingsKeys.OPENROUTER_MODEL,
      this.openrouterModel.get_text(),
    );

    // Save colors
    this._settings.set_string(
      SettingsKeys.HUMAN_MESSAGE_COLOR,
      `${this.humanColor.get_rgba().to_string()}`,
    );
    this._settings.set_string(
      SettingsKeys.LLM_MESSAGE_COLOR,
      `${this.llmColor.get_rgba().to_string()}`,
    );
    this._settings.set_string(
      SettingsKeys.HUMAN_MESSAGE_TEXT_COLOR,
      `${this.humanTextColor.get_rgba().to_string()}`,
    );
    this._settings.set_string(
      SettingsKeys.LLM_MESSAGE_TEXT_COLOR,
      `${this.llmTextColor.get_rgba().to_string()}`,
    );

    // Save tool server settings
    this._settings.set_string(
      SettingsKeys.TOOL_SERVER_URL,
      this.toolServerUrl.get_text(),
    );
    this._settings.set_double(
      SettingsKeys.WEATHER_LATITUDE,
      Number.parseFloat(this.weatherLat.get_text()) || 52.52,
    );
    this._settings.set_double(
      SettingsKeys.WEATHER_LONGITUDE,
      Number.parseFloat(this.weatherLon.get_text()) || 13.41,
    );

    // Update status
    adwrowSaveButton.set_title(_("Preferences Saved"));

    // Reset status after a delay
    GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3, () => {
      adwrowSaveButton.set_title(_("Save Preferences"));
      return GLib.SOURCE_REMOVE;
    });
  }
  /**
   * Fill the preferences window with the settings UI
   * @param {Adw.PreferencesWindow} window - The preferences window
   */
  fillPreferencesWindow(window) {
    window.set_default_size(900, 700);
    window.search_enabled = true;
    this._settings = this.getSettings();
    const page = new Adw.PreferencesPage();
    const groupsettings = new Adw.PreferencesGroup({ title: _("Settings:") });
    groupsettings.set_description(
      _("Click 'Save Preferences' to apply your changes."),
    );
    const groupshortcut = new Adw.PreferencesGroup({ title: _("Shortcut:") });
    const groupcolors = new Adw.PreferencesGroup({ title: _("Colors:") });
    groupcolors.set_description(
      _("Click 'Save Preferences' to apply your changes."),
    );
    this._loadCurrentSettings();

    // Create all UI sections
    this._createProviderSection(groupsettings);
    this._createAPIKeySection(groupsettings);
    this._createModelSection(groupsettings);
    this._createShortcutSection(page, groupshortcut);
    this._createColorSection(groupcolors);
    this._createToolServerSection(groupsettings);
    this._createSaveSection(groupsettings);

    page.add(groupsettings);
    page.add(groupshortcut);
    page.add(groupcolors);
    window.add(page);
  }
}
