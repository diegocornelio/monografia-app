# checagem.ps1 — equivalente do checagem.sh para Windows.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\checagem.ps1 [fase]
$ErrorActionPreference = "Continue"
Set-Location (Join-Path $PSScriptRoot "..")

$fase = if ($args.Length -gt 0) { $args[0] } elseif (Test-Path ".fase-atual") { Get-Content ".fase-atual" -Raw } else { "3" }
$fase = $fase.Trim()
$relatorio = "RELATORIO.md"
$falhas = 0
$detalhe = @()

"# Relatorio de checagem", "", "Gerado em $((Get-Date).ToUniversalTime().ToString('u')) · fase $fase", "",
"| Portao | Estado |", "|---|---|" | Set-Content $relatorio

function Executar($nome, $comando) {
  $saida = & cmd /c $comando 2>&1
  if ($LASTEXITCODE -eq 0) {
    Add-Content $relatorio "| $nome | ok |"
  } else {
    Add-Content $relatorio "| $nome | FALHOU |"
    $script:falhas++
    $script:detalhe += "`n### $nome`n`n``````n$($saida | Select-Object -Last 40 | Out-String)`n``````"
  }
}

Executar "testes de dominio" "node testes/dominio.test.mjs"
Executar "especificacao sem vermelho" "node testes/tdd.mjs --silencioso"
Executar "fases 1 a $fase completas" "node testes/tdd.mjs --silencioso --exigir-verde --ate-fase=$fase"
Executar "cobertura do catalogo" "node testes/cobertura.mjs"
if (Test-Path "node_modules") {
  Executar "lint" "npm run lint --silent"
  Executar "tipos" "npm run typecheck --silent"
  Executar "build" "npm run build --silent"
}

Add-Content $relatorio "`n## Pendencias da especificacao`n`n``````"
Add-Content $relatorio (node testes/tdd.mjs --silencioso 2>$null | Select-String -Pattern "Features ainda nao provadas" -Context 0,40 | Out-String)
Add-Content $relatorio "``````"
Add-Content $relatorio ($detalhe -join "`n")

if ($falhas -eq 0) { Add-Content $relatorio "`n**Todos os portoes passaram.**"; exit 0 }
Add-Content $relatorio "`n**$falhas portao(es) falharam.**"; exit 1
