# Deployment Guide: wirtschaftlichkeitsplan on Mac Mini with Tailscale

**Goal**: Deploy app on Mac Mini (Vienna, Austria) for wife's MacBook access via Tailscale private network.

## Quick Overview

| Item | Value |
|------|-------|
| **Domain** | finance.hinterbuchinger.com (optional, not needed for Tailscale) |
| **Home IP** | 84.115.209.144 (static, T-Mobile Austria) |
| **Access Method** | Tailscale (private encrypted network) |
| **App** | Next.js 16 + Supabase |
| **Port** | 3000 (internal) |
| **Service** | macOS launchd (auto-restart) |

## Deployment Steps

### Phase 1: Mac Mini Setup (Local Machine)

**Prerequisites:**
- [ ] Node.js 20+ installed
  ```bash
  node --version  # Should be v20+
  ```
- [ ] pnpm installed
  ```bash
  npm install -g pnpm
  pnpm --version
  ```
- [ ] Git installed
  ```bash
  git --version
  ```

**Clone & Install:**
```bash
# Create apps directory
mkdir -p ~/apps
cd ~/apps

# Clone repo
git clone https://github.com/[YOUR-ORG]/wirtschaftlichkeitsplan.git
cd wirtschaftlichkeitsplan

# Copy environment
cp .env.local.example .env.local
# Edit .env.local - add your Supabase credentials

# Install dependencies
pnpm install

# Build
pnpm build
```

### Phase 2: Tailscale Setup

**On Mac Mini:**
```bash
# Install Tailscale
brew install tailscale
brew services start tailscale

# Authenticate
sudo tailscale up
# Opens browser - sign in with Google/GitHub

# Get Tailscale IP
tailscale ip -4
# Example output: 100.64.45.32

# Get hostname
tailscale status
# Example: mac-mini-local.tail12345.ts.net
```

**On Wife's MacBook:**
```bash
# Install Tailscale
brew install tailscale

# Sign in with same account as Mac Mini
# Automatically joins network
```

### Phase 3: Setup 24/7 Service (launchd)

**Create server script:**
```bash
cat > ~/apps/wirtschaftlichkeitsplan/server.js <<'EOF'
const http = require('http');
const { createServer } = require('http');
const next = require('next');

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(3000, '0.0.0.0', () => {
    console.log('✓ Server running on http://0.0.0.0:3000');
  });
});
EOF
```

**Create logs directory:**
```bash
mkdir -p ~/apps/wirtschaftlichkeitsplan/logs
```

**Create launchd plist:**
```bash
cat > ~/Library/LaunchAgents/com.wirtschaftlichkeitsplan.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.wirtschaftlichkeitsplan</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/YOUR_USERNAME/apps/wirtschaftlichkeitsplan/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/apps/wirtschaftlichkeitsplan</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/apps/wirtschaftlichkeitsplan/logs/out.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/apps/wirtschaftlichkeitsplan/logs/error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
EOF
```
⚠️ **Replace `YOUR_USERNAME` with your actual Mac username!**

**Load service:**
```bash
launchctl load ~/Library/LaunchAgents/com.wirtschaftlichkeitsplan.plist
launchctl start com.wirtschaftlichkeitsplan

# Verify it started
launchctl list | grep wirtschaftlichkeitsplan
```

### Phase 4: Testing

**From wife's MacBook (same Tailscale network):**

1. Get Mac Mini IP:
   ```bash
   tailscale status
   # Find the 100.64.x.x IP
   ```

2. Open browser:
   ```
   http://100.64.45.32:3000
   # (replace with actual IP)
   ```

3. Test functionality:
   - Login ✅
   - View dashboard ✅
   - Create test entries ✅
   - Navigation ✅
   - Logout ✅

4. Test from different networks:
   - Home WiFi ✅
   - Cellular/mobile data ✅
   - Different location ✅

## Monitoring & Maintenance

**Check service status:**
```bash
launchctl list | grep wirtschaftlichkeitsplan
```

**View logs:**
```bash
# Recent errors
tail -20 ~/apps/wirtschaftlichkeitsplan/logs/error.log

# Live monitoring
tail -f ~/apps/wirtschaftlichkeitsplan/logs/error.log
```

**Restart service:**
```bash
launchctl restart com.wirtschaftlichkeitsplan
```

**Stop service:**
```bash
launchctl stop com.wirtschaftlichkeitsplan
```

**Unload service (permanent):**
```bash
launchctl unload ~/Library/LaunchAgents/com.wirtschaftlichkeitsplan.plist
```

## Updating the App

When you have new code to deploy:

```bash
# On Mac Mini
cd ~/apps/wirtschaftlichkeitsplan
git pull origin main
pnpm install  # if dependencies changed
pnpm build

# Restart service
launchctl restart com.wirtschaftlichkeitsplan

# Monitor
tail -f ~/apps/wirtschaftlichkeitsplan/logs/error.log
```

## Troubleshooting

**App not starting:**
```bash
# Check logs
cat ~/apps/wirtschaftlichkeitsplan/logs/error.log

# Try manual start to see errors
/usr/local/bin/node ~/apps/wirtschaftlichkeitsplan/server.js
```

**Can't connect from wife's MacBook:**
- Verify both devices signed in to same Tailscale account
- Check Tailscale status: `tailscale status`
- Verify Mac Mini service is running: `launchctl list | grep wirtschaft`
- Check firewall not blocking: `sudo pfctl -s nat`

**Slow performance:**
- Check Mac Mini CPU: `top -l 1 | head -20`
- Check network: `ping 100.64.x.x`
- Check logs for errors

## Optional: Public Access via Domain

If you want public access later (not needed for wife's MacBook):

1. Configure DNS: `finance.hinterbuchinger.com` → `84.115.209.144`
2. Set up port forwarding: router 80/443 → Mac Mini 80/443
3. Get SSL certificate: `certbot`
4. Run reverse proxy (nginx) on port 80/443 → 3000

But this is **NOT required** for current setup with Tailscale! ✅

## Security

**With Tailscale:**
- ✅ Encrypted tunnel
- ✅ No open ports
- ✅ Device-to-device authentication
- ✅ Works through firewalls/NAT
- ✅ No public internet exposure

**Best practices:**
- Keep Tailscale updated
- Enable 2FA on Tailscale account
- Monitor connected devices
- Log out if not using for extended time
