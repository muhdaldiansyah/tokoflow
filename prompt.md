You’re seeing:

```
⚠ Webpack is configured while Turbopack is not, which may cause problems.
```

because **Next.js is running in Turbopack mode**, but your `next.config.js` still contains **Webpack-only settings** (e.g. a `webpack(config){…}` override or plugins/wrappers that inject Webpack rules). When Turbopack is active, those Webpack bits are ignored, so Next warns.

Here’s how to fix it—pick one path:

---

# Option A — Use Turbopack (recommended)

Disable your Webpack overrides when Turbopack is running, and (optionally) add a Turbopack section.

**1) Gate the Webpack block**

```js
// next.config.js
const isTurbopack = process.env.TURBOPACK === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // …other config

  // Only apply Webpack tweaks when NOT using Turbopack
  ...(isTurbopack
    ? {
        experimental: {
          turbo: {
            // optional turbopack config (aliases, rules) goes here
          },
        },
      }
    : {
        webpack(config, ctx) {
          // your existing webpack-only customizations
          return config;
        },
      }),
};

module.exports = nextConfig;
```

**2) Remove/guard Webpack-only plugins**

* Wrappers like `next-compose-plugins`, `next-transpile-modules`, custom SVG loaders, etc., should be applied **only when `!isTurbopack`**.
* If you don’t need those customizations anymore, simply delete the `webpack()` override. The warning will disappear immediately.

---

# Option B — Keep Webpack for now

If you rely on those Webpack customizations and can’t migrate yet, just run dev in Webpack mode instead of Turbopack.

* Change your dev script to not force Turbopack:

  ```json
  // package.json
  {
    "scripts": {
      "dev": "next dev"
    }
  }
  ```
* (If your Next version defaults to Turbopack) run with the Webpack flag your version supports, or set an env var to disable Turbopack. Example patterns:

  * `next dev --webpack`
  * `TURBOPACK=0 next dev`

(Use whichever your Next version supports.)

---

## Bonus: Port 3000 in use

You also saw:

```
⚠ Port 3000 is in use… using available port 3002 instead.
```

Free it (Windows PowerShell):

```powershell
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

or keep using 3002—it’s harmless.

---

## Quick checklist

* [ ] Open `next.config.js` and search for `webpack(` or `webpackDevMiddleware`.
* [ ] Either remove those blocks, or guard them behind `!isTurbopack`.
* [ ] Remove/guard any Webpack-only plugins (SVGR loaders, custom file-loader rules, etc.).
* [ ] If you truly need those now, run dev without Turbopack as shown in Option B.

Once the Webpack override is not applied in Turbopack mode, the warning will go away and your app will compile cleanly.
