# Install Python dependencies
Write-Host "Checking Python installation..." -ForegroundColor Cyan
python --version

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n✗ Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "`nActivating virtual environment..." -ForegroundColor Cyan
if (Test-Path "venv\Scripts\Activate.ps1") {
    & venv\Scripts\Activate.ps1
    Write-Host "✓ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "⚠ Virtual environment not found, installing system-wide" -ForegroundColor Yellow
}

Write-Host "`nInstalling Python dependencies from requirements.txt..." -ForegroundColor Cyan
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Python dependencies installed successfully!" -ForegroundColor Green
    Write-Host "`nVerifying installation..." -ForegroundColor Cyan
    pip list | Select-String "youtube"
} else {
    Write-Host "`n✗ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}
