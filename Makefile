.PHONY: help dev build start stop restart logs status deploy update clean

APP_DIR := $(shell pwd)
SERVICE_NAME := com.wirtschaftlichkeitsplan
LOGS_DIR := $(APP_DIR)/logs

help:
	@echo "Wirtschaftlichkeitsplan - Mac Mini Deployment"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "🚀 Setup & Deployment:"
	@echo "  make setup         Setup from scratch (runs setup-mac-mini.sh)"
	@echo "  make deploy        Deploy code (git pull, build, restart)"
	@echo "  make update        Update dependencies (pnpm install)"
	@echo ""
	@echo "⚙️  Service Management:"
	@echo "  make start         Start service"
	@echo "  make stop          Stop service"
	@echo "  make restart       Restart service"
	@echo "  make status        Check service status"
	@echo ""
	@echo "📊 Monitoring:"
	@echo "  make logs          Show recent errors (last 20 lines)"
	@echo "  make logs-live     Watch logs in real-time"
	@echo "  make logs-all      Show all log output"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  make clean         Remove node_modules and .next"
	@echo "  make ip            Get Tailscale IP for wife's access"
	@echo ""
	@echo "💻 Local Development:"
	@echo "  make dev           Run dev server (localhost:3000)"
	@echo "  make build         Build for production"
	@echo ""

# ================================================================
# SETUP & DEPLOYMENT
# ================================================================

setup:
	@echo "Running setup script..."
	@bash scripts/setup-mac-mini.sh

deploy:
	@echo "🚀 Deploying code..."
	@cd $(APP_DIR)
	@echo "  📥 Pulling latest code..."
	@git pull origin main
	@echo "  📚 Installing dependencies..."
	@pnpm install --frozen-lockfile 2>/dev/null || pnpm install
	@echo "  🔨 Building..."
	@pnpm build
	@echo "  🔄 Restarting service..."
	@launchctl restart $(SERVICE_NAME)
	@echo "✅ Deployment complete!"

update:
	@echo "📚 Updating dependencies..."
	@pnpm install
	@echo "✅ Dependencies updated"

# ================================================================
# SERVICE MANAGEMENT
# ================================================================

start:
	@launchctl start $(SERVICE_NAME)
	@echo "✅ Service started"

stop:
	@launchctl stop $(SERVICE_NAME)
	@echo "✅ Service stopped"

restart:
	@echo "🔄 Restarting service..."
	@launchctl stop $(SERVICE_NAME) 2>/dev/null || true
	@sleep 1
	@launchctl start $(SERVICE_NAME)
	@sleep 2
	@if launchctl list | grep -q $(SERVICE_NAME); then \
		echo "✅ Service restarted successfully"; \
	else \
		echo "⚠️  Service may have failed to start"; \
		echo "Run 'make logs' to see errors"; \
	fi

status:
	@echo "Service Status:"
	@if launchctl list | grep -q $(SERVICE_NAME); then \
		echo "  ✅ Running"; \
	else \
		echo "  ❌ Not running"; \
	fi
	@echo ""
	@echo "Tailscale IP:"
	@tailscale ip -4 2>/dev/null || echo "  ⚠️  Not connected (run: sudo tailscale up)"

# ================================================================
# MONITORING & LOGS
# ================================================================

logs:
	@tail -20 $(LOGS_DIR)/error.log

logs-live:
	@echo "📊 Watching logs (Ctrl+C to exit)..."
	@tail -f $(LOGS_DIR)/error.log

logs-all:
	@cat $(LOGS_DIR)/error.log

# ================================================================
# TAILSCALE & ACCESS
# ================================================================

ip:
	@echo "🌐 Tailscale IP for wife's MacBook:"
	@tailscale ip -4
	@echo ""
	@echo "Share this with your wife:"
	@echo "  http://$$(tailscale ip -4):3000"

# ================================================================
# LOCAL DEVELOPMENT
# ================================================================

dev:
	@pnpm dev

build:
	@pnpm build

clean:
	@echo "🧹 Cleaning..."
	@rm -rf node_modules .next
	@echo "✅ Cleaned"

# ================================================================
# MISC
# ================================================================

.DEFAULT_GOAL := help
