import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Settings {
    canisterPunch: number;
    bassRestoration: number;
    bassOutputLevel: number;
    processorMimic120dB: number;
    volume: bigint;
    helixActive: boolean;
    canisterBottom: number;
    protectionCleaning: number;
    protectionDistortion: number;
    eqBands: Array<number>;
    subLevel: number;
    gainKillActive: boolean;
    protectionClipping: number;
    lowEndBoosterEnabled: boolean;
}
export interface backendInterface {
    clearSettings(): Promise<void>;
    loadSettings(): Promise<Settings | null>;
    saveSettings(settings: Settings): Promise<void>;
}
