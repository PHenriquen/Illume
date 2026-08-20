export type AssistantState = "idle" | "listening" | "thinking" | "speaking" | "executing" | "error";

// Compatibility alias while old TRACE identifiers are migrated safely.
export type TraceState = AssistantState;

export type Particle = {
    angle: number;
    radius: number;
    speed: number;
    size: number;
    length: number;
    alpha: number;
    phase: number;
    dash: boolean;
};

export type Attachment = {
    name: string;
    size: number;
    type: string;
    data: string;
};

export type Routine = {
    name: string;
    apps: string[];
};

export type MicReport = {
    level: number;
    status?: string;
};

export type SharedEvent = {
    type: "message" | "state" | "speak" | "voice-mode" | "clear" | "interrupt" | "open-settings" | "suggestions";
    id?: string;
    role?: "trace" | "noa" | "user";
    text?: string;
    state?: AssistantState;
    enabled?: boolean;
    items?: string[];
    page?: "general" | "voice" | "permissions" | "apps";
};

export type DetectedApp = {
    name: string;
    path: string;
    authorized: boolean;
};

export type NativeApi = {
    expand_overlay?: () => Promise<boolean>;
    show_orb?: () => Promise<boolean>;
    collapse_overlay?: () => Promise<boolean>;
    show_dashboard?: () => Promise<boolean>;
    enter_compact?: () => Promise<boolean>;
    toggle_compact?: () => Promise<boolean>;
    toggle_wake?: () => Promise<boolean>;
    toggle_compact_visibility?: () => Promise<boolean>;
    wake_compact?: () => Promise<boolean>;
    sleep_assistant?: () => Promise<boolean>;
    capture_screen?: () => Promise<Attachment | null>;
    generate_diagnostic?: () => Promise<boolean>;
    calibrate_claps?: () => Promise<boolean>;
    reset_claps?: () => Promise<boolean>;
    start_listening?: () => Promise<boolean>;
    set_ambient?: (enabled: boolean) => Promise<boolean>;
    get_shortcut?: () => Promise<string>;
    runtime_state?: () => Promise<Record<string, unknown>>;
    get_startup?: () => Promise<boolean>;
    set_startup?: (enabled: boolean) => Promise<boolean>;
    select_files?: () => Promise<Attachment[]>;
    save_document?: (data: {
        format: "pdf" | "docx" | "txt";
        text: string;
        bytes?: string;
    }) => Promise<boolean>;
    select_app?: () => Promise<{
        name: string;
    } | null>;
    list_apps?: () => Promise<{
        name: string;
    }[]>;
    detect_apps?: () => Promise<DetectedApp[]>;
    set_app_authorized?: (app: DetectedApp, authorized: boolean) => Promise<boolean>;
    launch_app?: (query: string) => Promise<{
        ok: boolean;
        name?: string;
        reason?: "not_found" | "launch_failed";
        detail?: string;
    }>;
    list_routines?: () => Promise<Routine[]>;
    save_routine?: (data: Routine) => Promise<boolean>;
    delete_routine?: (name: string) => Promise<boolean>;
    run_routine?: (query: string) => Promise<{
        ok: boolean;
        name?: string;
        opened?: string[];
    }>;
    report_mic?: (level: number, status?: string) => Promise<boolean>;
    on_mic?: (callback: (data: MicReport) => void) => void;
    broadcast?: (data: SharedEvent) => Promise<boolean>;
    on_event?: (callback: (data: SharedEvent) => void) => void;
    on_overlay_mode?: (callback: (mode: string) => void) => void;
    on_native_wake?: (callback: (data: {
        type: "wake" | "sleep";
    }) => void) => void;
    on_wake_status?: (callback: (data: {
        ready: boolean;
        reason?: string;
    }) => void) => void;
    on_clap_calibration?: (callback: (action: "start" | "reset") => void) => void;
    on_start_listening?: (callback: () => void) => void;
    on_ambient_control?: (callback: (enabled: boolean) => void) => void;
    on_global_command?: (callback: () => void) => void;
};

declare global {
    interface Window {
        pywebview?: {
            api: NativeApi;
        };
        noaNative?: NativeApi;
        traceNative?: NativeApi;
    }
}

export type NativeCommand = "expand_overlay" | "show_orb" | "collapse_overlay" | "show_dashboard" | "enter_compact" | "toggle_compact" | "toggle_wake" | "toggle_compact_visibility" | "wake_compact" | "sleep_assistant";

export type SettingsPage = "general" | "voice" | "permissions" | "apps" | "system";

export type Health = {
    ollama: boolean;
    model_installed: boolean;
    voice_ready: boolean;
    tts_ready: boolean;
    document_ready: boolean;
    model: string;
    memories: number;
};
