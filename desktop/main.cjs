const { app, BrowserWindow, Menu, Tray, ipcMain, screen, session, nativeImage, dialog, shell, desktopCapturer, globalShortcut } = require('electron');
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { resolveLaunchRequest } = require('./app-resolver.cjs');
const PORT = 8710;
const URL = `http://127.0.0.1:${PORT}`;
const PRODUCT_NAME = 'Noa';
const PRODUCT_DESCRIPTION = 'Companhia digital local';
let dashboard = null;
let overlay = null;
let tray = null;
let backend = null;
let wakeListener = null;
let wakeListenerReady = false;
let lastWakeAt = 0;
let quitting = false;
let compactExpanded = false;
let approvedApps = [];
let detectedApps = [];
let routines = [];
let commandShortcut = 'Alt+Space';
let surfaceState = 'dashboard';
let overlayAnimation = null;
let overlayTransition = 0;
let runtimeState = { state: 'idle', text: `${PRODUCT_NAME} disponível.`, voiceEnabled: true, micLevel: 0, micStatus: 'INICIANDO' };
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
if (!app.requestSingleInstanceLock())
    app.quit();
function coreDirectory() {
    return app.isPackaged ? path.join(process.resourcesPath, 'noa-core') : path.resolve(__dirname, '..');
}
function appRegistryPath() { return path.join(app.getPath('userData'), 'approved-apps.json'); }
function routineRegistryPath() { return path.join(app.getPath('userData'), 'routines.json'); }
function loadApprovedApps() { try {
    approvedApps = JSON.parse(fs.readFileSync(appRegistryPath(), 'utf8')).filter(item => item && (item.kind === 'uwp' || fs.existsSync(item.path)));
}
catch {
    approvedApps = [];
} }
function saveApprovedApps() { fs.writeFileSync(appRegistryPath(), JSON.stringify(approvedApps, null, 2), 'utf8'); }
function loadRoutines() { try {
    routines = JSON.parse(fs.readFileSync(routineRegistryPath(), 'utf8')).filter(item => item?.name && Array.isArray(item.apps));
}
catch {
    routines = [];
} }
function saveRoutines() { fs.writeFileSync(routineRegistryPath(), JSON.stringify(routines, null, 2), 'utf8'); }
function cleanAppName(filePath) { return path.basename(filePath, path.extname(filePath)).replace(/\s*[-–]\s*(atalho|shortcut)$/i, '').trim(); }
function collectShortcuts(directory, output, depth = 0) {
    if (!directory || depth > 5 || !fs.existsSync(directory))
        return;
    try {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const full = path.join(directory, entry.name);
            if (entry.isDirectory())
                collectShortcuts(full, output, depth + 1);
            else if (/\.(lnk|exe)$/i.test(entry.name) && !/(uninstall|desinstal|update|updater|repair|help|manual|readme|setup|install)/i.test(entry.name))
                output.push({ name: cleanAppName(full), path: full });
        }
    }
    catch { /* pasta protegida ou removida */ }
}
function detectInstalledApps() {
    const found = [];
    const roots = [
        path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
        path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
        path.join(app.getPath('home'), 'Desktop'),
        path.join(process.env.PUBLIC || 'C:\\Users\\Public', 'Desktop')
    ];
    roots.forEach(root => collectShortcuts(root, found));
    if (process.platform === 'win32') {
        try {
            const command = 'Get-StartApps | Select-Object Name,AppID | ConvertTo-Json -Compress';
            const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, timeout: 8000, encoding: 'utf8' });
            if (result.status === 0 && result.stdout) {
                const parsed = JSON.parse(result.stdout), items = Array.isArray(parsed) ? parsed : [parsed];
                for (const item of items)
                    if (item?.Name && item?.AppID)
                        found.push({ name: String(item.Name), path: String(item.AppID), kind: 'uwp' });
            }
        }
        catch { /* atalhos classicos continuam disponiveis */ }
    }
    const unique = new Map();
    for (const item of found.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))) {
        const key = item.name.toLocaleLowerCase('pt-BR');
        if (item.name.length > 1 && (!unique.has(key) || item.kind !== 'uwp'))
            unique.set(key, item);
    }
    detectedApps = [...unique.values()].slice(0, 160);
    return detectedApps;
}
function pythonCommand() {
    const local = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python313', 'pythonw.exe');
    if (fs.existsSync(local))
        return { command: local, args: [] };
    return { command: 'py', args: ['-3.13'] };
}
function startBackend() {
    const python = pythonCommand();
    backend = spawn(python.command, [...python.args, '-m', 'backend.launcher'], {
        cwd: coreDirectory(), windowsHide: true,
        env: { ...process.env, NOA_NO_BROWSER: '1' }, stdio: 'ignore'
    });
}
function sendToWindows(channel, data) {
    for (const target of [dashboard, overlay])
        if (target && !target.isDestroyed())
            target.webContents.send(channel, data);
}
function startWakeListener() {
    if (process.platform !== 'win32' || wakeListener)
        return;
    const script = path.join(coreDirectory(), 'native', 'wake-listener.ps1');
    if (!fs.existsSync(script)) {
        sendToWindows('trace:wake-status', { ready: false, reason: 'script_missing' });
        return;
    }
    try {
        wakeListener = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
        let pending = '';
        wakeListener.stdout.setEncoding('utf8');
        wakeListener.stdout.on('data', chunk => {
            pending += chunk;
            const lines = pending.split(/\r?\n/);
            pending = lines.pop() || '';
            for (const line of lines) {
                try {
                    const event = JSON.parse(line);
                    if (event.type === 'ready') {
                        wakeListenerReady = true;
                        sendToWindows('trace:wake-status', { ready: true });
                    }
                    else if (event.type === 'unavailable') {
                        wakeListenerReady = false;
                        sendToWindows('trace:wake-status', { ready: false, reason: event.message });
                    }
                    else if (event.type === 'sleep') {
                        sleepAssistant();
                        sendToWindows('trace:native-wake', event);
                    }
                    else if (event.type === 'wake' && Date.now() - lastWakeAt > 2600 && !['listening', 'thinking', 'executing', 'speaking'].includes(runtimeState.state)) {
                        lastWakeAt = Date.now();
                        activateOrb();
                        sendToWindows('trace:native-wake', event);
                    }
                }
                catch { /* ignora saida auxiliar do PowerShell */ }
            }
        });
        wakeListener.on('exit', () => { wakeListener = null; wakeListenerReady = false; sendToWindows('trace:wake-status', { ready: false, reason: 'listener_stopped' }); });
    }
    catch {
        wakeListener = null;
        sendToWindows('trace:wake-status', { ready: false, reason: 'listener_failed' });
    }
}
function cleanupLegacyVoiceProcesses() {
    if (process.platform !== 'win32')
        return;
    const command = "Get-CimInstance Win32_Process -Filter \"Name = 'whisper-cli.exe'\" | Where-Object { $_.CommandLine -like '*TRACE-AI*voice*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }";
    try {
        spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, timeout: 8000, stdio: 'ignore' });
    }
    catch { /* limpeza de compatibilidade opcional */ }
}
function waitForBackend(timeout = 30000) {
    const started = Date.now();
    return new Promise((resolve, reject) => {
        const check = () => {
            const request = http.get(`${URL}/api/health`, response => { response.resume(); resolve(); });
            request.on('error', () => Date.now() - started > timeout ? reject(new Error('timeout')) : setTimeout(check, 300));
            request.setTimeout(800, () => request.destroy());
        };
        check();
    });
}
function overlayBounds() {
    const area = screen.getPrimaryDisplay().workArea;
    return { width: 440, height: 260, x: area.x + area.width - 456, y: area.y + area.height - 276 };
}
function parkedOverlayBounds() {
    const area = screen.getPrimaryDisplay().workArea;
    return { width: 440, height: 260, x: area.x + area.width + 20, y: area.y + area.height + 20 };
}
function circleShape(size) {
    const radius = size / 2, rects = [];
    for (let y = 0; y < size; y++) {
        const dy = y + .5 - radius, half = Math.sqrt(Math.max(0, radius * radius - dy * dy));
        const x = Math.max(0, Math.floor(radius - half));
        rects.push({ x, y, width: Math.min(size - x, Math.ceil(half * 2)), height: 1 });
    }
    return rects;
}
function overlayMode(mode) { if (overlay && !overlay.isDestroyed())
    overlay.webContents.send('trace:overlay-mode', mode); }
