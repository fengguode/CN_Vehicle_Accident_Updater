$ErrorActionPreference = 'Stop'
$serviceTask = 'China ADAS vNext Service'
try {
  $response = Invoke-RestMethod -Uri 'http://127.0.0.1:8788/health' -TimeoutSec 5
  if ($response.ok -eq $true -and $response.service -eq 'adas-vnext') { exit 0 }
} catch {
  # An unavailable local endpoint is the condition this watchdog repairs.
}

Start-ScheduledTask -TaskName $serviceTask
Start-Sleep -Seconds 3
$response = Invoke-RestMethod -Uri 'http://127.0.0.1:8788/health' -TimeoutSec 5
if ($response.ok -ne $true -or $response.service -ne 'adas-vnext') {
  throw 'The vNext service did not become healthy after a restart attempt.'
}
