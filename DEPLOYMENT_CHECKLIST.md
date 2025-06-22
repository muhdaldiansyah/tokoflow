# Deployment Checklist for Tokoflow

## Pre-Deployment Steps ✅

1. **Delete Local Files (if they exist)**:
   ```bash
   rm -rf .next
   rm -rf node_modules
   rm package-lock.json
   ```

2. **Commit All Changes**:
   ```bash
   git add -A
   git commit -m "Fix build errors: import paths, dependencies, and React version"
   git push origin main
   ```

## Vercel Configuration

1. **Environment Variables** - Add in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `NODE_OPTIONS` = `--max-old-space-size=4096`

2. **Build Settings** (should auto-detect from vercel.json):
   - Framework: Next.js
   - Node Version: 20.x
   - Install Command: `npm install --force`
   - Build Command: `npm run build`

## Post-Deployment Verification

1. Check build logs for any warnings
2. Test all routes:
   - `/` (Home)
   - `/layanan` (Services)
   - `/investasi` (Pricing)
   - `/panduan` (Guides)
   - `/tentang` (About)
   - `/koreksi` (Grading - requires auth)

## Troubleshooting

If build still fails:
1. Clear Vercel build cache (in project settings)
2. Check all environment variables are set
3. Ensure Node.js version is set to 20.x
4. Review build logs for specific error messages

## Success Indicators

- Build completes without errors
- All pages load correctly
- No console errors in browser
- Images load properly
- Forms and interactive elements work

Good luck with your deployment! 🚀
