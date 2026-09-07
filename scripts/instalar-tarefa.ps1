# instalar-tarefa.ps1 — agenda a conferencia no Agendador de Tarefas do Windows.
# Primeira execucao 20 minutos apos a instalacao, repetindo a cada 20 minutos.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\instalar-tarefa.ps1
#      powershell -ExecutionPolicy Bypass -File scripts\instalar-tarefa.ps1 -Remover
param([switch]$Remover)

$nome = "FicharioChecagem"
$raiz = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if ($Remover) {
  Unregister-ScheduledTask -TaskName $nome -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "conferencia automatica removida"
  exit 0
}

Unregister-ScheduledTask -TaskName $nome -Confirm:$false -ErrorAction SilentlyContinue

$acao = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-ExecutionPolicy Bypass -File `"$raiz\scripts\checagem.ps1`"" -WorkingDirectory $raiz
$gatilho = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddMinutes(20)) `
  -RepetitionInterval (New-TimeSpan -Minutes 20)
Register-ScheduledTask -TaskName $nome -Action $acao -Trigger $gatilho | Out-Null

Write-Host "conferencia agendada: primeira em 20 minutos, depois a cada 20"
Write-Host "relatorio em $raiz\RELATORIO.md"
Write-Host "para encerrar: instalar-tarefa.ps1 -Remover"
