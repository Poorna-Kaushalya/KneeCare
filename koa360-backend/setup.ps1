$pythonVersion = "3.12"

Write-Host "================================="
Write-Host " Using Python version $pythonVersion"
Write-Host "================================="

# Remove existing venv
if (Test-Path "pyenv") {
    Write-Host "Removing old virtual environment."
    Remove-Item -Recurse -Force pyenv
}

# Check if Python 3.11 exists
py -$pythonVersion -c "import sys; print(sys.version)" 2>$null
if (!$?) {
    Write-Host "ERROR: Python $pythonVersion is not installed."
    Write-Host "Please install Python $pythonVersion and try again."
    exit 1
}

# Create virtual environment
py -$pythonVersion -m venv pyenv

# Temporarily allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Activate environment
.\pyenv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
npm install

Write-Host ""
Write-Host "================================="
Write-Host " Setup complete!"
Write-Host " Run: npm start"
Write-Host "================================="

# powershell -ExecutionPolicy Bypass -File .\setup.ps1
# .\pyenv\Scripts\Activate.ps1  
# npm start