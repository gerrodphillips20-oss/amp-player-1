import SettingsLib "lib/settings";
import SettingsMixin "mixins/settings-api";

actor {
  let state = { var settings : ?SettingsLib.Settings = null };
  include SettingsMixin(state);
};