function animateOverlayOpacity(from, to, duration, onDone) {
    if (!overlay || overlay.isDestroyed())
        return;
    if (overlayAnimation)
        clearInterval(overlayAnimation);
    const transition = ++overlayTransition, start = Date.now();
    overlay.setOpacity(Math.max(0, Math.min(1, from)));
    overlayAnimation = setInterval(() => {
        if (!overlay || overlay.isDestroyed() || transition !== overlayTransition) {
            clearInterval(overlayAnimation);
            overlayAnimation = null;
            return;
        }
        const progress = Math.min(1, (Date.now() - start) / duration), eased = 1 - Math.pow(1 - progress, 3);
        overlay.setOpacity(Math.max(0, Math.min(1, from + (to - from) * eased)));
        if (progress >= 1) {
            clearInterval(overlayAnimation);
            overlayAnimation = null;
            onDone?.();
        }
    }, 16);
}
function showOrb(force = false) {
    if (!overlay)
        return;
    if (compactExpanded && !force)
        return;
    if (dashboard?.isVisible() && !force)
        return;
    const area = screen.getPrimaryDisplay().workArea;
    if (overlayAnimation) {
        clearInterval(overlayAnimation);
        overlayAnimation = null;
    }
    overlayTransition++;
    overlay.setBounds({ width: 80, height: 80, x: area.x + area.width - 92, y: area.y + area.height - 92 }, false);
    overlay.setShape(circleShape(80));
    overlayMode('orb-enter');
    overlay.setOpacity(0);
    overlay.showInactive();
    compactExpanded = false;
    surfaceState = 'orb';
    animateOverlayOpacity(0, 1, 240, () => overlayMode('orb'));
}
function activateOrb() {
    if (dashboard?.isVisible())
        dashboard.hide();
    showOrb(true);
    return true;
}
function showOverlay() { if (!overlay)
    return; if (dashboard?.isVisible())
    dashboard.hide(); if (overlayAnimation) {
    clearInterval(overlayAnimation);
    overlayAnimation = null;
} overlayTransition++; overlay.setShape([]); overlay.setBounds(overlayBounds(), false); overlayMode('chat-enter'); overlay.setOpacity(0); overlay.show(); compactExpanded = true; surfaceState = 'chat'; animateOverlayOpacity(0, 1, 220, () => { overlayMode('chat'); overlay?.focus(); }); }
function hideOverlay() { if (overlay && !overlay.isDestroyed()) {
    overlayMode('leaving');
    compactExpanded = false;
    if (surfaceState !== 'dashboard')
        surfaceState = 'hidden';
    animateOverlayOpacity(overlay.getOpacity(), 0, 180, () => { if (!overlay || overlay.isDestroyed() || !['hidden', 'dashboard'].includes(surfaceState))
        return; overlay.setShape([]); overlay.setBounds(parkedOverlayBounds(), false); overlayMode('hidden'); });
}
else if (surfaceState !== 'dashboard')
    surfaceState = 'hidden'; }
