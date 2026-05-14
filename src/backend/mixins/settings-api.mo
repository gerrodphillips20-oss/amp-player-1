import SettingsLib "../lib/settings";

mixin (state : { var settings : ?SettingsLib.Settings }) {

  /// Persist all app state to stable actor state.
  /// Called whenever the user changes any slider or feature toggle.
  public func saveSettings(settings : SettingsLib.Settings) : async () {
    state.settings := ?SettingsLib.clampVolume(settings);
  };

  /// Return the currently saved settings, or null if nothing has been saved yet.
  public query func loadSettings() : async ?SettingsLib.Settings {
    state.settings;
  };

  /// Reset saved settings to null so the app reloads its built-in defaults.
  public func clearSettings() : async () {
    state.settings := null;
  };
};
