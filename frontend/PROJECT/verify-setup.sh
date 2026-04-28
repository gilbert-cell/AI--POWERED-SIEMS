#!/bin/bash

# 🚀 AI SIEM Frontend - Startup Verification Script
# This script verifies all dependencies and configurations are correct
# before starting the frontend development server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     AI SIEM Frontend - Startup Verification Script     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print test results
print_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASSED++))
    elif [ "$result" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $test_name"
        if [ -n "$details" ]; then
            echo -e "  ${RED}Error: $details${NC}"
        fi
        ((FAILED++))
    elif [ "$result" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $test_name"
        if [ -n "$details" ]; then
            echo -e "  ${YELLOW}Warning: $details${NC}"
        fi
        ((WARNINGS++))
    fi
}

echo -e "${BLUE}[1/7] Checking Node.js Installation${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "  Version: ${GREEN}$NODE_VERSION${NC}"
    print_result "Node.js installed" "PASS"
else
    print_result "Node.js installed" "FAIL" "Node.js is not installed"
fi
echo ""

echo -e "${BLUE}[2/7] Checking npm Installation${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "  Version: ${GREEN}$NPM_VERSION${NC}"
    print_result "npm installed" "PASS"
else
    print_result "npm installed" "FAIL" "npm is not installed"
fi
echo ""

echo -e "${BLUE}[3/7] Checking Project Directory Structure${NC}"
if [ -f "package.json" ]; then
    print_result "package.json exists" "PASS"
else
    print_result "package.json exists" "FAIL" "package.json not found. Are you in the frontend directory?"
fi

if [ -d "src" ]; then
    print_result "src/ directory exists" "PASS"
else
    print_result "src/ directory exists" "FAIL" "src/ directory not found"
fi

if [ -d "public" ]; then
    print_result "public/ directory exists" "PASS"
else
    print_result "public/ directory exists" "FAIL" "public/ directory not found"
fi
echo ""

echo -e "${BLUE}[4/7] Checking Dependencies${NC}"
if [ -d "node_modules" ]; then
    print_result "node_modules/ exists" "PASS"
    
    # Check for critical dependencies
    if [ -d "node_modules/react" ]; then
        REACT_VERSION=$(npm list react 2>/dev/null | grep react | head -1 | awk '{print $2}')
        echo -e "  React: ${GREEN}$REACT_VERSION${NC}"
        print_result "React installed" "PASS"
    else
        print_result "React installed" "FAIL" "React not found in node_modules"
    fi
    
    if [ -d "node_modules/@mui/material" ]; then
        print_result "Material-UI installed" "PASS"
    else
        print_result "Material-UI installed" "FAIL" "Material-UI not found in node_modules"
    fi
    
    if [ -d "node_modules/react-router-dom" ]; then
        print_result "React Router installed" "PASS"
    else
        print_result "React Router installed" "FAIL" "React Router not found in node_modules"
    fi
    
    if [ -d "node_modules/axios" ]; then
        print_result "Axios installed" "PASS"
    else
        print_result "Axios installed" "FAIL" "Axios not found in node_modules"
    fi
else
    print_result "Dependencies installed" "FAIL" "node_modules/ not found. Run 'npm install' first."
fi
echo ""

echo -e "${BLUE}[5/7] Checking Environment Configuration${NC}"
if [ -f ".env" ]; then
    print_result ".env file exists" "PASS"
    
    if grep -q "REACT_APP_API_URL" .env; then
        API_URL=$(grep "REACT_APP_API_URL" .env | cut -d '=' -f 2)
        echo -e "  API URL: ${GREEN}$API_URL${NC}"
        print_result "REACT_APP_API_URL configured" "PASS"
    else
        print_result "REACT_APP_API_URL configured" "WARN" "REACT_APP_API_URL not found in .env"
    fi
else
    print_result ".env file exists" "WARN" ".env file not found. Using defaults."
fi
echo ""

echo -e "${BLUE}[6/7] Checking Required Source Files${NC}"
REQUIRED_FILES=("src/index.js" "src/App.js" "src/index.css" "src/App.css" "public/index.html")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_result "File: $file" "PASS"
    else
        print_result "File: $file" "FAIL" "Required file not found"
    fi
done
echo ""

echo -e "${BLUE}[7/7] Checking Port Availability${NC}"
if ! netstat -tln 2>/dev/null | grep -q ":3000 "; then
    print_result "Port 3000 available" "PASS"
elif ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_result "Port 3000 available" "PASS"
else
    print_result "Port 3000 available" "WARN" "Port 3000 already in use. Will try different port."
fi
echo ""

# Print summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  VERIFICATION SUMMARY                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo -e "Results:"
    echo -e "  ${GREEN}Passed: $PASSED${NC}"
    echo -e "  ${YELLOW}Warnings: $WARNINGS${NC}"
    echo -e "  ${RED}Failed: $FAILED${NC}"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Ready to start! Run: npm start${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}✗ Verification failed!${NC}"
    echo ""
    echo -e "Results:"
    echo -e "  ${GREEN}Passed: $PASSED${NC}"
    echo -e "  ${YELLOW}Warnings: $WARNINGS${NC}"
    echo -e "  ${RED}Failed: $FAILED${NC}"
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}Please fix the errors above before proceeding.${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Common Fixes:${NC}"
    echo "1. Install Node.js from https://nodejs.org/"
    echo "2. Run: npm install"
    echo "3. Create .env file with: REACT_APP_API_URL=http://localhost:8000/api"
    exit 1
fi