function toggleWake() {
    if (surfaceState === 'dashboard') {
        dashboard.hide();
        showOverlay();
        return true;
    }
    if (surfaceState === 'orb' || surfaceState === 'chat') {
        hideOverlay();
        return false;
    }
    showOverlay();
    return true;
}
function toggleCompactVisibility() {
    if (surfaceState === 'orb' || surfaceState === 'chat') {
        hideOverlay();
        return false;
    }
    if (dashboard?.isVisible())
        dashboard.hide();
    showOrb(true);
    return true;
}
function wakeCompact() { if (dashboard)
    dashboard.hide(); showOverlay(); return true; }
function sleepAssistant() { if (dashboard)
    dashboard.hide(); hideOverlay(); return true; }
function showDashboard() { hideOverlay(); if (dashboard) {
    dashboard.show();
    dashboard.restore();
    dashboard.focus();
    surfaceState = 'dashboard';
} }
function enterCompact() { if (dashboard)
    dashboard.hide(); showOverlay(); }
function openCommandPalette() { showOverlay(); setTimeout(() => overlay?.webContents.send('trace:global-command'), 120); }
function registerCommandShortcut() {
    if (globalShortcut.register(commandShortcut, openCommandPalette))
        return;
    commandShortcut = 'Control+Space';
    globalShortcut.register(commandShortcut, openCommandPalette);
}
async function capturePrimaryScreen() {
    try {
        const display = screen.getPrimaryDisplay(), size = display.size;
        const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: Math.min(1440, size.width), height: Math.min(900, size.height) }, fetchWindowIcons: false });
        const source = sources.find(item => String(item.display_id) === String(display.id)) || sources[0];
        if (!source || source.thumbnail.isEmpty())
            return null;
        const bytes = source.thumbnail.toJPEG(78);
        return { name: 'tela-atual.jpg', size: bytes.length, type: 'jpg', data: bytes.toString('base64') };
    }
    catch {
        return null;
    }
}
async function generateDiagnostic() {
    const memory = await process.getProcessMemoryInfo().catch(() => ({ workingSetSize: 0, privateBytes: 0 }));
    const report = {
        generatedAt: new Date().toISOString(),
        product: PRODUCT_NAME, appVersion: app.getVersion(), electron: process.versions.electron, node: process.versions.node,
        windows: { platform: os.platform(), release: os.release(), arch: os.arch() },
        hardware: { cpuModel: os.cpus()[0]?.model || 'unknown', cpuThreads: os.cpus().length, totalMemoryMB: Math.round(os.totalmem() / 1048576), freeMemoryMB: Math.round(os.freemem() / 1048576) },
        runtime: { surface: surfaceState, wakeListenerReady, backendRunning: Boolean(backend && !backend.killed), rendererMemoryMB: Math.round((memory.workingSetSize || 0) / 1024), state: runtimeState.state, micStatus: runtimeState.micStatus },
        configuration: { approvedApps: approvedApps.length, routines: routines.length, shortcut: commandShortcut },
        privacy: 'Conversas, nomes de arquivos e nomes de aplicativos não são incluídos.'
    };
    const result = await dialog.showSaveDialog(dashboard, { title: `Salvar diagnóstico da ${PRODUCT_NAME}`, defaultPath: `${PRODUCT_NAME}-diagnostico-${new Date().toISOString().slice(0, 10)}.json`, filters: [{ name: 'Diagnóstico JSON', extensions: ['json'] }] });
    if (result.canceled || !result.filePath)
        return false;
    fs.writeFileSync(result.filePath, JSON.stringify(report, null, 2), 'utf8');
    return true;
}
async function runRoutine(query) {
    const text = String(query || '').toLocaleLowerCase('pt-BR');
    const routine = routines.find(item => text.includes(item.name.toLocaleLowerCase('pt-BR')));
    if (!routine)
        return { ok: false };
    const opened = [];
    for (const appName of routine.apps) {
        const found = approvedApps.find(item => item.name === appName);
        if (found && !await launchApprovedApp(found))
            opened.push(found.name);
    }
    return { ok: true, name: routine.name, opened };
}
async function launchApprovedApp(item) {
    if (item.kind === 'uwp') {
        try {
            spawn('explorer.exe', [`shell:AppsFolder\\${item.path}`], { windowsHide: true, detached: true, stdio: 'ignore' }).unref();
            return '';
        }
        catch (error) {
            return String(error?.message || error);
        }
    }
    return shell.openPath(item.path);
}
function createWindows() {
    const icon = path.join(coreDirectory(), 'native', 'assets', 'noa.ico');
    const preload = path.join(__dirname, 'preload.cjs');
    dashboard = new BrowserWindow({
        title: PRODUCT_NAME, width: 1420, height: 850, minWidth: 900, minHeight: 620,
        backgroundColor: '#03060b', icon, show: true,
        webPreferences: { preload, contextIsolation: true, nodeIntegration: false, backgroundThrottling: true }
    });
    dashboard.setMenu(null);
    dashboard.loadURL(`${URL}/?native=dashboard`);
    dashboard.on('close', event => { if (!quitting) {
        event.preventDefault();
        dashboard.hide();
        surfaceState = 'hidden';
    } });
    overlay = new BrowserWindow({
        ...parkedOverlayBounds(), title: `${PRODUCT_NAME} Compacta`, frame: false, transparent: true, backgroundColor: '#00000000', opacity: 0,
        alwaysOnTop: true, skipTaskbar: true, resizable: false, movable: true,
        show: true, focusable: true, hasShadow: false, icon,
        webPreferences: { preload, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
    });
    overlay.setAlwaysOnTop(true, 'floating');
    overlay.loadURL(`${URL}/?native=overlay`);
    overlay.once('ready-to-show', hideOverlay);
    overlay.on('blur', () => { });
}
function createTray() {
    const iconPath = path.join(coreDirectory(), 'native', 'assets', 'noa.ico');
    tray = new Tray(nativeImage.createFromPath(iconPath));
    tray.setToolTip(`${PRODUCT_NAME} — ${PRODUCT_DESCRIPTION}`);
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: `Abrir ${PRODUCT_NAME}`, click: showDashboard },
        { label: 'Chat compacto', click: showOverlay },
        { type: 'separator' },
        { label: 'Ocultar chat', click: hideOverlay },
        { label: `Encerrar ${PRODUCT_NAME}`, click: () => { quitting = true; app.quit(); } }
    ]));
    tray.on('double-click', showDashboard);
}
// Canais trace:* permanecem temporariamente para compatibilidade com a bridge já existente.
ipcMain.handle('trace:expand-overlay', () => { showOrb(); return true; });
ipcMain.handle('trace:show-orb', () => activateOrb());
ipcMain.handle('trace:toggle-compact', () => { compactExpanded ? showOrb(true) : showOverlay(); return compactExpanded; });
ipcMain.handle('trace:toggle-wake', () => toggleWake());
ipcMain.handle('trace:toggle-compact-visibility', () => toggleCompactVisibility());
ipcMain.handle('trace:wake-compact', () => wakeCompact());
ipcMain.handle('trace:sleep-assistant', () => sleepAssistant());
ipcMain.handle('trace:collapse-overlay', () => { hideOverlay(); return true; });
ipcMain.handle('trace:show-dashboard', () => { showDashboard(); return true; });
ipcMain.handle('trace:enter-compact', () => { enterCompact(); return true; });
ipcMain.handle('trace:capture-screen', () => capturePrimaryScreen());
ipcMain.handle('trace:generate-diagnostic', () => generateDiagnostic());
ipcMain.handle('trace:calibrate-claps', () => { if (overlay && !overlay.isDestroyed())
    overlay.webContents.send('trace:clap-calibration', 'start'); return true; });
