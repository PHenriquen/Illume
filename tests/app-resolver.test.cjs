const test = require('node:test');
const assert = require('node:assert/strict');
const { extractTarget, normalizeText, resolveLaunchRequest } = require('../desktop/app-resolver.cjs');
const apps = [
    { name: 'WhatsApp', path: 'C:\\Apps\\WhatsApp.lnk' },
    { name: 'Visual Studio Code', path: 'C:\\Apps\\Code.lnk' },
    { name: 'Google Chrome', path: 'C:\\Apps\\Chrome.lnk' },
    { name: 'Microsoft Word', path: 'C:\\Apps\\Word.lnk' },
    { name: 'OBS Studio', path: 'C:\\Apps\\OBS.lnk' },
    { name: 'Relógio', path: 'Microsoft.WindowsAlarms_8wekyb3d8bbwe!App', kind: 'uwp' }
];
test('normaliza acentos e pontuação', () => {
    assert.equal(normalizeText('TRACE, inicie o Aplicativo!'), 'trace inicie o aplicativo');
});
test('extrai o alvo de uma frase natural', () => {
    assert.equal(extractTarget('Trace, pode abrir o Google Chrome por favor'), 'google chrome');
});
test('resolve aplicativos integrados e apelidos', () => {
    assert.equal(resolveLaunchRequest('Abre o zap', apps)?.name, 'WhatsApp');
    assert.equal(resolveLaunchRequest('Trace, roda o VS Code', apps)?.name, 'Visual Studio Code');
    assert.equal(resolveLaunchRequest('Pode abrir o Chrome?', apps)?.name, 'Google Chrome');
});
test('resolve nomes autorizados e não inventa aplicativos', () => {
    assert.equal(resolveLaunchRequest('Inicie o Microsoft Word', apps)?.name, 'Microsoft Word');
    assert.equal(resolveLaunchRequest('Execute o OBS', apps)?.name, 'OBS Studio');
    assert.equal(resolveLaunchRequest('Abra um programa inexistente', apps), null);
    assert.equal(resolveLaunchRequest('Abra o Discord', apps), null);
    assert.equal(resolveLaunchRequest('Abra o Relógio', apps)?.type, 'uwp');
});
