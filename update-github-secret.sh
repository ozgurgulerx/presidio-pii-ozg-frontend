#!/bin/bash

# This script updates the GitHub secret for Azure Static Web Apps deployment

REPO="ozgurgulerx/presidio-pii-ozg-frontend"
SECRET_NAME="AZURE_STATIC_WEB_APPS_API_TOKEN"
SECRET_VALUE="53dc604ef06ddc9c1bdef387dd2a5cc7cd8b41b7575878bb053e13759820b4d502-1c4dd97f-8f3d-4e6e-b678-a36adf2bb25d00326180d9c29a03"

echo "=== Updating GitHub Secret ==="
echo ""
echo "Repository: $REPO"
echo "Secret Name: $SECRET_NAME"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo ""
    echo "Install it with:"
    echo "  brew install gh"
    echo ""
    echo "Then authenticate:"
    echo "  gh auth login"
    echo ""
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo ""
    echo "Run: gh auth login"
    echo ""
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Update the secret
echo "Updating secret..."
echo "$SECRET_VALUE" | gh secret set "$SECRET_NAME" --repo "$REPO"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Secret updated successfully!"
    echo ""
    echo "Now triggering a new deployment..."
    echo ""
    
    # Trigger workflow
    cd /Users/ozgurguler/Developer/Projects/presidio-pii-ozg-frontend
    git commit --allow-empty -m "chore: trigger deployment after secret update"
    git push origin main
    
    echo ""
    echo "✅ Deployment triggered!"
    echo ""
    echo "Check status at: https://github.com/$REPO/actions"
    echo "Website will be live at: https://proud-rock-0d9c29a03.2.azurestaticapps.net"
else
    echo ""
    echo "❌ Failed to update secret"
    echo ""
    echo "Manual steps:"
    echo "1. Go to: https://github.com/$REPO/settings/secrets/actions"
    echo "2. Click 'New repository secret'"
    echo "3. Name: $SECRET_NAME"
    echo "4. Value: $SECRET_VALUE"
    echo "5. Click 'Add secret'"
fi
