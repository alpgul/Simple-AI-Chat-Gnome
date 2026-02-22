/**
 * Penguin AI Chatbot for GNOME
 *
 * A GNOME Shell extension that integrates AI chatbot capabilities
 * with support for multiple LLM providers.
 *
 * Based on work by contributors to:
 * https://github.com/martijara/Penguin-AI-Chatbot-for-GNOME
 */

/// <reference path="./global.d.ts" />
import GObject from "gi://GObject";
import St from "gi://St";
import GLib from "gi://GLib";
import Clutter from "gi://Clutter";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { SettingsManager } from "./lib/settings.js";
import { LLMProviderFactory } from "./lib/llmProviders.js";
import { ChatMessageDisplay } from "./lib/chatUI.js";
import {
  setupShortcut,
  removeShortcut,
  formatString,
  focusInput,
} from "./lib/utils.js";
import { MessageRoles, CSS } from "./lib/constants.js";
import { hideTooltip, showTooltip } from "./lib/tooltip.js";

/**
 * Main extension class that handles the chat interface
 */
const Penguin = GObject.registerClass(
  class Penguin extends PanelMenu.Button {
    /**
     * Initialize the Penguin chat interface
     * @param {object} params - Initialization parameters
     */
    _init(extension) {
      super._init(0, _("Penguin: AI Chatbot"));

      this._extension = extension;
      this._settingsManager = new SettingsManager(this._extension.settings);
      this._clipboard = this._extension.clipboard;
      this._UI = this._extension.UI;

      // Load settings
      this._loadSettings();

      // Initialize UI elements
      this._initializeUI();

      // Set up keyboard shortcut
      this._bindShortcut();

      // Set up timeout handles
      this._timeoutResponse = null;
      this._timeoutFocusInputBox = null;

      // Initialize history
      this._history = [];
      this._loadHistory();
      // middle click opens settings
      this.connect("button-press-event", (actor, event) => {
        if (event.get_button() === Clutter.BUTTON_MIDDLE) {
          this._openSettings();
          this.menu.close();
        }
        this._chatLabel?.set_text(
          this._settingsManager.getLLMProvider().toUpperCase(),
        );
        return Clutter.EVENT_STOP;
      });
    }

    /**
     * Initialize the UI elements
     * @private
     */
    _initializeUI() {
      // Add icon to the top bar
      this.add_child(
        new St.Icon({
          icon_name: "Penguin: AI Chatbot",
          style_class: "icon",
        }),
      );

      // Create chat container
      this._chatBox = new St.BoxLayout({
        vertical: true,
        style_class: CSS.POPUP_MENU_BOX,
        style: "text-wrap: wrap",
      });

      // Create chat message display
      const styleSettings = this._settingsManager.getStyleSettings();
      this._chatDisplay = new ChatMessageDisplay(
        this._chatBox,
        styleSettings,
        () => this._openSettings(),
        this._UI,
      );
      this._chatDisplay.setClipboard(this._clipboard);
      // create chat label
      this._chatLabel = new St.Label({
        text: this._settingsManager.getLLMProvider().toUpperCase(),
        style: "font-weight: bold; font-size: 14px; margin-bottom: 10px;",
      });
      // Create chat input
      this._chatInput = new St.Entry({
        hint_text: this._UI.CHAT_INPUT_PLACEHOLDER,
        can_focus: true,
        track_hover: true,
        style_class: CSS.MESSAGE_INPUT,
      });
      this._chatDisplay.setChatInput(this._chatInput);

      // Set up input event handler
      this._chatInput.clutter_text.connect("activate", () =>
        this._handleUserInput(),
      );

      // Create new conversation button
      this._newConversationButton = new St.Button({
        style:
          "width: 16px; height:16px; margin-right: 15px; margin-left: 10px'",
        child: new St.Icon({
          icon_name: "tab-new-symbolic",
          style: "width: 30px; height:30px",
        }),
      });

      // Set up new conversation button event handlers
      this._newConversationButton.connect("clicked", () =>
        this._handleNewConversation(),
      );
      this._newConversationButton.connect("enter-event", () =>
        this._handleNewConversationEnter(),
      );
      this._newConversationButton.connect("leave-event", () =>
        this._handleNewConversationLeave(),
      );

      // Create bottom input area
      const entryBox = new St.BoxLayout({
        vertical: false,
        style_class: CSS.POPUP_MENU_BOX,
      });

      entryBox.add_child(this._chatInput);
      entryBox.add_child(this._newConversationButton);

      // Create scrollable chat view
      this._chatView = new St.ScrollView({
        enable_mouse_scrolling: true,
        style_class: CSS.CHAT_SCROLLING,
        reactive: true,
      });
      this._chatView.set_child(this._chatBox);

      // Create main layout
      const layout = new St.BoxLayout({
        vertical: true,
        style_class: CSS.POPUP_MENU_BOX,
      });
      layout.add_child(this._chatLabel);
      layout.add_child(this._chatView);
      layout.add_child(entryBox);

      // Add to popup menu
      const popUp = new PopupMenu.PopupMenuSection();
      popUp.actor.add_child(layout);
      this.menu.addMenuItem(popUp);

      // Setup menu open/close handler
      this.menu.connect("open-state-changed", (self, open) => {
        if (open) {
          this._focusInputBox();
        }
      });
    }

    /**
     * Load settings and connect to changes
     * @private
     */
    _loadSettings() {
      this._settingsManager.connectToChanges(() => {
        this._chatDisplay.updateStyleSettings(
          this._settingsManager.getStyleSettings(),
        );
      });
    }

    /**
     * Handle user message input
     * @private
     */
    _handleUserInput() {
      if (this._timeoutResponse) {
        GLib.Source.remove(this._timeoutResponse);
        this._timeoutResponse = null;
      }

      const input = this._chatInput.get_text();
      if (!input || input === this._UI.THINKING_TEXT) {
        return;
      }

      // Display user message
      this._chatDisplay.displayMessage(MessageRoles.USER, input);

      // Add to history
      this._history.push({
        role: MessageRoles.USER,
        content: input,
      });

      // Send to LLM
      this._sendToLLM();

      // Disable input during processing
      this._chatInput.set_reactive(false);
      this._chatInput.set_text(this._UI.THINKING_TEXT);
    }

    /**
     * Handle new conversation button click
     * @private
     */
    _handleNewConversation() {
      if (
        this._chatInput.get_text() === this._UI.NEW_CONVERSATION_TEXT ||
        this._chatInput.get_text() !== this._UI.THINKING_TEXT
      ) {
        // Clear history
        this._history = [];
        this._settingsManager.setHistory([]);
        this._chatDisplay.clear();
      } else {
        this._chatDisplay.displayMessage(
          MessageRoles.ASSISTANT,
          this._UI.NEW_CONVERSATION_WHILE_THINKING,
        );
      }
    }

    /**
     * Handle mouse enter on new conversation button
     * @private
     */
    _handleNewConversationEnter() {
      showTooltip(this._UI.NEW_CONVERSATION_TOOLTIP);
    }

    /**
     * Handle mouse leave on new conversation button
     * @private
     */
    _handleNewConversationLeave() {
      hideTooltip();
    }

    /**
     * Load chat history
     * @private
     */
    _loadHistory() {
      this._chatInput.set_reactive(false);
      this._chatInput.set_text(this._UI.LOADING_HISTORY);

      this._history = this._settingsManager.getHistory();
      this._chatDisplay.loadHistory(this._history);

      this._chatInput.set_reactive(true);
      this._chatInput.set_text("");
      this._focusInputBox();
    }

    /**
     * Send the current conversation to the LLM
     * @private
     */
    _sendToLLM() {
      const provider = this._settingsManager.getLLMProvider();
      const apiKey = this._settingsManager.getApiKey(provider);
      const model = this._settingsManager.getModel(provider);

      // Prepare tool configuration
      const toolConfig = {
        serverUrl: this._settingsManager.getToolServerUrl(),
        weatherLat: this._settingsManager.getWeatherLatitude(),
        weatherLon: this._settingsManager.getWeatherLongitude(),
      };

      const llmProvider = LLMProviderFactory.createProvider(
        provider,
        apiKey,
        model,
        toolConfig,
      );

      llmProvider.sendRequest(this._history, (error, response) => {
        if (error) {
          let errorMessage;
          if (error.message?.includes("HTTP error")) {
            errorMessage = formatString(UI.ERROR_API_KEY, provider);
          } else {
            errorMessage = formatString(UI.ERROR_GENERIC, error.toString());
          }

          this._chatDisplay.displayError(errorMessage, true);
          logError(error);
        } else {
          // Display the response
          this._chatDisplay.displayMessage(MessageRoles.ASSISTANT, response);

          // Add to history
          this._history.push({
            role: MessageRoles.ASSISTANT,
            content: response,
          });

          // Save updated history
          this._settingsManager.setHistory(this._history);
        }

        // Re-enable input
        this._chatInput.set_reactive(true);
        this._chatInput.set_text("");
        this._focusInputBox();
      });
    }

    /**
     * Set up keyboard shortcut
     * @private
     */
    _bindShortcut() {
      const shortcut = this._settingsManager.getOpenChatShortcut();
      setupShortcut(
        shortcut,
        this._extension.settings,
        this._toggleChatWindow.bind(this),
      );
    }

    /**
     * Remove keyboard shortcut
     * @private
     */
    _unbindShortcut() {
      removeShortcut();
    }

    /**
     * Focus the input box after a short delay
     * @private
     */
    _focusInputBox() {
      if (this._timeoutFocusInputBox) {
        GLib.Source.remove(this._timeoutFocusInputBox);
      }

      this._timeoutFocusInputBox = focusInput(this._chatInput);
    }

    /**
     * Toggle the chat window open/closed
     * @private
     */
    _toggleChatWindow() {
      if (this.menu.isOpen) {
        this.menu.close();
      } else {
        this.menu.open();
        this._focusInputBox();
      }
    }

    /**
     * Open extension settings
     * @private
     */
    _openSettings() {
      this._extension.openSettings();
    }

    /**
     * Clean up resources
     */
    destroy() {
      if (this._timeoutResponse) {
        GLib.Source.remove(this._timeoutResponse);
        this._timeoutResponse = null;
      }

      if (this._timeoutFocusInputBox) {
        GLib.Source.remove(this._timeoutFocusInputBox);
        this._timeoutFocusInputBox = null;
      }

      this._unbindShortcut();
      this._settingsManager.disconnectAll();
      this._chatDisplay.destroy();

      hideTooltip();

      super.destroy();
    }
  },
);

