# ⚠️ URGENT: Update GitHub Secret

## Problem
The deployment is failing because the GitHub secret `AZURE_STATIC_WEB_APPS_API_TOKEN` is either missing or incorrect.

## Solution
You need to update the GitHub secret with the correct Azure Static Web App deployment token.

## Steps

### 1. Copy the Deployment Token
The deployment token for your Azure Static Web App (`presidio-piifilter-ozg`) is:

```
53dc604ef06ddc9c1bdef387dd2a5cc7cd8b41b7575878bb053e13759820b4d502-1c4dd97f-8f3d-4e6e-b678-a36adf2bb25d00326180d9c29a03
```

### 2. Update GitHub Secret

1. Go to: https://github.com/ozgurgulerx/presidio-pii-ozg-frontend/settings/secrets/actions

2. Look for a secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - If it exists: Click "Update" and paste the new token
   - If it doesn't exist: Click "New repository secret"

3. Set:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - **Value**: Paste the token from step 1

4. Click "Add secret" or "Update secret"

### 3. Trigger Deployment

The deployment will automatically trigger on the next push. To manually trigger:

```bash
# Make a small change and push
git commit --allow-empty -m "trigger deployment"
git push origin main
```

Or go to: https://github.com/ozgurgulerx/presidio-pii-ozg-frontend/actions
- Click on the failed workflow
- Click "Re-run all jobs"

## Verification

After updating the secret:
1. Push a commit or re-run the workflow
2. Check the workflow at: https://github.com/ozgurgulerx/presidio-pii-ozg-frontend/actions
3. The deployment should succeed
4. Your app will be live at: https://proud-rock-0d9c29a03.2.azurestaticapps.net

## Azure Static Web App Details

- **Name**: presidio-piifilter-ozg
- **Resource Group**: rg-presidio
- **Location**: West Europe
- **URL**: https://proud-rock-0d9c29a03.2.azurestaticapps.net
