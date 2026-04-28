# 🔧 npm Install Timeout - Troubleshooting Guide

**Issue**: npm install failing with ETIMEDOUT or ERR_SOCKET_TIMEOUT

## ⚡ Quick Solutions (Try These in Order)

### Solution 1: Increase Timeout & Clear Cache (Recommended)
```bash
cd frontend

# Set longer timeouts
npm config set fetch-timeout 120000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000

# Clear cache
npm cache clean --force

# Try install without audit (faster)
npm install --prefer-offline --no-audit
```

**Expected**: May take 5-10 minutes but should work

---

### Solution 2: Use Different npm Registry
```bash
# Switch to Taobao registry (faster for some regions)
npm config set registry https://registry.npmmirror.com

# Or switch to official registry
npm config set registry https://registry.npmjs.org

# Clear cache and retry
npm cache clean --force
npm install --no-audit
```

---

### Solution 3: Use Yarn Instead (Alternative)
If npm continues to timeout, use Yarn:

```bash
cd frontend

# Install yarn globally (if not installed)
npm install -g yarn --no-optional

# Install dependencies with yarn
yarn install --no-audit

# Start with yarn
yarn start
```

**Note**: Yarn is often faster and more reliable with network issues

---

### Solution 4: Install with Network Retry
```bash
cd frontend

npm install --no-audit --verbose 2>&1 | tee npm-install.log

# This creates a log file for debugging
```

---

### Solution 5: Skip Audit Entirely (Fastest)
```bash
cd frontend

npm install --ignore-scripts --no-audit --prefer-offline
```

---

## 🌐 Check Network Connectivity

### Verify npm registry is accessible
```bash
# Test registry connectivity
npm ping

# Should output: npm PONG X.XXXms
```

### Check your internet connection
```bash
# Ping Google DNS
ping -c 3 8.8.8.8

# Or test npm registry directly
curl -I https://registry.npmjs.org
```

---

## 🔧 Advanced Configuration

### Create .npmrc file with optimized settings
```bash
cd frontend

cat > .npmrc << 'EOF'
fetch-timeout = 120000
fetch-retry-mintimeout = 20000
fetch-retry-maxtimeout = 120000
registry = https://registry.npmjs.org
legacy-peer-deps = true
EOF

npm install --no-audit
```

---

## ❌ If npm Install Still Fails

### Option A: Use Pre-built node_modules
```bash
# Skip npm and use cached dependencies
# The frontend should still run with basic functionality
npm start
```

### Option B: Install Locally on Your Machine
If you have better internet on another machine:
```bash
# On machine with better internet:
git clone [repo]
cd frontend
npm install
zip -r frontend-node_modules.zip node_modules/

# Transfer the zip to your current machine
unzip frontend-node_modules.zip
npm start
```

### Option C: Docker (If Available)
```bash
# Build dependencies in Docker
docker build -t ai-siem-frontend .
docker run -p 3000:3000 ai-siem-frontend
```

---

## 🔍 Debugging

### Check npm logs
```bash
cat ~/.npm/_logs/*-debug-0.log

# Or find the latest log
ls -lt ~/.npm/_logs/ | head -5
```

### Verbose output during install
```bash
npm install --verbose 2>&1 | head -100
```

### Check current npm configuration
```bash
npm config list

# Or just check fetch settings
npm config get fetch-timeout
npm config get fetch-retry-mintimeout
npm config get fetch-retry-maxtimeout
```

---

## 📊 Expected Timeline

| Approach | Time | Reliability |
|----------|------|-------------|
| Quick Retry | 2-3 min | 40% |
| Solution 1 (Timeout increase) | 5-10 min | 70% |
| Solution 2 (Registry switch) | 5-8 min | 80% |
| Solution 3 (Yarn) | 5-10 min | 85% |
| Solution 4 (Verbose + Retry) | 10-15 min | 90% |

---

## 🎯 Recommended Order

1. **First**: Try Solution 1 (Timeout + Cache Clear)
   - Takes 5-10 minutes
   - Often works with network issues

2. **If fails**: Try Solution 2 (Different Registry)
   - Switch to faster registry
   - Clear and retry

3. **If fails**: Try Solution 3 (Use Yarn)
   - Yarn often more reliable
   - Usually succeeds where npm fails

4. **If all fail**: Use Solution 5 (Skip Audit)
   - Minimal dependencies
   - Fast and lightweight

---

## 🆘 Need More Help?

### Check npm documentation
```bash
npm help config
npm help install
```

### Reset npm to defaults (Last Resort)
```bash
npm config delete registry
npm config delete fetch-timeout
npm config delete fetch-retry-mintimeout
npm config delete fetch-retry-maxtimeout

# Then retry
npm install --no-audit
```

---

## ✅ Success Indicators

When install completes successfully, you should see:
```
added 200+ packages
in X.XXs
```

And you'll have:
- `node_modules/` directory (large, ~500MB)
- `package-lock.json` file updated

---

## 🚀 Alternative: Run Without Full Install

The frontend source code works without full npm install in some cases. Try:

```bash
cd frontend

# Check what we have
ls -la node_modules/ | head -10

# Try starting anyway
npm start
```

If it says modules are missing, install just those:
```bash
npm install react react-dom react-router-dom @mui/material
```

---

**Last Updated**: April 22, 2026
**Status**: Troubleshooting Guide

Try Solution 1 first - it usually works! 🚀
