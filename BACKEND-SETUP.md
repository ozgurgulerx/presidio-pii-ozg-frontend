# Backend Connection Setup

Once the backend is deployed, follow these steps to connect the frontend.

## Step 1: Get Backend URL

After the backend deployment completes, get the URL:

```bash
cd /Users/ozgurguler/Developer/Projects/presidio-pii-ozg
az containerapp show \
  --name presidio-pii-backend \
  --resource-group presidio-pii-rg \
  --query properties.configuration.ingress.fqdn \
  -o tsv
```

The URL will be something like: `presidio-pii-backend.{suffix}.eastus.azurecontainerapps.io`

## Step 2: Add GitHub Secret

Go to the frontend repository on GitHub:
1. Navigate to: **Settings → Secrets and variables → Actions**
2. Click **"New repository secret"**
3. Add:
   - **Name**: `NEXT_PUBLIC_ANALYZE_URL`
   - **Value**: `https://<backend-url>/analyze`

Example value:
```
https://presidio-pii-backend.proudpond-12345678.eastus.azurecontainerapps.io/analyze
```

## Step 3: Update Backend CORS

Update the backend to allow the frontend URL:

```bash
# Get your frontend URL from Azure Static Web Apps
FRONTEND_URL=$(az staticwebapp show \
  --name presidio-pii-frontend \
  --resource-group presidio-pii-rg \
  --query defaultHostname \
  -o tsv)

# Update backend CORS settings
az containerapp update \
  --name presidio-pii-backend \
  --resource-group presidio-pii-rg \
  --set-env-vars PII_ALLOWED_ORIGINS="https://$FRONTEND_URL,https://presidio-pii-frontend.azurestaticapps.net"
```

## Step 4: Trigger Frontend Deployment

Push the updated workflow to trigger a new deployment:

```bash
cd /Users/ozgurguler/Developer/Projects/presidio-pii-ozg-frontend
git add .github/workflows/azure-static-web-apps.yml
git commit -m "Add backend URL configuration"
git push origin main
```

Or manually trigger the deployment from GitHub Actions.

## Step 5: Verify Connection

Once both are deployed:

1. **Test backend directly:**
   ```bash
   curl -X POST https://<backend-url>/analyze \
     -H "Content-Type: application/json" \
     -d '{"text": "My email is john@example.com"}'
   ```

2. **Test frontend:**
   - Open your frontend URL in browser
   - Paste text with PII
   - Click "Analyze for PII"
   - Should see detected entities

## Quick Setup Commands (Run in order)

```bash
# 1. Get backend URL
BACKEND_URL=$(az containerapp show \
  --name presidio-pii-backend \
  --resource-group presidio-pii-rg \
  --query properties.configuration.ingress.fqdn \
  -o tsv)

echo "Backend URL: https://$BACKEND_URL"
echo "API Endpoint: https://$BACKEND_URL/analyze"

# 2. Get frontend URL
FRONTEND_URL=$(az staticwebapp show \
  --name presidio-pii-frontend \
  --resource-group presidio-pii-rg \
  --query defaultHostname \
  -o tsv 2>/dev/null || echo "NOT_DEPLOYED_YET")

echo "Frontend URL: https://$FRONTEND_URL"

# 3. Update backend CORS if frontend is deployed
if [ "$FRONTEND_URL" != "NOT_DEPLOYED_YET" ]; then
  az containerapp update \
    --name presidio-pii-backend \
    --resource-group presidio-pii-rg \
    --set-env-vars PII_ALLOWED_ORIGINS="https://$FRONTEND_URL,*"
  
  echo "✅ Backend CORS updated"
fi

# 4. Display what to add to GitHub secrets
echo ""
echo "📝 Add this to GitHub Secrets:"
echo "NEXT_PUBLIC_ANALYZE_URL=https://$BACKEND_URL/analyze"
```

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
```bash
az containerapp update \
  --name presidio-pii-backend \
  --resource-group presidio-pii-rg \
  --set-env-vars PII_ALLOWED_ORIGINS="*"
```

### Frontend not connecting
1. Check GitHub secret is set correctly
2. Verify build used the correct environment variable (check build logs)
3. Clear browser cache and reload

### Backend not responding
```bash
# Check backend logs
az containerapp logs show \
  --name presidio-pii-backend \
  --resource-group presidio-pii-rg \
  --tail 50
```
