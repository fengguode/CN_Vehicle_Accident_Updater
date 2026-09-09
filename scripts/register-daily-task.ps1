param([string]$At = '08:00')
$ErrorActionPreference = 'Stop'
$ScriptPath = Join-Path $PSScriptRoot 'daily-update.ps1'
$Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
$Trigger = New-ScheduledTaskTrigger -Daily -At $At
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName 'China ADAS Accident Monitor' -Description 'Daily incremental collection of public China ADAS accident reports' -Action $Action -Trigger $Trigger -Settings $Settings
