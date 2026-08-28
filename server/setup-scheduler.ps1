# ============================================================
# ERNET STORE — Configuration du Planificateur de Tâches Windows
# ------------------------------------------------------------
# Crée une tâche planifiée pour exécuter la synchronisation
# Disway le 1er de chaque mois à 04:00.
#
# Exécution en tant qu'administrateur requise.
# ============================================================

param(
    [string]$TaskName = "ERNET-Disway-MonthlySync",
    [string]$Time = "04:00",
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

# Chemin vers le script Node.js
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeScript = Join-Path $ScriptDir "sync-disway.js"
$NodeExe = "node"
$WorkingDir = $ScriptDir

# Vérifier que le script existe
if (-not (Test-Path $NodeScript)) {
    Write-Host "❌ Script introuvable: $NodeScript" -ForegroundColor Red
    exit 1
}

# Mode suppression
if ($Remove) {
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "✅ Tâche '$TaskName' supprimée" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Tâche '$TaskName' non trouvée" -ForegroundColor Yellow
    }
    exit 0
}

# Vérifier les privilèges administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️ Ce script doit être exécuté en tant qu'administrateur" -ForegroundColor Yellow
    Write-Host "   Clic droit → Exécuter en tant qu'administrateur" -ForegroundColor Yellow
    exit 1
}

# Supprimer l'ancienne tâche si elle existe
try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
} catch {}

# Créer l'action : exécuter node sync-disway.js
$Action = New-ScheduledTaskAction `
    -Execute $NodeExe `
    -Argument "`"$NodeScript`"" `
    -WorkingDirectory $WorkingDir

# Créer le déclencheur : le 1er de chaque mois à l'heure spécifiée
$Trigger = New-ScheduledTaskTrigger `
    -Monthly `
    -DaysOfMonth 1 `
    -At $Time

# Configuration de la tâche
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

# Enregistrer la tâche
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "Synchronisation mensuelle des prix Disway - ERNET STORE" `
    -RunLevel Highest

Write-Host ""
Write-Host "✅ Tâche planifiée créée avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Détails:" -ForegroundColor Cyan
Write-Host "   Nom: $TaskName"
Write-Host "   Exécution: Le 1er de chaque mois à $Time"
Write-Host "   Script: $NodeScript"
Write-Host "   Répertoire: $WorkingDir"
Write-Host ""
Write-Host "📌 Commandes utiles:" -ForegroundColor Cyan
Write-Host "   Lancer manuellement:  schtasks /Run /TN `"$TaskName`""
Write-Host "   Voir le statut:       schtasks /Query /TN `"$TaskName`""
Write-Host "   Supprimer:            .\setup-scheduler.ps1 -Remove"
Write-Host ""
