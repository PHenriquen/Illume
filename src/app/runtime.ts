import type { AssistantState, Particle, Attachment, Routine, SharedEvent, DetectedApp, NativeCommand, NativeApi } from "./types";

export const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;

export const canvas = $<HTMLCanvasElement>("#particle-field"), ctx = canvas.getContext("2d")!;

export const core = $("#core-wrap"), status = $("#core-status"), kicker = $("#core-kicker"), caption = $("#live-caption");

export const messages = $("#messages"), promptInput = $<HTMLInputElement>("#prompt-input"), activateButton = $<HTMLButtonElement>("#activate-button");

export const ambientButton = $<HTMLButtonElement>("#ambient-button"), settings = $<HTMLDialogElement>("#settings-dialog");

export const modelInput = $<HTMLInputElement>("#model-input"), installModelButton = $<HTMLButtonElement>("#install-model-button");

export const settingsInstallButton = $<HTMLButtonElement>("#settings-install-button"), voiceInstallButton = $<HTMLButtonElement>("#voice-install-button");

export const ambientToggle = $<HTMLInputElement>("#ambient-toggle"), voiceToggle = $<HTMLInputElement>("#voice-toggle"), clapToggle = $<HTMLInputElement>("#clap-toggle"), keepCompactToggle = $<HTMLInputElement>("#keep-compact-toggle");

export const compactOverlay = $("#compact-overlay"), compactCaption = $("#compact-caption"), compactStatus = $("#compact-status");

export const compactLastUser = $("#compact-last-user"), compactLastTrace = $("#compact-last-trace");

export const micLevelBar = $<HTMLElement>("#mic-level-bar"), micStatus = $("#mic-status");

export const attachmentList = $("#attachment-list"), permissionFiles = $<HTMLInputElement>("#permission-files"), permissionImages = $<HTMLInputElement>("#permission-images"), permissionScreen = $<HTMLInputElement>("#permission-screen"), permissionApps = $<HTMLInputElement>("#permission-apps"), permissionEdits = $<HTMLInputElement>("#permission-edits");

export const activityList = $("#activity-list"), activitySummary = $("#activity-summary"), activityStatus = $("#activity-status");

export const approvalMode = $<HTMLSelectElement>("#approval-mode"), sensitivityRange = $<HTMLInputElement>("#sensitivity-range"), bargeInToggle = $<HTMLInputElement>("#barge-in-toggle"), voiceProfile = $<HTMLSelectElement>("#voice-profile"), systemVoiceChoice = $<HTMLSelectElement>("#system-voice-choice"), responseMode = $<HTMLSelectElement>("#response-mode"), responseStyle = $<HTMLSelectElement>("#response-style"), userName = $<HTMLInputElement>("#user-name"), intelligenceProfile = $<HTMLSelectElement>("#intelligence-profile");

export const startupToggle = $<HTMLInputElement>("#startup-toggle");

export const nativeMode = new URLSearchParams(location.search).get("native");

export function getNativeApi(): NativeApi | undefined {
  return window.noaNative ?? window.traceNative ?? window.pywebview?.api;
}

export const nativeCall = (name: NativeCommand) => getNativeApi()?.[name]?.();

export const broadcast = (data: SharedEvent) => getNativeApi()?.broadcast?.(data);

export const seenMessages = new Set<string>();

if (nativeMode === "overlay")
    document.documentElement.classList.add("compact-root");
else if (nativeMode === "dashboard")
    document.documentElement.classList.add("dashboard-root");

export const store = {
  particles: ([]) as Particle[],
  state: ("idle") as AssistantState,
  intense: false,
  lastFrame: 0,
  micLevel: 0,
  stream: (null) as MediaStream | null,
  audioContext: (null) as AudioContext | null,
  processor: (null) as ScriptProcessorNode | null,
  analyser: (null) as AnalyserNode | null,
  sampleRate: 48000,
  ambient: false,
  assistantSpeaking: false,
  capture: ("none") as "none" | "wake" | "command",
  chunks: ([]) as Float32Array[],
  preRoll: ([]) as Float32Array[],
  speechStarted: false,
  voicedFrames: 0,
  silenceSince: 0,
  captureStarted: 0,
  lastClap: 0,
  lastRms: 0,
  quietFrames: 0,
  quietFramesAfterFirstClap: 0,
  clapCooldownUntil: 0,
  noiseFloor: 0.006,
  calibrationFrames: 0,
  voiceEnabled: true,
  currentAudio: (null) as HTMLAudioElement | null,
  currentAudioUrl: "",
  currentAudioResolve: (null) as ((played: boolean) => void) | null,
  speechGeneration: 0,
  activeRequest: (null) as AbortController | null,
  activeTranscription: (null) as AbortController | null,
  transcriptionBusy: false,
  nextWakeCaptureAt: 0,
  interactionGeneration: 0,
  sensitivity: 1,
  voiceSessionUntil: 0,
  lastTypingAt: 0,
  nativeWakeReady: false,
  bargeInFrames: 0,
  lastTraceReply: "",
  clapCalibrationUntil: 0,
  clapCalibrationSamples: ([]) as { peak: number; rms: number }[],
  lastCalibrationSampleAt: 0,
  customClapPeak: Number(localStorage.getItem("trace-clap-peak") || 0),
  customClapRms: Number(localStorage.getItem("trace-clap-rms") || 0),
  pointerFrame: 0,
  pointerX: innerWidth / 2,
  pointerY: innerHeight / 2,
  pointerActive: false,
  particleEnergy: 0,
  pendingAttachments: ([]) as Attachment[],
  orbClickTimer: 0,
  detectedApps: ([]) as DetectedApp[],
  savedRoutines: ([]) as Routine[],
};

export type Controllers = {
  core: typeof import("./core").coreController;
  audio: typeof import("./audio").audioController;
  chat: typeof import("./chat").chatController;
  speech: typeof import("./speech").speechController;
  system: typeof import("./system").systemController;
  apps: typeof import("./apps").appsController;
  activity: typeof import("./activity").activityController;
};

export const controllers = {} as Controllers;

export function attachControllers(next: Controllers): void {
  Object.assign(controllers, next);
}
