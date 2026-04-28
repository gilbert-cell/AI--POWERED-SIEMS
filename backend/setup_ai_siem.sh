#!/bin/bash
# AI-Powered SIEM Setup Script
# This script sets up the real AI threat detection system

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║    AI-Powered SIEM Setup - Real ML Threat Detection      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Get the backend directory
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BACKEND_DIR"

# Check if Python3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Parse command line arguments
STEPS="full"
MAX_ROWS=1000

while [[ $# -gt 0 ]]; do
    case $1 in
        --train-only)
            STEPS="train"
            shift
            ;;
        --load-data)
            STEPS="load"
            shift
            ;;
        --detect)
            STEPS="detect"
            shift
            ;;
        --full-setup)
            STEPS="full"
            shift
            ;;
        --max-rows)
            MAX_ROWS="$2"
            shift 2
            ;;
        --help)
            echo "Usage: ./setup_ai_siem.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --train-only       Train ML model only"
            echo "  --load-data        Load dataset only"
            echo "  --detect           Run anomaly detection only"
            echo "  --full-setup       Full setup (default)"
            echo "  --max-rows <N>     Number of dataset rows to load (default: 1000)"
            echo "  --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./setup_ai_siem.sh                          # Full setup with 1000 rows"
            echo "  ./setup_ai_siem.sh --full-setup --max-rows=500  # Full setup with 500 rows"
            echo "  ./setup_ai_siem.sh --train-only             # Train model only"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "📊 UNSW-NB15 Dataset: 175,341 network records"
echo "🤖 ML Model: Random Forest Classifier"
echo "⚡ Expected Runtime: 2-10 minutes depending on data size"
echo ""

# Step 1: Train Model
if [[ "$STEPS" == "full" || "$STEPS" == "train" ]]; then
    echo "════════════════════════════════════════════════════════════"
    echo "Step 1️⃣  Training ML Model from UNSW-NB15 Dataset..."
    echo "════════════════════════════════════════════════════════════"
    python3 manage.py setup_ai_siem --train-only
    echo ""
fi

# Step 2: Load Dataset
if [[ "$STEPS" == "full" || "$STEPS" == "load" ]]; then
    echo "════════════════════════════════════════════════════════════"
    echo "Step 2️⃣  Loading $MAX_ROWS Dataset Records into Database..."
    echo "════════════════════════════════════════════════════════════"
    python3 manage.py setup_ai_siem --load-data --max-rows=$MAX_ROWS
    echo ""
fi

# Step 3: Run Anomaly Detection
if [[ "$STEPS" == "full" || "$STEPS" == "detect" ]]; then
    echo "════════════════════════════════════════════════════════════"
    echo "Step 3️⃣  Running ML-Based Anomaly Detection..."
    echo "════════════════════════════════════════════════════════════"
    python3 manage.py setup_ai_siem --detect-anomalies
    echo ""
fi

echo "════════════════════════════════════════════════════════════"
echo "✅ AI SIEM Setup Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start backend: python3 manage.py runserver"
echo "   2. Start frontend: cd ../.. && npm start"
echo "   3. Visit: http://localhost:3000/behavior"
echo "   4. See real ML-detected anomalies with timestamps!"
echo ""
echo "📖 For more info: cat AI_SIEM_SETUP.md"
echo ""
