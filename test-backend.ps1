param([string]$username = "admin", [string]$password = "admin123")

$base = "http://localhost:8081"
$body = "{`"username`":`"$username`",`"password`":`"$password`"}"
$headers = @{ "Content-Type" = "application/json" }

$paths = @(
    "/api/v1/auth/login",
    "/api/v1/auth/signin",
    "/api/v1/auth/authenticate",
    "/api/auth/login",
    "/api/auth/signin",
    "/auth/login",
    "/login"
)

Write-Host "`n===== BACKEND ENDPOINT DISCOVERY =====" -ForegroundColor Cyan
Write-Host "Testing: $base" -ForegroundColor Gray
Write-Host ""

# First check if server is reachable at all
try {
    $ping = Invoke-WebRequest -Uri "$base/api/v1/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "Health check: OK ($($ping.StatusCode))" -ForegroundColor Green
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code) { Write-Host "Health check: HTTP $code (server is reachable)" -ForegroundColor Yellow }
    else        { Write-Host "Health check: FAILED — Is the backend running on port 8081?" -ForegroundColor Red }
}

Write-Host ""
Write-Host "Trying auth endpoints:" -ForegroundColor Cyan

foreach ($path in $paths) {
    $url = "$base$path"
    try {
        $r = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body $body -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  $($r.StatusCode)  $url" -ForegroundColor Green
        Write-Host "  Response: $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))" -ForegroundColor Green
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 401) {
            Write-Host "  401  $url  <-- FOUND (wrong credentials but endpoint exists)" -ForegroundColor Yellow
        } elseif ($code -eq 200) {
            Write-Host "  200  $url  <-- SUCCESS" -ForegroundColor Green
        } elseif ($code) {
            Write-Host "  $code  $url" -ForegroundColor Gray
        } else {
            Write-Host "  ERR  $url  (no response)" -ForegroundColor DarkGray
        }
    }
}

Write-Host "`n===== END =====" -ForegroundColor Cyan

