# Complete dependency installation script
Write-Host "=== RAGQuery Dependency Installation ===" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Cyan
node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Node.js is not installed" -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Yellow
    $nodeInstalled = $false
} else {
    Write-Host "✓ Node.js is installed" -ForegroundColor Green
    $nodeInstalled = $true
}

Write-Host ""

# Check Python
Write-Host "Checking Python installation..." -ForegroundColor Cyan
python --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Python is not installed" -ForegroundColor Red
    Write-Host "  Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    $pythonInstalled = $false
} else {
    Write-Host "✓ Python is installed" -ForegroundColor Green
    $pythonInstalled = $true
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Install Node.js dependencies
if ($nodeInstalled) {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Node.js dependencies installed!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install Node.js dependencies" -ForegroundColor Red
    }
    Write-Host ""
} else {
    Write-Host "⊘ Skipping Node.js dependencies (Node.js not installed)" -ForegroundColor Yellow
    Write-Host ""
}

# Install Python dependencies
if ($pythonInstalled) {
    Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
    
    # Try to activate virtual environment
    if (Test-Path "venv\Scripts\Activate.ps1") {
        Write-Host "  Activating virtual environment..." -ForegroundColor Gray
        & venv\Scripts\Activate.ps1
    }
    
    pip install -r requirements.txt
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Python dependencies installed!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install Python dependencies" -ForegroundColor Red
    }
    Write-Host ""
} else {
    Write-Host "⊘ Skipping Python dependencies (Python not installed)" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Installation Summary:" -ForegroundColor Cyan
if ($nodeInstalled -and $pythonInstalled) {
    Write-Host "✓ All dependencies should be installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  • Run 'npm run dev' to start the frontend" -ForegroundColor White
    Write-Host "  • Run 'npm run api' to start the backend" -ForegroundColor White
} else {
    Write-Host "⚠ Some runtimes are missing:" -ForegroundColor Yellow
    if (-not $nodeInstalled) {
        Write-Host "  • Install Node.js from https://nodejs.org/" -ForegroundColor White
    }
    if (-not $pythonInstalled) {
        Write-Host "  • Install Python from https://www.python.org/downloads/" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "After installing, run this script again: .\install-all-deps.ps1" -ForegroundColor Cyan
}
Write-Host "================================" -ForegroundColor Cyan
