#!/bin/bash

# ================================================
# Auto-Destroy Script - Clean up GCP resources
# after 5 minutes to avoid charges
# ================================================

set -e

WAIT_TIME=${1:-300}  # Default 5 minutes (300 seconds)

echo "============================"
echo "🗑️  RESOURCE CLEANUP TIMER"
echo "============================"
echo "Resources will be DESTROYED in $((WAIT_TIME / 60)) minute(s)"
echo "Current time: $(date)"
echo "============================"
echo ""

# Show countdown
for i in $(seq $WAIT_TIME -60 1); do
  if [ $i -le 300 ]; then
    if [ $((i % 60)) -eq 0 ]; then
      echo "⏱️  $((i / 60)) minute(s) remaining... $(date)"
    fi
  fi
  sleep 60
done

echo ""
echo "============================"
echo "🔴 INITIATING DESTRUCTION"
echo "============================"
echo "Destroying all GCP resources..."
echo ""

# Check if terraform is initialized
if [ ! -d ".terraform" ]; then
  echo "⚠️  Terraform not initialized. Running init..."
  terraform init
fi

# Destroy infrastructure
terraform destroy -auto-approve \
  -var-file="terraform.tfvars" \
  -lock=false

echo ""
echo "============================"
echo "✅ DESTRUCTION COMPLETE"
echo "============================"
echo "All resources have been destroyed"
echo "Destruction completed at: $(date)"
