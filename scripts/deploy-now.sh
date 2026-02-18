#!/bin/bash

# ================================================================
# Wirtschaftlichkeitsplan Mac Mini Deployment
# Uses local code, no GitHub URL needed
# ================================================================

set -e

echo "🚀 Deploying wirtschaftlichkeitsplan to Mac mini..."
echo ""

# ================================================================
# 1. Check prerequisites
# ================================================================
echo "📦 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install with: brew install node"
    exit 1
fi
echo "✓ Node.js $(node -v)"

if ! command -v pnpm &> /dev/null; then
    echo "⚙️  Installing pnpm..."
    npm install -g pnpm
fi
echo "✓ pnpm $(pnpm -v)"

echo ""

# ================================================================
# 2. Setup app directory
# ================================================================
USERNAME=$(whoami)
APPS_DIR=~/apps
APP_DIR=$APPS_DIR/wirtschaftlichkeitsplan
LOGS_DIR=$APP_DIR/logs
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "📁 Setting up directories..."
mkdir -p $APPS_DIR
mkdir -p $LOGS_DIR

# Use code in place or copy without node_modules
if [ "$SOURCE_DIR" != "$APP_DIR" ]; then
    echo "  📋 Copying code from $SOURCE_DIR..."
    rsync -av --exclude=node_modules --exclude=.next --exclude=dist "$SOURCE_DIR/" "$APP_DIR/"
fi

cd $APP_DIR
echo "✓ App directory: $APP_DIR"
echo ""

# ================================================================
# 3. Install & Build
# ================================================================
echo "📚 Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo "🔨 Building for production..."
pnpm build

echo "✓ Build complete"
echo ""

# ================================================================
# 4. Setup launchd service
# ================================================================
echo "⚙️  Creating 24/7 service..."

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
</dict>
</plist>
EOF

echo "✓ Service file created"
echo ""

# ================================================================
# 5. Load & start service
# ================================================================
echo "🚀 Starting service..."

# Unload if exists
launchctl unload "$PLIST_PATH" 2>/dev/null || true
sleep 1

# Load and start
launchctl load "$PLIST_PATH"
launchctl start com.wirtschaftlichkeitsplan

sleep 3

# Verify
if launchctl list | grep -q wirtschaftlichkeitsplan; then
    echo "✓ Service started!"
else
    echo "⚠️  Checking logs..."
    tail -10 $LOGS_DIR/error.log
fi

echo ""

# ================================================================
# 6. Tailscale check
# ================================================================
echo "🌐 Tailscale"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v tailscale &> /dev/null; then
    echo "⚙️  Installing Tailscale..."
    brew install tailscale
    brew services start tailscale
    echo "Run: sudo tailscale up"
fi

if tailscale status &>/dev/null; then
    TAILSCALE_IP=$(tailscale ip -4)
    echo "✓ Tailscale: $TAILSCALE_IP"
else
    echo "⚠️  Tailscale not authenticated"
    echo "Run: sudo tailscale up"
fi

echo ""

# ================================================================
# 7. Summary
# ================================================================
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 App location:  $APP_DIR"
echo "📊 Logs:          $LOGS_DIR"
echo ""
echo "🌐 Access URLs:"
echo "   Local:     http://localhost:3000"
echo "   Network:   http://192.168.0.105:3000"
if tailscale status &>/dev/null; then
    echo "   Tailscale: http://$(tailscale ip -4):3000"
fi
echo ""
echo "📋 Service commands:"
echo "   cd $APP_DIR && make help"
echo ""
echo "✨ Share this with your wife:"
if tailscale status &>/dev/null; then
    echo "   http://$(tailscale ip -4):3000"
fi
echo ""
