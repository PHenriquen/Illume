const COMMON_WORDS = new Set([
    'a', 'ao', 'app', 'aplicativo', 'aplicativos', 'de', 'do', 'favor', 'o',
    'consegue', 'conseguiria', 'pode', 'poderia', 'por', 'pra', 'para',
    'programa', 'programas', 'quero', 'queria', 'trace', 'tracer', 'um', 'uma'
]);
const ACTION_WORDS = new Set([
    'abra', 'abre', 'abri', 'abrir', 'abrindo',
    'inicia', 'inicie', 'iniciar', 'iniciando',
    'executa', 'execute', 'executar', 'executando',
    'roda', 'rode', 'rodar', 'rodando',
    'lanca', 'lance', 'lancar', 'mostra', 'mostre'
]);
const BUILTINS = [
    { name: 'WhatsApp', aliases: ['whatsapp', 'whats app', 'whats', 'zap'], target: 'whatsapp:' },
    { name: 'Discord', aliases: ['discord'], target: 'discord:' },
    { name: 'Steam', aliases: ['steam'], target: 'steam:' }
];
const KNOWN_ALIASES = [
    { aliases: ['vs code', 'vscode', 'visual code'], appNames: ['visual studio code'] },
    { aliases: ['chrome'], appNames: ['google chrome', 'chrome'] },
    { aliases: ['edge'], appNames: ['microsoft edge', 'edge'] },
    { aliases: ['brave'], appNames: ['brave browser', 'brave'] },
    { aliases: ['firefox'], appNames: ['mozilla firefox', 'firefox'] },
    { aliases: ['word'], appNames: ['microsoft word', 'word'] },
    { aliases: ['excel'], appNames: ['microsoft excel', 'excel'] },
    { aliases: ['powerpoint', 'power point'], appNames: ['microsoft powerpoint', 'powerpoint'] },
    { aliases: ['outlook'], appNames: ['microsoft outlook', 'outlook'] },
    { aliases: ['spotify'], appNames: ['spotify'] },
    { aliases: ['obs'], appNames: ['obs studio', 'obs'] },
    { aliases: ['explorador', 'explorador de arquivos'], appNames: ['file explorer', 'explorador de arquivos'] },
    { aliases: ['bloco de notas', 'notepad'], appNames: ['notepad', 'bloco de notas'] },
    { aliases: ['terminal', 'windows terminal'], appNames: ['windows terminal', 'terminal'] },
    { aliases: ['calculadora', 'calc'], appNames: ['calculator', 'calculadora'] }
];
function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}
function containsPhrase(text, phrase) {
    return (` ${text} `).includes(` ${phrase} `);
}
function extractTarget(query) {
    return normalizeText(query)
        .split(' ')
        .filter(word => !ACTION_WORDS.has(word) && !COMMON_WORDS.has(word))
        .join(' ');
}
function aliasScore(query, appName) {
    for (const group of KNOWN_ALIASES) {
        if (!group.aliases.some(alias => containsPhrase(query, alias)))
            continue;
        if (group.appNames.some(name => appName === name || appName.includes(name)))
            return 140;
    }
    return 0;
}
function appScore(query, target, app) {
    const name = normalizeText(app?.name);
    if (!name)
        return 0;
    const known = aliasScore(query, name);
    if (known)
        return known;
    if (containsPhrase(query, name))
        return 130 + Math.min(name.length, 30);
    if (target && target === name)
        return 125;
    if (target.length >= 3 && name.includes(target))
        return 105 + Math.min(target.length, 20);
    if (name.length >= 3 && target.includes(name))
        return 100 + Math.min(name.length, 20);
    const targetTokens = target.split(' ').filter(word => word.length > 1);
    const nameTokens = new Set(name.split(' '));
    if (targetTokens.length) {
        const matched = targetTokens.filter(word => nameTokens.has(word)).length;
        if (matched === targetTokens.length)
            return 80 + matched;
        if (matched >= 2 && matched / targetTokens.length >= 0.66)
            return 70 + matched;
    }
    return 0;
}
function resolveLaunchRequest(query, approvedApps = []) {
    const normalized = normalizeText(query);
    const builtin = BUILTINS.find(item => item.aliases.some(alias => containsPhrase(normalized, alias)));
    if (builtin) {
        const builtinName = normalizeText(builtin.name);
        const authorized = approvedApps.some(app => {
            const appName = normalizeText(app?.name);
            return appName === builtinName || appName.includes(builtinName) || builtin.aliases.some(alias => containsPhrase(appName, alias));
        });
        if (authorized)
            return { type: 'external', name: builtin.name, target: builtin.target };
        return null;
    }
    const target = extractTarget(normalized);
    const ranked = approvedApps
        .map(app => ({ app, score: appScore(normalized, target, app) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || String(a.app.name).localeCompare(String(b.app.name), 'pt-BR'));
    if (!ranked.length)
        return null;
    return { type: ranked[0].app.kind === 'uwp' ? 'uwp' : 'path', name: ranked[0].app.name, target: ranked[0].app.path };
}
module.exports = { extractTarget, normalizeText, resolveLaunchRequest };
