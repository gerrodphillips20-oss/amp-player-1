import Types "../types/settings";

module {
  public type Settings = Types.Settings;

  /// Validate that volume is within the allowed 1–100 range.
  /// Returns the settings unchanged if valid, or a clamped copy if out of range.
  public func clampVolume(s : Settings) : Settings {
    let v = if (s.volume < 1) 1 else if (s.volume > 100) 100 else s.volume;
    { s with volume = v };
  };
};
