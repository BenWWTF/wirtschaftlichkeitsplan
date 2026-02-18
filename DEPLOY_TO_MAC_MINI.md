# Deploy to Mac Mini - Quick Start

Everything you need to deploy the app to your Mac mini with Tailscale for your wife.

## 🚀 One-Command Setup

On your **Mac mini**, run:

```bash
bash ~/Desktop/claude/wirtschaftlichkeitsplan/scripts/setup-mac-mini.sh
```

This will:
✅ Check Node.js & pnpm
✅ Clone/update the repository
✅ Install dependencies
✅ Build the app
✅ Create a 24/7 launchd service with **auto-restart on crash**
✅ Setup Tailscale (if needed)
✅ Show you the Tailscale IP to give your wife

**Time:** ~5-10 minutes (first run), ~2 minutes (updates)

---

## 📱 For Your Wife's MacBook

Send her the `WIFE_ACCESS_GUIDE.md` file. TL;DR:

1. Get your Tailscale IP: `make ip`
2. She creates a bookmark in Vivaldi: `http://100.64.x.x:3000`
3. Done! She clicks it anytime.

---

## 📋 Common Commands (After Setup)

```bash
cd ~/apps/wirtschaftlichkeitsplan

# Check if app is running
make status

# Get your Tailscale IP to share
make ip

# View logs if something's wrong
make logs-live

# Update code from git
make deploy

# Restart the service
make restart

# See all available commands
make help
```

---

## 🔄 Updating Code

When you have changes to deploy:

```bash
cd ~/apps/wirtschaftlichkeitsplan
make deploy
```

This automatically:
- Pulls latest code
- Installs dependencies
- Rebuilds
- Restarts the service

---

## ⚠️ If Something Goes Wrong

**App won't start:**
```bash
make logs
# Shows errors in production
```

**Service crashed:**
```bash
make restart
# Automatically restarts due to KeepAlive=true
```

**Tailscale not connected:**
```bash
sudo tailscale up
# Authenticate in browser, then your wife can connect
```

**Wife can't reach the app:**
1. Verify your Tailscale IP: `make ip`
2. Share the full URL: `http://100.64.x.x:3000` (replace x.x)
3. Check she's on same Tailscale account
4. Check Mac mini service is running: `make status`

---

## 🎯 Optional: Fancy App Icon for Wife

If she wants an app icon instead of a bookmark:

**Vivaldi Web App (Easiest):**
1. Open `http://100.64.x.x:3000`
2. Vivaldi menu → **Tools** → **Create Web App**
3. The app now appears in Launchpad & Spotlight

**More details:** See `WIFE_ACCESS_GUIDE.md`

---

## 📊 What's Running

- **Service:** com.wirtschaftlichkeitsplan
- **Port:** 3000 (internal)
- **Access:** Tailscale only (secure private network)
- **Auto-restart:** Yes, on any crash
- **Logs:** `~/apps/wirtschaftlichkeitsplan/logs/`

---

## 🛠️ Help

**Setup issues?**
```bash
bash ~/Desktop/claude/wirtschaftlichkeitsplan/scripts/setup-mac-mini.sh
# Will walk you through any problems
```

**Need more info?**
- See `DEPLOYMENT_TAILSCALE.md` for detailed troubleshooting
- See `WIFE_ACCESS_GUIDE.md` for wife-friendly instructions

---

## ✨ You're All Set!

The app will run 24/7 on your Mac mini, restart automatically if it crashes, and your wife can access it securely through Tailscale.

**Next step:** Run the setup script! 🚀
