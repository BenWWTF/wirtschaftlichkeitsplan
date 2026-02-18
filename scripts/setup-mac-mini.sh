#!/bin/bash

# ================================================================
# Wirtschaftlichkeitsplan Mac Mini Setup Script
# Automates: Node.js check, Tailscale setup, app installation, launchd service
# ================================================================

set -e

echo "🚀 Starting wirtschaftlichkeitsplan deployment to Mac mini..."
echo ""

# ================================================================
# 1. Check Node.js
# ================================================================
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install with:"
    echo "   brew install node"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION found"
echo ""

# ================================================================
# 2. Check pnpm
# ================================================================
echo "📦 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "⚙️  Installing pnpm..."
    npm install -g pnpm
fi
PNPM_VERSION=$(pnpm -v)
echo "✓ pnpm $PNPM_VERSION ready"
echo ""

# ================================================================
# 3. Determine username and paths
# ================================================================
USERNAME=$(whoami)
APPS_DIR=~/apps
APP_DIR=$APPS_DIR/wirtschaftlichkeitsplan
LOGS_DIR=$APP_DIR/logs

echo "👤 Current user: $USERNAME"
echo "📁 App directory: $APP_DIR"
echo ""

# ================================================================
# 4. Clone or update repo
# ================================================================
if [ ! -d "$APP_DIR" ]; then
    echo "📥 Cloning repository..."
    mkdir -p $APPS_DIR
    cd $APPS_DIR

    # Ask for repo URL
    read -p "Enter GitHub repository URL (or press Enter for default): " REPO_URL
    if [ -z "$REPO_URL" ]; then
        echo "❌ Repository URL required"
        exit 1
    fi

    git clone "$REPO_URL" wirtschaftlichkeitsplan
else
    echo "✓ App directory exists, updating..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR
echo "✓ Repository ready"
echo ""

# ================================================================
# 5. Install dependencies and build
# ================================================================
echo "📚 Installing dependencies..."
pnpm install

echo "🔨 Building app..."
pnpm build

echo "✓ Build complete"
echo ""

# ================================================================
# 6. Setup launchd service
# ================================================================
echo "⚙️  Setting up 24/7 service..."

# Create logs directory
mkdir -p $LOGS_DIR

# Create plist file
PLIST_PATH="$HOME/Library/LaunchAgents/com.wirtschaftlichkeitsplan.plist"

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.wirtschaftlichkeitsplan</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>--max-old-space-size=512</string>
        <string>$APP_DIR/node_modules/.bin/next</string>
        <string>start</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$APP_DIR</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>$LOGS_DIR/out.log</string>

    <key>StandardErrorPath</key>
    <string>$LOGS_DIR/error.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3000</string>
    </dict>

    <key>StandardErrorPath</key>
    <string>$LOGS_DIR/error.log</string>

    <key>StandardOutPath</key>
    <string>$LOGS_DIR/out.log</string>
</dict>
</plist>
EOF

echo "✓ Created launchd plist at $PLIST_PATH"
echo ""

# ================================================================
# 7. Load service
# ================================================================
echo "🚀 Starting service..."

# Unload if already exists
launchctl unload "$PLIST_PATH" 2>/dev/null || true

# Load service
launchctl load "$PLIST_PATH"

# Start it
launchctl start com.wirtschaftlichkeitsplan

sleep 2

# Verify
if launchctl list | grep -q wirtschaftlichkeitsplan; then
    echo "✓ Service started successfully"
else
    echo "⚠️  Warning: Service may not have started"
fi

echo ""

# ================================================================
# 8. Tailscale setup prompt
# ================================================================
echo "🌐 Tailscale Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v tailscale &> /dev/null; then
    echo "⚙️  Installing Tailscale..."
    brew install tailscale
    brew services start tailscale
fi

if ! tailscale status &>/dev/null; then
    echo "👤 Tailscale not authenticated yet"
    echo "Run: sudo tailscale up"
    echo "Then authenticate in your browser"
else
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
    echo "✓ Tailscale active"
    echo "  Your Tailscale IP: $TAILSCALE_IP"
fi

echo ""

# ================================================================
# 9. Summary
# ================================================================
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Access the app:"
echo "   Local:     http://localhost:3000"
echo "   Network:   http://192.168.0.105:3000"
echo "   Tailscale: http://100.64.x.x:3000 (ask for IP with: tailscale status)"
echo ""
echo "📋 Service commands:"
echo "   View status:   launchctl list | grep wirtschaft"
echo "   View logs:     tail -f $LOGS_DIR/error.log"
echo "   Restart:       launchctl restart com.wirtschaftlichkeitsplan"
echo "   Stop:          launchctl stop com.wirtschaftlichkeitsplan"
echo ""
echo "🔄 To update code:"
echo "   cd $APP_DIR"
echo "   git pull"
echo "   pnpm install  # if dependencies changed"
echo "   pnpm build"
echo "   launchctl restart com.wirtschaftlichkeitsplan"
echo ""
echo "👰 Share Tailscale IP with wife for easy access!"
echo ""
