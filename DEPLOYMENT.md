# Deployment Guide - WOW Events

## 🚀 Vercel Deployment

### Prerequisites
- Vercel account connected to your GitHub repository
- Node.js 18+ installed locally for testing

### Automatic Deployment

The project is configured for automatic deployment on Vercel when pushing to the `main` branch.

#### Configuration Files

**vercel.json**
```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install --legacy-peer-deps && npm run build:web",
  "outputDirectory": "frontend/dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Build Settings in Vercel Dashboard

If configuring manually in Vercel:

1. **Framework Preset**: `Other`
2. **Root Directory**: `/` (leave empty)
3. **Build Command**:
   ```bash
   cd frontend && npm install --legacy-peer-deps && npm run build:web
   ```
4. **Output Directory**: `frontend/dist`
5. **Install Command**:
   ```bash
   cd frontend && npm install --legacy-peer-deps
   ```

### Environment Variables

Currently no environment variables are required since the app uses mock data.

When backend integration is added, configure:
- `EXPO_PUBLIC_BACKEND_URL` - Backend API URL

### Common Issues & Solutions

#### ❌ 404 NOT_FOUND Error

**Problem**: Vercel serves 404 for all routes

**Solution**:
1. Ensure `vercel.json` exists in root directory
2. Verify `rewrites` configuration redirects all routes to `/index.html`
3. Check that `frontend/dist` directory is generated during build

#### ❌ Build Fails

**Problem**: `npm install` or `npm run build:web` fails

**Solutions**:
1. **Peer Dependency Conflicts**
   - Use `--legacy-peer-deps` flag (already configured)

2. **Node Version Mismatch**
   - Ensure Vercel uses Node 18+
   - Add to `package.json`:
   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

3. **Missing Dependencies**
   - Run locally first: `cd frontend && npm install --legacy-peer-deps && npm run build:web`
   - Check that `dist/` folder is created with `index.html`

#### ❌ Blank Page or White Screen

**Problem**: Page loads but shows nothing

**Solutions**:
1. Check browser console for errors
2. Verify `react-native-web` is properly configured
3. Test locally with `npm run web` first
4. Check that `WebViewport` component isn't causing issues on Vercel

### Testing Build Locally

Before deploying, test the production build:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Build for web
npm run build:web

# Check output
ls -la dist/

# Serve locally (requires serve package)
npx serve dist
```

The build should create:
```
frontend/dist/
├── index.html
├── _expo/
│   └── static/
│       ├── js/
│       └── css/
└── assets/
```

### Deployment Steps

1. **Commit changes**
   ```bash
   git add vercel.json frontend/package.json
   git commit -m "chore: Add Vercel deployment configuration"
   ```

2. **Push to GitHub**
   ```bash
   git push origin main
   ```

3. **Vercel auto-deploys**
   - Check deployment status at https://vercel.com/dashboard
   - Monitor build logs for errors
   - Visit deployment URL once complete

4. **Verify deployment**
   - Test all routes work
   - Test swipe functionality
   - Test category filtering
   - Check mobile viewport simulation

### Manual Deployment (Alternative)

If automatic deployment isn't working:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
vercel

# Or deploy to production
vercel --prod
```

### Platform-Specific Notes

#### Web (Vercel)
- Uses `WebViewport` component to simulate mobile device
- Viewport: 390x844px (iPhone 14 Pro)
- Swipe gestures replaced with button actions
- Fully responsive design

#### Mobile (Expo Go / Production)
- Native gestures work normally
- No viewport restrictions
- Full device capabilities available

### Monitoring & Analytics

After deployment:
1. Monitor Vercel Analytics dashboard
2. Check error logs in Vercel Functions tab
3. Set up alerts for build failures

### Future Enhancements

When adding backend integration:
1. Configure CORS on backend for Vercel domain
2. Add environment variables in Vercel dashboard
3. Update `EXPO_PUBLIC_BACKEND_URL` in production
4. Test API calls work from deployed site

---

## 📱 Mobile Deployment (Future)

### iOS (App Store)
```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android (Play Store)
```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

---

## 🔧 Troubleshooting

### Check Build Logs
```bash
# View Vercel deployment logs
vercel logs <deployment-url>
```

### Test Production Build Locally
```bash
cd frontend
npm run build:web
npx serve dist -p 3000
```

### Clear Vercel Cache
In Vercel Dashboard:
1. Go to Project Settings
2. Navigate to "Caching"
3. Click "Clear Cache"
4. Redeploy

---

## 📞 Support

If deployment issues persist:
1. Check Vercel status: https://www.vercel-status.com/
2. Review build logs in Vercel dashboard
3. Test build locally first
4. Check GitHub repository settings → Vercel integration

---

**Last Updated**: 2026-01-19
**Vercel Version**: 2
**Expo Version**: 54.0.31
