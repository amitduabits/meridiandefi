# ─────────────────────────────────────────────────────────────────────────────
# Meridian Railway Deployment Script
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   1. Get your Railway API token: https://railway.app/account/tokens
#   2. Run: $env:RAILWAY_TOKEN="your_token_here"; .\deploy-railway.ps1
#      OR:  Set-Item -Path Env:RAILWAY_TOKEN -Value "your_token_here"
#           .\deploy-railway.ps1
#
# Prerequisites:
#   - Railway CLI installed: npm install -g @railway/cli
#   - Railway account at railway.app
#   - An Alchemy API key for Arbitrum Sepolia RPC
#   - Anthropic API key
# ─────────────────────────────────────────────────────────────────────────────

param(
    [string]$AnthropicKey = $env:ANTHROPIC_API_KEY,
    [string]$ArbSepoliaRpc = $env:ARB_SEPOLIA_RPC_URL,
    [string]$AgentPrivKey = "0xfc989d556b4e028cfb9bbc913ea7bbe45f26b61441080df0dfd1a68da22be865"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Meridian — Railway Deployment" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Check prerequisites ─────────────────────────────────────────────────────

if (-not $env:RAILWAY_TOKEN) {
    Write-Host "ERROR: RAILWAY_TOKEN not set." -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your token:" -ForegroundColor Yellow
    Write-Host "  1. Go to https://railway.app/account/tokens" -ForegroundColor Yellow
    Write-Host "  2. Create a new token" -ForegroundColor Yellow
    Write-Host "  3. Run:" -ForegroundColor Yellow
    Write-Host '     $env:RAILWAY_TOKEN="your_token_here"; .\deploy-railway.ps1' -ForegroundColor White
    exit 1
}

if (-not $AnthropicKey -or $AnthropicKey -eq "sk-...") {
    Write-Host "ERROR: ANTHROPIC_API_KEY not set or is a placeholder." -ForegroundColor Red
    Write-Host "Set it in .env or pass: -AnthropicKey 'sk-ant-...'" -ForegroundColor Yellow
    exit 1
}

if (-not $ArbSepoliaRpc -or $ArbSepoliaRpc -match "YOUR_KEY") {
    Write-Host "ERROR: ARB_SEPOLIA_RPC_URL not set." -ForegroundColor Red
    Write-Host "Get a free key at https://alchemy.com and pass: -ArbSepoliaRpc 'https://arb-sepolia...'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Prerequisites OK" -ForegroundColor Green
Write-Host ""

$repoRoot = $PSScriptRoot

# ── Deploy API Server ────────────────────────────────────────────────────────

Write-Host "Step 1/4 — Deploying API Server (packages/server)..." -ForegroundColor Cyan

Push-Location $repoRoot
try {
    # Link to/create Railway project for server
    Write-Host "  Initializing Railway project 'meridian-api'..." -ForegroundColor Gray
    railway init --name meridian-api 2>&1 | Write-Host -ForegroundColor Gray

    # Deploy using repo root as context, server Dockerfile
    Write-Host "  Uploading and building server..." -ForegroundColor Gray
    railway up --dockerfile packages/server/Dockerfile --detach 2>&1 | Write-Host -ForegroundColor Gray

    Write-Host "  Setting environment variables..." -ForegroundColor Gray
    railway variables set NODE_ENV=production
    railway variables set PORT=3001
    railway variables set "CORS_ORIGINS=https://app.meridianagents.xyz,https://meridianagents.xyz"
    railway variables set "ANTHROPIC_API_KEY=$AnthropicKey"
    railway variables set "ARB_SEPOLIA_RPC_URL=$ArbSepoliaRpc"

    Write-Host "  Adding custom domain api.meridianagents.xyz..." -ForegroundColor Gray
    railway domain --domain api.meridianagents.xyz 2>&1 | Write-Host -ForegroundColor Gray

    Write-Host "✓ API Server deployed" -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host ""

# ── Deploy DeFi Rebalancer Agent ─────────────────────────────────────────────

Write-Host "Step 2/4 — Deploying DeFi Rebalancer Agent (examples/defi-rebalancer)..." -ForegroundColor Cyan

Push-Location $repoRoot
try {
    # Create a new service in the same project
    Write-Host "  Initializing Railway project 'meridian-agent'..." -ForegroundColor Gray
    # Need to link to a new project or use --service flag
    # Using separate project for isolation
    railway init --name meridian-agent 2>&1 | Write-Host -ForegroundColor Gray

    Write-Host "  Uploading and building agent..." -ForegroundColor Gray
    railway up --dockerfile examples/defi-rebalancer/Dockerfile --detach 2>&1 | Write-Host -ForegroundColor Gray

    Write-Host "  Setting environment variables..." -ForegroundColor Gray
    railway variables set NODE_ENV=production
    railway variables set PORT=3002
    railway variables set DRY_RUN=false
    railway variables set "ANTHROPIC_API_KEY=$AnthropicKey"
    railway variables set "RPC_URL=$ArbSepoliaRpc"
    railway variables set "PRIVATE_KEY=$AgentPrivKey"
    railway variables set TICK_INTERVAL_SEC=60
    railway variables set DRIFT_THRESHOLD=0.05

    Write-Host "✓ DeFi Rebalancer Agent deployed" -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host ""

# ── Summary ──────────────────────────────────────────────────────────────────

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Services deployed:" -ForegroundColor White
Write-Host "  API Server:  https://api.meridianagents.xyz/health" -ForegroundColor Cyan
Write-Host "  Agent:       Running 24/7, check Railway dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "DNS Records to add at your domain registrar:" -ForegroundColor Yellow
Write-Host "  Type  Name   Value" -ForegroundColor Yellow
Write-Host "  A     @      76.76.21.21   (meridianagents.xyz landing)" -ForegroundColor White
Write-Host "  A     www    76.76.21.21   (www redirect)" -ForegroundColor White
Write-Host "  A     app    76.76.21.21   (dashboard)" -ForegroundColor White
Write-Host "  A     docs   76.76.21.21   (documentation)" -ForegroundColor White
Write-Host "  CNAME api    <your-railway-domain>.up.railway.app" -ForegroundColor White
Write-Host ""
Write-Host "View logs: railway logs --service meridian-api" -ForegroundColor Gray
Write-Host "         : railway logs --service meridian-agent" -ForegroundColor Gray
Write-Host ""
