# Access Guide for Wife's MacBook

Your husband's Mac mini is running the Wirtschaftlichkeitsplan app and it's ready for you to use!

## 🚀 Quick Start - Bookmark Method (Easiest)

1. **Ask your husband for his Mac mini's Tailscale IP** (looks like `100.64.x.x`)
   - He can get it by running: `tailscale status`

2. **In Vivaldi browser, create a bookmark:**
   - Go to: `http://100.64.x.x:3000` (replace `x.x` with actual numbers)
   - Press `Ctrl+D` (or `Cmd+D` on Mac) to bookmark
   - Name it: `Wirtschaftlichkeitsplan`
   - Click the bookmark whenever you need it!

**That's it!** You can now access the app anytime your husband's Mac mini is running.

---

## 🎯 Advanced Option - App Icon (Mac App Look)

If you want an app-like icon to click on your Mac:

### Option A: Using Vivaldi's Web App Mode (Recommended)

1. Open the app in Vivaldi: `http://100.64.x.x:3000`
2. Click **Menu** (☰) → **Tools** → **Create Web App**
3. Name: `Wirtschaftlichkeitsplan`
4. Click **Create**
5. The app now appears in **Launchpad** and **Spotlight search**
6. You can pin it to your Dock for quick access

### Option B: Using macOS Automator (Advanced)

If you want a simple clickable icon on your Desktop:

1. Open **Automator** (search in Spotlight)
2. Create new → **Application**
3. Add action: **"Open URL"**
4. Paste: `http://100.64.x.x:3000`
5. **File** → **Save as** → Name: `Wirtschaftlichkeitsplan`
6. Save to **Desktop** or **Applications**
7. Now you have a double-clickable app!

---

## 🔧 What to Do If It Doesn't Work

### App Not Loading?
- **Ask your husband:** Is the Mac mini turned on? Is Tailscale running?
  - He can check: `launchctl list | grep wirtschaft`
  - He can restart: `launchctl restart com.wirtschaftlichkeitsplan`

### "Can't connect to server"?
- Check that you're on the same **Tailscale network** as the Mac mini
- Make sure Tailscale is running on your MacBook (look for the icon in top menu bar)
- Try a different network (WiFi vs cellular)

### Still not working?
- Ask your husband to check the logs: `tail -20 ~/apps/wirtschaftlichkeitsplan/logs/error.log`

---

## 💡 How It Works

- Your husband's Mac mini runs the app 24/7
- Tailscale creates a **secure private network** between your MacBook and his Mac
- You connect via the Tailscale IP address (`100.64.x.x`)
- Everything is encrypted and secure — no one else can access it

---

## ⚡ Quick Tips

✅ **Bookmark is easiest** - Just one click in Vivaldi
✅ **App icon is nice** - Looks like a real macOS app
✅ **Both methods work** - Choose what feels comfortable
✅ **No password needed** - Tailscale handles security

---

## 📞 Need Help?

Ask your husband for:
- The Tailscale IP (100.64.x.x)
- Help creating the bookmark or app icon
- Restart the service if something seems slow

That's all you need! Enjoy using the app. 🎉