ipcMain.handle('trace:reset-claps', () => { if (overlay && !overlay.isDestroyed())
    overlay.webContents.send('trace:clap-calibration', 'reset'); return true; });
ipcMain.handle('trace:start-listening', () => { if (overlay && !overlay.isDestroyed())
    overlay.webContents.send('trace:start-listening'); return true; });
ipcMain.handle('trace:set-ambient', (_event, enabled) => { if (overlay && !overlay.isDestroyed())
    overlay.webContents.send('trace:ambient-control', Boolean(enabled)); return true; });
ipcMain.handle('trace:get-shortcut', () => commandShortcut);
ipcMain.handle('trace:select-files', async () => {
    const result = await dialog.showOpenDialog(dashboard, {
        title: `Anexar à ${PRODUCT_NAME}`, properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Arquivos compatíveis', extensions: ['pdf', 'docx', 'txt', 'md', 'csv', 'json', 'js', 'ts', 'py', 'html', 'css', 'png', 'jpg', 'jpeg', 'webp'] }, { name: 'Todos', extensions: ['*'] }]
    });
    if (result.canceled)
        return [];
    const files = [];
    for (const filePath of result.filePaths.slice(0, 4)) {
        const stat = fs.statSync(filePath);
        if (stat.size > 12 * 1024 * 1024)
            continue;
        files.push({ name: path.basename(filePath), size: stat.size, type: path.extname(filePath).slice(1).toLowerCase(), data: fs.readFileSync(filePath).toString('base64') });
    }
    return files;
});
ipcMain.handle('trace:save-document', async (_event, data) => {
    const format = ['pdf', 'docx'].includes(data?.format) ? data.format : 'txt';
    const filters = format === 'pdf' ? [{ name: 'PDF', extensions: ['pdf'] }] : format === 'docx' ? [{ name: 'Word', extensions: ['docx'] }] : [{ name: 'Texto', extensions: ['txt', 'md'] }];
    const result = await dialog.showSaveDialog(dashboard, { title: `Salvar resposta da ${PRODUCT_NAME}`, defaultPath: `resposta-noa.${format}`, filters });
    if (result.canceled || !result.filePath)
        return false;
    const content = String(data?.text || '');
    if (format === 'docx' && data?.bytes) {
        fs.writeFileSync(result.filePath, Buffer.from(String(data.bytes), 'base64'));
    }
    else if (format === 'pdf') {
        const printWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
        const escaped = content.replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
        await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<style>body{font:15px/1.6 Segoe UI,sans-serif;color:#17202a;padding:40px;white-space:pre-wrap}h1{font-size:20px}</style><h1>Documento revisado pela Noa</h1><div>${escaped}</div>`)}`);
        fs.writeFileSync(result.filePath, await printWindow.webContents.printToPDF({ printBackground: true, pageSize: 'A4' }));
        printWindow.destroy();
    }
    else
        fs.writeFileSync(result.filePath, content, 'utf8');
    return true;
});
ipcMain.handle('trace:select-app', async () => { const result = await dialog.showOpenDialog(dashboard, { title: 'Autorizar aplicativo', properties: ['openFile'], filters: [{ name: 'Aplicativos Windows', extensions: ['exe', 'lnk'] }] }); if (result.canceled)
    return null; const appPath = result.filePaths[0], item = { name: path.basename(appPath, path.extname(appPath)), path: appPath }; if (!approvedApps.some(entry => entry.path === appPath)) {
    approvedApps.push(item);
    saveApprovedApps();
} return item; });
ipcMain.handle('trace:list-apps', () => approvedApps.map(({ name }) => ({ name })));
ipcMain.handle('trace:detect-apps', () => {
    const scanned = detectInstalledApps(), paths = new Set(scanned.map(item => item.path));
    return [...scanned, ...approvedApps.filter(item => !paths.has(item.path))].map(item => ({ ...item, authorized: approvedApps.some(entry => entry.path === item.path) }));
});
ipcMain.handle('trace:set-app-authorized', (_event, item, authorized) => {
    if (!item?.path || (item.kind !== 'uwp' && !fs.existsSync(item.path)))
        return false;
    const candidate = { name: String(item.name || cleanAppName(item.path)), path: String(item.path), ...(item.kind === 'uwp' ? { kind: 'uwp' } : {}) };
    approvedApps = approvedApps.filter(entry => entry.path !== candidate.path);
    if (authorized)
        approvedApps.push(candidate);
    saveApprovedApps();
    return true;
});
ipcMain.handle('trace:launch-app', async (_event, query) => {
    try {
        const resolved = resolveLaunchRequest(query, approvedApps);
        if (!resolved)
            return { ok: false, reason: 'not_found' };
        if (resolved.type === 'external')
            await shell.openExternal(resolved.target);
        else if (resolved.type === 'uwp') {
            const error = await launchApprovedApp({ path: resolved.target, kind: 'uwp' });
            if (error)
                return { ok: false, reason: 'launch_failed', name: resolved.name, detail: error };
        }
        else {
            const error = await shell.openPath(resolved.target);
            if (error)
                return { ok: false, reason: 'launch_failed', name: resolved.name, detail: error };
        }
        return { ok: true, name: resolved.name };
    }
    catch (error) {
        return { ok: false, reason: 'launch_failed', detail: String(error?.message || error) };
    }
});
ipcMain.handle('trace:list-routines', () => routines);
ipcMain.handle('trace:save-routine', (_event, data) => { const name = String(data?.name || '').trim().slice(0, 40), apps = Array.isArray(data?.apps) ? data.apps.filter(appName => approvedApps.some(item => item.name === appName)).slice(0, 10) : []; if (!name || !apps.length)
    return false; routines = routines.filter(item => item.name.toLocaleLowerCase('pt-BR') !== name.toLocaleLowerCase('pt-BR')); routines.push({ name, apps }); saveRoutines(); return true; });
ipcMain.handle('trace:delete-routine', (_event, name) => { routines = routines.filter(item => item.name !== name); saveRoutines(); return true; });
ipcMain.handle('trace:run-routine', (_event, query) => runRoutine(query));
ipcMain.handle('trace:mic-level', (_event, data) => {
    runtimeState = { ...runtimeState, micLevel: Number(data?.level || 0), ...(data?.status ? { micStatus: String(data.status) } : {}) };
    if (dashboard && !dashboard.isDestroyed())
        dashboard.webContents.send('trace:mic-level', data);
    return true;
});
ipcMain.handle('trace:broadcast', (event, data) => {
    if (data?.type === 'state')
        runtimeState = { ...runtimeState, state: data.state || runtimeState.state, text: data.text || runtimeState.text };
    if (data?.type === 'voice-mode')
        runtimeState = { ...runtimeState, voiceEnabled: Boolean(data.enabled) };
    for (const target of [dashboard, overlay]) {
        if (target && !target.isDestroyed() && target.webContents.id !== event.sender.id)
            target.webContents.send('trace:event', data);
    }
    return true;
});
ipcMain.handle('trace:runtime-state', () => ({ ...runtimeState, surface: surfaceState, wakeListenerReady, approvedApps: approvedApps.length, routines: routines.length }));
ipcMain.handle('trace:get-startup', () => app.getLoginItemSettings().openAtLogin);
ipcMain.handle('trace:set-startup', (_event, enabled) => { app.setLoginItemSettings({ openAtLogin: Boolean(enabled), path: process.execPath, args: [] }); return app.getLoginItemSettings().openAtLogin === Boolean(enabled); });
app.on('second-instance', showDashboard);
app.whenReady().then(async () => {
    loadApprovedApps();
    loadRoutines();
    detectInstalledApps();
    session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => callback(permission === 'media'));
    session.defaultSession.setPermissionCheckHandler((_contents, permission) => permission === 'media');
    cleanupLegacyVoiceProcesses();
    startBackend();
    try {
        await waitForBackend();
    }
    catch { /* a interface exibirá o estado offline */ }
    createWindows();
    createTray();
    registerCommandShortcut();
    startWakeListener();
});
app.on('window-all-closed', event => event?.preventDefault?.());
app.on('before-quit', () => { quitting = true; globalShortcut.unregisterAll(); cleanupLegacyVoiceProcesses(); if (wakeListener && !wakeListener.killed)
    wakeListener.kill(); if (backend && !backend.killed)
    backend.kill(); });