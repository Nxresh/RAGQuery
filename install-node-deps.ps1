# Install all Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Node.js dependencies installed successfully!" -ForegroundColor Green
    Write-Host "`nVerifying installation..." -ForegroundColor Cyan
    npm list --depth=0
} else {
    Write-Host "`n✗ Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}
