module {
  public type Settings = {
    volume : Nat;
    eqBands : [Float];
    protectionDistortion : Float;
    protectionClipping : Float;
    protectionCleaning : Float;
    canisterBottom : Float;
    canisterPunch : Float;
    bassRestoration : Float;
    bassOutputLevel : Float;
    subLevel : Float;
    processorMimic120dB : Float;
    gainKillActive : Bool;
    lowEndBoosterEnabled : Bool;
    helixActive : Bool;
  };
};
