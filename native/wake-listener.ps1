$ErrorActionPreference = 'Stop'

function Send-TraceEvent([string]$json) {
  [Console]::Out.WriteLine($json)
  [Console]::Out.Flush()
}

try {
  Add-Type -AssemblyName System.Speech
  $culture = [System.Globalization.CultureInfo]::GetCultureInfo('pt-BR')
  $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine($culture)
  $choices = New-Object System.Speech.Recognition.Choices
  # O vocabulário propositalmente curto evita que falas de vídeos virem ativações.
  $choices.Add(@('acorde trace', 'acorda trace', 'descanse trace'))
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
    $action = if ($phrase -eq 'descanse trace') { 'sleep' } else { 'wake' }
    $escaped = $phrase.Replace('\\', '\\\\').Replace('"', '\"')
    [Console]::Out.WriteLine("{\"type\":\"$action\",\"phrase\":\"$escaped\",\"confidence\":$($result.Confidence.ToString([System.Globalization.CultureInfo]::InvariantCulture))}")
    [Console]::Out.Flush()
  } | Out-Null
  $recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
  Send-TraceEvent '{"type":"ready"}'
  while ($true) { Start-Sleep -Milliseconds 500 }
} catch {
  $message = $_.Exception.Message.Replace('\\', '\\\\').Replace('"', '\"')
  Send-TraceEvent "{\"type\":\"unavailable\",\"message\":\"$message\"}"
  exit 1
}
