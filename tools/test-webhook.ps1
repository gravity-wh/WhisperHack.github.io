param(
  [Parameter(Mandatory = $false)]
  [string]$Url = "http://127.0.0.1/deploy.php",

  [Parameter(Mandatory = $false)]
  [string]$Secret = "Wh190125",

  [Parameter(Mandatory = $false)]
  [string]$Ref = "refs/heads/main",

  [Parameter(Mandatory = $false)]
  [string]$CommitId = "local-test"
)

$payloadObject = [ordered]@{
  ref = $Ref
  head_commit = @{ id = $CommitId }
}

$payload = ($payloadObject | ConvertTo-Json -Depth 10 -Compress)

$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
$hashBytes = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))
$hashHex = -join ($hashBytes | ForEach-Object { $_.ToString("x2") })

$headers = @{
  "X-GitHub-Event" = "push"
  "X-GitHub-Delivery" = [guid]::NewGuid().ToString()
  "X-Hub-Signature-256" = "sha256=$hashHex"
  "Content-Type" = "application/json"
}

Write-Host "POST $Url" -ForegroundColor Cyan
Write-Host "Payload: $payload"

try {
  $resp = Invoke-RestMethod -Method Post -Uri $Url -Headers $headers -Body $payload -TimeoutSec 120
  $resp | ConvertTo-Json -Depth 10
} catch {
  Write-Host "Request failed:" -ForegroundColor Red
  if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
    $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host $body
  }
  throw
}
