# Azure Static Web Apps Deployment Guide

## Prerequisites

1. **Azure Static Web App Resource**: You need to create an Azure Static Web App resource in your Azure portal
2. **Deployment Token**: Get the deployment token from your Azure Static Web App

## Setup Instructions

### 1. Create Azure Static Web App

```bash
# Using Azure CLI
az staticwebapp create \
  --name presidio-pii-frontend \
  --resource-group <your-resource-group> \
  --location <your-location> \
  --sku Free
```

### 2. Get Deployment Token

```bash
# Get the deployment token
az staticwebapp secrets list \
  --name presidio-pii-frontend \
  --resource-group <your-resource-group> \
  --query "properties.apiKey" -o tsv
```

Or get it from Azure Portal:
1. Go to your Static Web App resource
2. Click on "Manage deployment token" in the Overview page
3. Copy the deployment token

### 3. Add GitHub Secret

1. Go to your GitHub repository: `https://github.com/ozgurgulerx/presidio-pii-ozg-frontend`
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Value: Paste the deployment token from step 2
6. Click "Add secret"

## Deployment Process

The deployment is automated via GitHub Actions:

- **Trigger**: Push to `main` branch or Pull Request
- **Build**: Next.js static export to `out/` directory
- **Deploy**: Azure Static Web Apps Deploy action uploads to Azure

## Configuration Files

- **next.config.ts**: Next.js configuration for static export
- **staticwebapp.config.json**: Azure SWA routing and security headers
- **.github/workflows/azure-static-web-apps.yml**: CI/CD pipeline

## Troubleshooting

### Error: "No matching Static Web App was found or the api key was invalid"

**Causes**:
1. Azure Static Web App resource doesn't exist
2. Deployment token is incorrect or expired
3. GitHub secret name doesn't match workflow

**Solutions**:
1. Create the Azure Static Web App resource (see step 1 above)
2. Regenerate and update the deployment token (see step 2 above)
3. Ensure GitHub secret is named `AZURE_STATIC_WEB_APPS_API_TOKEN`

### Build Failures

If the build fails, test locally:

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Check output
ls -la out/
```

## Local Development

```bash
# Development server
yarn dev

# Production build
yarn build

# Preview production build locally
npx serve out
```

## Environment Variables

If you need to add environment variables:

1. Add them to Azure Static Web App:
   ```bash
   az staticwebapp appsettings set \
     --name presidio-pii-frontend \
     --setting-names KEY=VALUE
   ```

2. For build-time variables, prefix with `NEXT_PUBLIC_` in `.env.local`
