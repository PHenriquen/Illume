$ErrorActionPreference = 'Stop'

function Send-NoaEvent([string]$json) {
  [Console]::Out.WriteLine($json)
  [Console]::Out.Flush()
}

try {
  Add-Type -AssemblyName System.Speech
  $culture = [System.Globalization.CultureInfo]::GetCultureInfo('pt-BR')
  $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine($culture)
  $choices = New-Object System.Speech.Recognition.Choices

  # O vocabulário continua propositalmente curto para reduzir ativações por vídeos.
  # Noa é a identidade principal; Trace e Tracer permanecem apenas como aliases
  # temporários de compatibilidade durante a migração.
  $choices.Add(@(
    'acorde noa',
    'acorda noa',
    'noa acorde',
    'ola noa',
    'olá noa',
    'oi noa',
    'e ai noa',
    'e aí noa',
    'descanse noa',
    'noa descanse',
    'durma noa',
    'noa durma',
    'acorde trace',
    'acorda trace',
    'trace acorde',
    'ola trace',
    'olá trace',
    'oi trace',
    'descanse trace',
    'trace descanse',
    'acorde tracer',
    'acorda tracer',
    'descanse tracer',
    'tracer descanse'
  ))

  $builder = New-Object System.Speech.Recognition.GrammarBuilder
  $builder.Culture = $culture
  $builder.Append($choices)
  $grammar = New-Object System.Speech.Recognition.Grammar($builder)
  $recognizer.LoadGrammar($grammar)
  $recognizer.SetInputToDefaultAudioDevice()

  Register-ObjectEvent -InputObject $recognizer -EventName SpeechRecognized -Action {
    $result = $Event.SourceEventArgs.Result
    $durationMs = if ($result.Audio) { $result.Audio.Duration.TotalMilliseconds } else { 500 }
    if ($result.Confidence -lt 0.70 -or $durationMs -lt 320) { return }

    $phrase = $result.Text.ToLowerInvariant()
    $action = if ($phrase -match '^(descanse|durma) ' -or $phrase -match ' (descanse|durma)$') { 'sleep' } else { 'wake' }
    $assistant = if ($phrase -match '\b(trace|tracer)\b') { 'legacy' } else { 'noa' }
    $payload = [ordered]@{
      type = $action
      phrase = $phrase
      assistant = $assistant
      confidence = [Math]::Round([double]$result.Confidence, 4)
    } | ConvertTo-Json -Compress

    [Console]::Out.WriteLine($payload)
    [Console]::Out.Flush()
  } | Out-Null

  $recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
  Send-NoaEvent ([ordered]@{
    type = 'ready'
    primaryWakeWord = 'noa'
    legacyWakeWords = @('trace', 'tracer')
  } | ConvertTo-Json -Compress)

  while ($true) { Start-Sleep -Milliseconds 500 }
} catch {
  $payload = [ordered]@{
    type = 'unavailable'
    message = $_.Exception.Message
  } | ConvertTo-Json -Compress
  Send-NoaEvent $payload
  exit 1
}
