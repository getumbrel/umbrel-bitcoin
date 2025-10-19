# Test script to verify pruning removal
# Run this script from the project root directory

# 1. Verify the application builds successfully
Write-Host "=== Testing Build ===" -ForegroundColor Cyan
try {
    $buildOutput = docker-compose build --no-cache 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
    Write-Host "✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}

# 2. Check for any remaining pruning-related code in source files
Write-Host "`n=== Checking for Pruning References in Source Files ===" -ForegroundColor Cyan

# Define directories to search in
$sourceDirs = @(
    "apps/backend/src",
    "apps/ui/src",
    "libs/settings"
)

# File patterns to include
$includeFiles = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json")

# Search for pruning references in source files
$pruningRefs = @()
foreach ($dir in $sourceDirs) {
    if (Test-Path $dir) {
        $files = Get-ChildItem -Path $dir -Recurse -Include $includeFiles | 
                 Where-Object { $_.FullName -notmatch 'node_modules|dist|build|.next|.git' }
        
        foreach ($file in $files) {
            $content = Get-Content -Path $file.FullName -Raw
            if ($content -match '\bprun') {
                $pruningRefs += $file.FullName
            }
        }
    }
}

if ($pruningRefs.Count -gt 0) {
    Write-Host "❌ Found $($pruningRefs.Count) source files with 'prun' in them:" -ForegroundColor Red
    $pruningRefs | ForEach-Object { Write-Host "  - $_" }
    Write-Host "`nPlease review these files and remove any remaining pruning-related code." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ No pruning references found in source code" -ForegroundColor Green
}

# 3. Check settings schema for pruning options
Write-Host "`n=== Checking Settings Schema ===" -ForegroundColor Cyan
$settingsMeta = Get-Content -Path ".\libs\settings\settings.meta.ts" -Raw
if ($settingsMeta -match "prun") {
    Write-Host "❌ Found 'prun' in settings.meta.ts" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ No pruning settings found in settings.meta.ts" -ForegroundColor Green
}

# 4. Check config for pruning options
Write-Host "`n=== Checking Config Files ===" -ForegroundColor Cyan
$configFiles = @(
    "apps/backend/src/modules/config/config.ts",
    "apps/backend/src/modules/config/migration.ts"
)

$configIssues = $false
foreach ($file in $configFiles) {
    $content = Get-Content -Path $file -Raw
    if ($content -match "prun") {
        Write-Host "❌ Found 'prun' in $file" -ForegroundColor Red
        $configIssues = $true
    }
}

if (-not $configIssues) {
    Write-Host "✅ No pruning config found in config files" -ForegroundColor Green
} else {
    exit 1
}

# 5. Start the application and check logs
Write-Host "`n=== Starting Application ===" -ForegroundColor Cyan
try {
    # Start the application in detached mode
    docker-compose up -d
    
    # Wait for the application to start (adjust timeout as needed)
    $timeout = 30
    $started = $false
    
    for ($i = 0; $i -lt $timeout; $i++) {
        $logs = docker-compose logs --tail=50 2>&1
        if ($logs -match "Server listening") {
            $started = $true
            break
        }
        Start-Sleep -Seconds 1
    }
    
    if (-not $started) {
        throw "Application failed to start within $timeout seconds"
    }
    
    Write-Host "✅ Application started successfully" -ForegroundColor Green
    
    # Check for pruning-related startup errors
    $logs = docker-compose logs 2>&1
    if ($logs -match "prun") {
        Write-Host "❌ Found 'prun' in application logs:" -ForegroundColor Red
        $logs | Select-String "prun" | ForEach-Object { Write-Host "  - $_" }
        exit 1
    } else {
        Write-Host "✅ No pruning-related errors in logs" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error starting application: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up
    Write-Host "`n=== Cleaning Up ===" -ForegroundColor Cyan
    docker-compose down
}

Write-Host "`n=== All Tests Passed ===" -ForegroundColor Green
