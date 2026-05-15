(function() {
  "use strict";
  let sharedBuffer = null;
  let sharedView = null;
  let tickCount = 0;
  let volumeNorm = 0.5;
  let isPlaying = false;
  const sessionBaseline = {
    punch: 0,
    depth: 0,
    weight: 0,
    clarity: 0
  };
  const THUNDER_TOTAL_RUNS = 688;
  const THUNDER_WATTS_PER_RUN = 2500;
  const THUNDER_TOTAL_WATTS = THUNDER_TOTAL_RUNS * THUNDER_WATTS_PER_RUN;
  let fuse1Blown = false;
  let fuse2Blown = false;
  const chipState = {
    sessionPunchSum: 0,
    sessionDepthSum: 0,
    sessionWeightSum: 0,
    sessionClaritySum: 0,
    sessionTicks: 0,
    sessionSaveInterval: 0,
    boxType: "ported",
    genreBassHeavy: false,
    weakBand: 0,
    thermalLevel: 0,
    sustainFloor: 0.15,
    deepBassFloor: 0.2,
    vdaWarmth: 0.3,
    vdaPunch: 0.25,
    vdaNonlinear: 0.1,
    hdMonitorFired: 0
  };
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  function thunderBatteryMimic(view) {
    const gainKillActive = view[13] > 0.5;
    if (gainKillActive) {
      view[6] = 0;
      return;
    }
    if (!fuse1Blown && !fuse2Blown) {
      const t = Date.now() / 1e3;
      const sineOscillation = Math.sin(t * 2 * Math.PI / 8);
      const powerMimic = 0.915 + sineOscillation * 0.065;
      view[6] = clamp(powerMimic, 0.85, 0.98);
    } else if (fuse1Blown && !fuse2Blown) {
      const t = Date.now() / 1e3;
      view[6] = clamp(0.5 + Math.sin(t * 2 * Math.PI / 8) * 0.03, 0.45, 0.55);
    } else if (!fuse1Blown && fuse2Blown) {
      const t = Date.now() / 1e3;
      view[6] = clamp(0.5 + Math.sin(t * 2 * Math.PI / 8) * 0.03, 0.45, 0.55);
    } else {
      view[6] = 0.05;
    }
    if (view[6] < 0.1 && !fuse1Blown && !fuse2Blown) {
      fuse1Blown = false;
      fuse2Blown = false;
      console.log(
        `[Thunder Battery] Fuse reset, power restored. Total: ${THUNDER_TOTAL_WATTS.toLocaleString()}W characteristics`
      );
      view[6] = 0.85;
    }
  }
  function chip1_OhmReader(view) {
    const ohms = view[9];
    if (ohms >= 8) {
      const punchComp = (ohms - 8) / 8 * 0.15;
      view[0] = clamp(view[0] + punchComp, 0, 1);
    } else {
      const depthComp = (8 - ohms) / 8 * 0.15;
      view[1] = clamp(view[1] + depthComp, 0, 1);
    }
  }
  function chip2_FreqScience14Hz(view) {
    const t = Date.now() / 1e3;
    const baseEnergy = chipState.deepBassFloor + Math.sin(t * 14 * 2 * Math.PI) * 0.05;
    view[4] = clamp(baseEnergy + view[4] * 0.7, 0, 1);
  }
  function chip3_FreqScience20_40Hz(view) {
    const sustainedWeight = clamp(
      view[2] * 0.9 + chipState.sustainFloor * 0.1,
      0,
      1
    );
    view[2] = sustainedWeight;
  }
  function chip4_FreqScience40_80Hz(view) {
    const punchPulse = volumeNorm > 0.1 ? clamp(volumeNorm * 0.8 + 0.1, 0, 1) : 0.1;
    view[0] = clamp(view[0] * 0.85 + punchPulse * 0.15, 0, 1);
  }
  function chip5_FreqScience80_250Hz(view) {
    const midConnect = clamp(view[3] * 0.88 + volumeNorm * 0.12, 0, 1);
    view[3] = midConnect;
  }
  function chip6_SpeakerID(view) {
    const btConnected = view[12] > 0.5;
    if (btConnected) {
      const ohms = view[9];
      const watts = view[10];
      const normalizedWatts = clamp(watts / 1e3, 0, 1);
      view[1] = clamp(view[1] + normalizedWatts * 0.08, 0, 1);
      view[0] = clamp(view[0] + (ohms >= 8 ? 0.05 : 0.02), 0, 1);
    }
  }
  function chip7_PunchEngine(view) {
    const attackSharpness = volumeNorm > 0.05 ? clamp(0.3 + volumeNorm * 0.6 + sessionBaseline.punch * 0.1, 0, 1) : 0.2;
    view[0] = clamp(view[0] * 0.7 + attackSharpness * 0.3, 0, 1);
  }
  function chip8_SustainEngine(view) {
    const sustainHold = clamp(
      view[5] * 0.92 + chipState.sustainFloor * 0.08,
      0,
      1
    );
    view[5] = sustainHold;
    view[2] = clamp(view[2] * 0.88 + sustainHold * 0.12, 0, 1);
  }
  function chip9_ProtectionIntelligence(view) {
    const response = view[8];
    if (response > 0.95) {
      view[8] = clamp(response * 0.97, 0, 1);
      view[7] = clamp(view[7] * 0.98, 0, 1);
    } else {
      view[7] = clamp(view[7] * 0.95 + 0.05, 0, 1);
      view[8] = clamp(view[8] * 0.9 + 0.1 + volumeNorm * 0.15, 0, 1);
    }
  }
  function chip10_LoadDistributor(view) {
    const t = Date.now();
    const variance = Math.floor(Math.sin(t / 3e3) * 5 + 25);
    view[11] = clamp(variance, 20, 30);
  }
  function chip11_ThunderBattery(view) {
    thunderBatteryMimic(view);
  }
  function thunderBatteryMimic2(view) {
    const gainKillActive = view[13] > 0.5;
    if (gainKillActive) {
      view[14] = 0;
      return;
    }
    if (!fuse1Blown && !fuse2Blown) {
      const t = Date.now() / 1e3;
      const sineOscillation = Math.sin((t + 4) * 2 * Math.PI / 8);
      const powerMimic = 0.915 + sineOscillation * 0.065;
      view[14] = clamp(powerMimic, 0.85, 0.98);
    } else if (fuse1Blown && !fuse2Blown) {
      const t = Date.now() / 1e3;
      view[14] = clamp(
        0.5 + Math.sin((t + 4) * 2 * Math.PI / 8) * 0.03,
        0.45,
        0.55
      );
    } else if (!fuse1Blown && fuse2Blown) {
      const t = Date.now() / 1e3;
      view[14] = clamp(
        0.5 + Math.sin((t + 4) * 2 * Math.PI / 8) * 0.03,
        0.45,
        0.55
      );
    } else {
      view[14] = 0.05;
    }
    if (view[14] < 0.1 && !fuse1Blown && !fuse2Blown) {
      view[14] = 0.85;
    }
  }
  function chip11b_ThunderBattery2(view) {
    thunderBatteryMimic2(view);
  }
  function chip12_SignalAuthority(view) {
    const powerMimic = view[6];
    const targetAuthority = clamp(powerMimic * 0.9 + volumeNorm * 0.1, 0, 1);
    view[7] = clamp(view[7] * 0.8 + targetAuthority * 0.2, 0, 1);
  }
  function chip13_VDA(view) {
    const t = Date.now() / 1e3;
    chipState.vdaWarmth = clamp(
      chipState.vdaWarmth * 0.95 + (0.3 + volumeNorm * 0.4) * 0.05,
      0,
      0.6
    );
    chipState.vdaPunch = clamp(
      chipState.vdaPunch * 0.9 + (0.2 + Math.sin(t * 2) * 0.05) * 0.1,
      0,
      0.5
    );
    chipState.vdaNonlinear = clamp(
      chipState.vdaNonlinear + Math.sin(t * 0.3) * 2e-3,
      0.05,
      0.2
    );
    view[0] = clamp(view[0] + chipState.vdaPunch * 0.1, 0, 1);
    view[1] = clamp(view[1] + chipState.vdaWarmth * 0.08, 0, 1);
    view[2] = clamp(view[2] + chipState.vdaWarmth * 0.06, 0, 1);
    view[3] = clamp(view[3] + chipState.vdaNonlinear * 0.05, 0, 1);
  }
  function chip14_DeepBassSustain(view) {
    const currentDrop = view[4];
    if (currentDrop < chipState.deepBassFloor) {
      view[4] = chipState.deepBassFloor;
    }
    view[2] = clamp(view[2] + chipState.deepBassFloor * 0.1, 0, 1);
  }
  function chip15_BassNoteTracking(view) {
    const t = Date.now() / 1e3;
    const switchRate = Math.abs(Math.sin(t * 2.1)) * 0.5 + volumeNorm * 0.3;
    view[5] = clamp(switchRate, 0, 1);
  }
  function chip16_ZeroStackingMonitor(view) {
    const gainKillActive = view[13] > 0.5;
    if (gainKillActive) {
      view[6] = 0;
      view[7] = 0;
      view[8] = 0;
    }
  }
  function chip17_SpeakerWattsGuard(view) {
    const speakerWatts = view[10];
    const powerMimic = view[6];
    const maxSafeRatio = speakerWatts / 1e3;
    if (powerMimic > maxSafeRatio) {
      view[6] = clamp(maxSafeRatio, 0, 1);
    }
  }
  function chip18_AcousticSealed(view) {
    if (chipState.boxType === "sealed") {
      view[0] = clamp(view[0] * 1.1, 0, 1);
      view[1] = clamp(view[1] * 0.95, 0, 1);
    }
  }
  function chip19_AcousticPorted(view) {
    if (chipState.boxType === "ported") {
      view[4] = clamp(view[4] * 1.05 + 0.03, 0, 1);
      view[2] = clamp(view[2] * 1.05, 0, 1);
    }
  }
  function chip20_RoomReader(view) {
    const freqBalance = (view[4] + view[2]) / 2;
    const roomDepth = clamp(freqBalance * 0.8 + 0.1, 0, 1);
    view[1] = clamp(view[1] * 0.85 + roomDepth * 0.15, 0, 1);
  }
  function chip21_GenreRecognition(view) {
    const bassEnergy = (view[0] + view[2] + view[4]) / 3;
    chipState.genreBassHeavy = bassEnergy > 0.4;
    if (chipState.genreBassHeavy) {
      view[0] = clamp(view[0] * 1.05, 0, 1);
      view[4] = clamp(view[4] * 1.05, 0, 1);
    }
  }
  function chip22_GapFiller(view) {
    const vals = [view[0], view[1], view[2], view[3]];
    let minIdx = 0;
    let minVal = vals[0];
    for (let i = 1; i < vals.length; i++) {
      if (vals[i] < minVal) {
        minVal = vals[i];
        minIdx = i;
      }
    }
    chipState.weakBand = minIdx;
    if (minVal < 0.2) {
      if (minIdx === 0) view[0] = clamp(view[0] + 0.05, 0, 1);
      else if (minIdx === 1) view[1] = clamp(view[1] + 0.05, 0, 1);
      else if (minIdx === 2) view[2] = clamp(view[2] + 0.05, 0, 1);
      else view[3] = clamp(view[3] + 0.05, 0, 1);
    }
  }
  function chip23_HDMonitor(view) {
    const slots = [0, 1, 2, 3, 4, 5];
    let correctionsFired = 0;
    for (const slot of slots) {
      if (view[slot] < 0.3 && isPlaying) {
        view[slot] = clamp(view[slot] + 0.08, 0, 0.5);
        correctionsFired++;
      }
    }
    chipState.hdMonitorFired = correctionsFired;
  }
  function chip24_ThermalGuard(view) {
    const powerMimic = view[6];
    chipState.thermalLevel = clamp(
      chipState.thermalLevel * 0.999 + powerMimic * 1e-3,
      0,
      1
    );
    if (chipState.thermalLevel > 0.9) {
      view[6] = clamp(view[6] * 0.98, 0, 1);
      view[8] = clamp(view[8] * 0.97, 0, 1);
    }
  }
  function chip25_SessionLearning(view) {
    chipState.sessionPunchSum += view[0];
    chipState.sessionDepthSum += view[1];
    chipState.sessionWeightSum += view[2];
    chipState.sessionClaritySum += view[3];
    chipState.sessionTicks++;
    chipState.sessionSaveInterval++;
    if (chipState.sessionSaveInterval >= 2e4) {
      chipState.sessionSaveInterval = 0;
      const avgPunch = chipState.sessionPunchSum / chipState.sessionTicks;
      const avgDepth = chipState.sessionDepthSum / chipState.sessionTicks;
      const avgWeight = chipState.sessionWeightSum / chipState.sessionTicks;
      const avgClarity = chipState.sessionClaritySum / chipState.sessionTicks;
      const MAX_PER_SESSION = 0.1;
      const MAX_TOTAL = 0.5;
      sessionBaseline.punch = clamp(
        sessionBaseline.punch + Math.min(MAX_PER_SESSION, avgPunch * 0.05),
        0,
        MAX_TOTAL
      );
      sessionBaseline.depth = clamp(
        sessionBaseline.depth + Math.min(MAX_PER_SESSION, avgDepth * 0.05),
        0,
        MAX_TOTAL
      );
      sessionBaseline.weight = clamp(
        sessionBaseline.weight + Math.min(MAX_PER_SESSION, avgWeight * 0.05),
        0,
        MAX_TOTAL
      );
      sessionBaseline.clarity = clamp(
        sessionBaseline.clarity + Math.min(MAX_PER_SESSION, avgClarity * 0.05),
        0,
        MAX_TOTAL
      );
      self.postMessage({
        type: "SESSION_LEARNING",
        data: {
          punch: sessionBaseline.punch,
          depth: sessionBaseline.depth,
          weight: sessionBaseline.weight,
          clarity: sessionBaseline.clarity
        }
      });
      chipState.sessionPunchSum = 0;
      chipState.sessionDepthSum = 0;
      chipState.sessionWeightSum = 0;
      chipState.sessionClaritySum = 0;
      chipState.sessionTicks = 0;
    }
  }
  function applyHelixFactoryBaseline(view) {
    const HELIX_FACTOR = 0.1;
    view[1] = clamp(view[1] + HELIX_FACTOR * 0.05, 0, 1);
    view[3] = clamp(view[3] + HELIX_FACTOR * 0.03, 0, 1);
    view[0] = clamp(view[0] + HELIX_FACTOR * 0.04, 0, 1);
  }
  function runTick() {
    if (!sharedView) return;
    const view = sharedView;
    tickCount++;
    chip1_OhmReader(view);
    chip2_FreqScience14Hz(view);
    chip3_FreqScience20_40Hz(view);
    chip4_FreqScience40_80Hz(view);
    chip5_FreqScience80_250Hz(view);
    chip6_SpeakerID(view);
    chip7_PunchEngine(view);
    chip8_SustainEngine(view);
    chip9_ProtectionIntelligence(view);
    chip10_LoadDistributor(view);
    chip11_ThunderBattery(view);
    chip11b_ThunderBattery2(view);
    chip12_SignalAuthority(view);
    chip13_VDA(view);
    chip14_DeepBassSustain(view);
    chip15_BassNoteTracking(view);
    chip16_ZeroStackingMonitor(view);
    chip17_SpeakerWattsGuard(view);
    chip18_AcousticSealed(view);
    chip19_AcousticPorted(view);
    chip20_RoomReader(view);
    chip21_GenreRecognition(view);
    chip22_GapFiller(view);
    chip23_HDMonitor(view);
    chip24_ThermalGuard(view);
    chip25_SessionLearning(view);
    applyHelixFactoryBaseline(view);
    if (tickCount % 100 === 0) {
      console.log(
        `[Thread B] Smart chips firing, tick: ${tickCount} | chips active: ${Math.round(view[11])} | powerMimic: ${view[6].toFixed(3)} | punch: ${view[0].toFixed(3)} | depth: ${view[1].toFixed(3)}`
      );
    }
  }
  self.onmessage = (event) => {
    const msg = event.data;
    if (msg.type === "INIT") {
      sharedBuffer = msg.buffer;
      sharedView = new Float32Array(sharedBuffer);
      sharedView[9] = 8;
      sharedView[10] = 400;
      sharedView[11] = 25;
      sharedView[12] = 0;
      sharedView[13] = 0;
      sharedView[6] = 1;
      const savedLearning = msg.learning;
      if (savedLearning) {
        sessionBaseline.punch = clamp(savedLearning.punch ?? 0, 0, 0.5);
        sessionBaseline.depth = clamp(savedLearning.depth ?? 0, 0, 0.5);
        sessionBaseline.weight = clamp(savedLearning.weight ?? 0, 0, 0.5);
        sessionBaseline.clarity = clamp(savedLearning.clarity ?? 0, 0, 0.5);
      }
      setInterval(runTick, 3);
      self.postMessage({ type: "READY" });
      console.log(
        `[Thread B] Intelligence Worker initialized. Thunder Battery: ${THUNDER_TOTAL_WATTS.toLocaleString()}W characteristics (${THUNDER_TOTAL_RUNS} runs × ${THUNDER_WATTS_PER_RUN.toLocaleString()}W). 25 smart chips online.`
      );
    } else if (msg.type === "SET_VOLUME") {
      volumeNorm = clamp(msg.volume, 0, 1);
    } else if (msg.type === "SET_PLAYING") {
      isPlaying = msg.playing;
      if (isPlaying) chipState.hdMonitorFired = 0;
    } else if (msg.type === "GAIN_KILL") {
      if (sharedView) {
        sharedView[13] = msg.active ? 1 : 0;
      }
    } else if (msg.type === "SET_BOX_TYPE") {
      chipState.boxType = msg.boxType;
      console.log(`[Thread B] Box type updated: ${msg.boxType}`);
    }
  };
})();
