# REFV Gelato POS

Static web app (HTML + images). No server or build step.

## Files
- `index.html` the whole POS
- `images/` gelato photos (`g1.jpg` to `g6.jpg`). Replace with your own photos using the same names.
- `apps-script.gs` optional: sends every order to Google Sheets

## Publish free on GitHub Pages
1. Create a GitHub account, then **New repository** (name e.g. `refv-pos`, Public).
2. Click **uploading an existing file**, drag in `index.html`, `README.md`, `apps-script.gs` and the `images` folder, then **Commit changes**.
3. Repo **Settings > Pages > Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)`, **Save**.
4. After about 1 minute your site is at `https://<your-username>.github.io/refv-pos/`. Open it on the iPad or phone and use **Add to Home Screen**.

## Other free options (no GitHub needed)
- **Netlify Drop**: go to app.netlify.com/drop and drag the whole folder.
- **Cloudflare Pages** or **Vercel**: connect the repo or upload the folder.

## Connect Google Sheets
Use the **Apps Script Web app URL** (ends with `/exec`), NOT the link of the Google Sheet. Follow the steps at the top of `apps-script.gs`, paste the URL in Settings, then press **Test connection**. Use **Sync unsent orders** or **Re-send all** (safe: orders already in the sheet are skipped).

## QR payment
Enter your PromptPay phone or 13-digit ID in Settings. The POS generates a PromptPay QR with the exact amount (needs internet for the QR library).

## Notes
- Orders and custom flavors are saved in each device's browser (localStorage). Use the same device for sales, and use Google Sheets or Download CSV for backup.
- Do not clear browser data without exporting first.

## Clear sales data
Settings > **Clear all sales data** (deletes the orders saved on that device; rows already in Google Sheets stay). Or clear the site data in the browser settings.
