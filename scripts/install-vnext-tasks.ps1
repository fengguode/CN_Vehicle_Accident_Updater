$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$nodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
$accountName = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $accountName -LogonType Interactive -RunLevel Limited
$watchdogTrigger = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddMinutes(1)) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)

$definitions = @(
  @{
    Name = 'China ADAS vNext Service'
    Description = 'Run the local ADAS vNext web API while this user is signed in.'
    Argument = 'apps/api/server.js'
    Trigger = New-ScheduledTaskTrigger -AtLogOn -User $accountName
    Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Seconds 0) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  },
  @{
    Name = 'China ADAS vNext Watchdog'
    Description = 'Check the local vNext health endpoint every five minutes and restart its service task if needed.'
    Executable = 'powershell.exe'
    Argument = '-NoProfile -ExecutionPolicy Bypass -File scripts/vnext-watchdog.ps1'
    Trigger = $watchdogTrigger
    Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  },
  @{
    Name = 'China ADAS vNext Daily'
    Description = 'Collect public news and import validated social inbox records each day.'
    Argument = 'scripts/vnext-daily.mjs'
    Trigger = New-ScheduledTaskTrigger -Daily -At '08:20'
    Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 45) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  },
  @{
    Name = 'China ADAS vNext Backup'
    Description = 'Take and verify an online backup of the local vNext SQLite database each day.'
    Argument = 'scripts/vnext-backup.mjs'
    Trigger = New-ScheduledTaskTrigger -Daily -At '09:30'
    Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 20) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  }
)

foreach ($definition in $definitions) {
  $existing = Get-ScheduledTask -TaskName $definition.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Set-ScheduledTask -TaskName $definition.Name -Settings $definition.Settings | Out-Null
    Write-Output "Updated settings: $($definition.Name)"
    continue
  }
  $executable = if ($definition.Executable) { $definition.Executable } else { $nodeExecutable }
  $action = New-ScheduledTaskAction -Execute $executable -Argument $definition.Argument -WorkingDirectory $projectRoot
  Register-ScheduledTask -TaskName $definition.Name -Action $action -Trigger $definition.Trigger -Principal $principal -Settings $definition.Settings -Description $definition.Description | Out-Null
  Write-Output "Registered: $($definition.Name)"
}
