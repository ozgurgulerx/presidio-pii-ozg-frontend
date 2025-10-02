#!/bin/bash

echo "=== Azure Static Web App Deployment Verification ==="
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed"
    echo "   Install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo "✅ Azure CLI is installed"

# Check if logged in
if ! az account show &> /dev/null; then
    echo "❌ Not logged into Azure CLI"
    echo "   Run: az login"
    exit 1
fi

echo "✅ Logged into Azure CLI"
echo ""

# List Static Web Apps
echo "📋 Listing Azure Static Web Apps in your subscription:"
echo ""
az staticwebapp list --query "[].{Name:name, ResourceGroup:resourceGroup, Location:location, DefaultHostname:defaultHostname}" -o table

echo ""
echo "=== Next Steps ==="
echo ""
echo "1. If no Static Web App is listed, create one:"
echo "   az staticwebapp create --name presidio-pii-frontend --resource-group <your-rg> --location eastus2 --sku Free"
echo ""
echo "2. Get the deployment token:"
echo "   az staticwebapp secrets list --name <your-app-name> --resource-group <your-rg> --query 'properties.apiKey' -o tsv"
echo ""
echo "3. Add the token as a GitHub secret named: AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "   URL: https://github.com/ozgurgulerx/presidio-pii-ozg-frontend/settings/secrets/actions"
echo ""