/**
 * Extension entry point class
 */
export default class PenguinExtension extends Extension {
  enable() {
    // UI text constants
    const UI = {
      CHAT_INPUT_PLACEHOLDER: _("Chat with me"),
      THINKING_TEXT: _("I am thinking..."),
      NEW_CONVERSATION_TEXT: _("Create a new conversation (Deletes current)"),
      COPY_TEXT_HINT: _("Click on text to copy"),
      LOADING_HISTORY: _("Loading history..."),
      ERROR_API_KEY: _(
        "Hmm, an error occurred when trying to reach out to the assistant.\nCheck your API key and model settings for {0} and try again. It could also be your internet connection!",
      ),
      ERROR_GENERIC: _(
        "We are having trouble getting a response from the assistant. \nHere is the error - if it helps at all: \n\n{0} \n\nSome tips:\n\n- Check your internet connection\n- If you recently changed your provider, try deleting your history.",
      ),

      SETTINGS_BUTTON_TEXT: _("Click here to go to settings"),
      PREFERENCES_SAVED: _("Preferences Saved"),
      SAVE_PREFERENCES: _("Save Preferences"),
      SAVE_PREFERENCES_HINT: _(
        "Click 'Save Preferences' to apply your changes.",
      ),
    };
    this._penguin = new Penguin({
      settings: this.getSettings(),
      openSettings: this.openPreferences,
      clipboard: St.Clipboard.get_default(),
      uuid: this.uuid,
      UI: UI,
    });

    Main.panel.addToStatusArea(this.uuid, this._penguin);
  }

  disable() {
    this._UI = null;
    this._penguin.destroy();
    this._penguin = null;
  }
}
