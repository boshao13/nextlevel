const { test, expect } = require('@playwright/test');

// Keep every run offline-safe and out of GA4/Ads data: the inline gtag
// snippet injects googletagmanager.com on public routes — abort it
// (analytics.js helpers fail silently by design when gtag never loads).
// challenges.cloudflare.com is aborted too: with the Turnstile site key
// baked into the build every lead form mounts a real widget; aborting the
// script keeps runs deterministic/offline (the widget container still
// renders, and no token is ever issued — see the gate test below).
test.beforeEach(async ({ page }) => {
  await page.route(
    /googletagmanager\.com|google-analytics\.com|googleadservices\.com|challenges\.cloudflare\.com/,
    (route) => route.abort()
  );
});

test('home renders hero H1 and tel: links', async ({ page }) => {
  await page.goto('/');
  // Hero.jsx Headline: "If Your Garage Could Talk, / It'd Call Us"
  await expect(page.locator('h1')).toContainText('If Your Garage Could Talk');
  // Header PhoneButton + ContactForm PhoneLink both use tel:5053524674
  expect(await page.locator('a[href="tel:5053524674"]').count()).toBeGreaterThan(0);
});

test('client-side nav: header link → /commercial', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Commercial', exact: true }).first().click();
  await expect(page).toHaveURL('/commercial');
  await expect(page.locator('h1')).toContainText('Industrial-Grade Floors');
});

// Turnstile gate (post-plan hotfix 2a7ad55): the site key is baked into the
// build, so the widget mounts for real and the submit button stays DISABLED
// until Cloudflare issues a token — which it never does here (the script is
// aborted in beforeEach). Asserts the widget mount attempt + the gate.
test('quote form: Turnstile widget mounts and gates the submit button', async ({ page }) => {
  // The widget's useEffect appends the Cloudflare script only when a site
  // key is baked in — the attempted request IS the mount evidence.
  const turnstileScriptAttempt = page.waitForRequest(/challenges\.cloudflare\.com/);
  await page.goto('/');
  await turnstileScriptAttempt;
  // TurnstileWidget's container div (the only inline-styled div in the form).
  // toBeAttached, not toBeVisible: with the Cloudflare script aborted the
  // container never gets its iframe, so it has zero height ( = "hidden").
  await expect(page.locator('#contact form div[style*="margin"]')).toBeAttached();
  // All four fields valid — the ONLY thing keeping the button disabled is
  // the missing Turnstile token.
  await page.locator('#user_name').fill('Playwright Smoke');
  await page.locator('#user_number').fill('505-000-0000');
  await page.locator('#user_email').fill('smoke@example.com');
  await page.locator('#area_desired').fill('2-car garage (automated smoke test)');
  await expect(
    page.getByRole('button', { name: 'Get My Free Quote →' })
  ).toBeDisabled();
});

test('quote form submits (API mocked) and hard-navigates to /thank-you', async ({ page }) => {
  // Turnstile shim: define window.turnstile BEFORE any page script runs, so
  // TurnstileWidget skips loading the real Cloudflare script and our fake
  // render() issues a token immediately. This re-enables the plan's full
  // submit-path test (validation → POST body → hard nav) with zero network.
  await page.addInitScript(() => {
    window.turnstile = {
      render: (el, opts) => {
        setTimeout(() => opts.callback('e2e-turnstile-token'), 0);
        return 'e2e-widget';
      },
      reset: () => {},
      remove: () => {},
    };
  });
  // Intercept the lead POST — never hit Express/MySQL from the smoke suite.
  let leadPayload = null;
  await page.route('**/api/leads', (route) => {
    leadPayload = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.goto('/');
  await page.locator('#user_name').fill('Playwright Smoke');
  await page.locator('#user_number').fill('505-000-0000');
  await page.locator('#user_email').fill('smoke@example.com');
  await page.locator('#area_desired').fill('2-car garage (automated smoke test)');
  // Click auto-waits for the button to enable (fake token arrives async).
  await page.getByRole('button', { name: 'Get My Free Quote →' }).click();
  // ContactForm does window.location.href = '/thank-you' — a deliberate hard
  // navigation so the Ads AW- config re-fires. Assert the full-page nav.
  await page.waitForURL('**/thank-you');
  await expect(page).toHaveTitle('Thanks — Next Level Epoxy');
  // The POST carried the form fields + the (shimmed) Turnstile token.
  expect(leadPayload).toMatchObject({
    name: 'Playwright Smoke',
    email: 'smoke@example.com',
    phone: '505-000-0000',
    area_desired: '2-car garage (automated smoke test)',
    source: 'contact_form',
    turnstile_token: 'e2e-turnstile-token',
  });
});

test('admin login page mounts (client-only react-router SPA)', async ({ page }) => {
  await page.goto('/admin/login');
  // AdminApp is next/dynamic ssr:false — these appear only after hydration.
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
});

// Guards the styled.a MPA-hop fix (ef6de70): "Back to Site" must exit the
// admin BrowserRouter with a real navigation into the Next shell — a
// react-router pushState to '/' would leave a blank page.
test('admin "Back to Site" exits the SPA to the home page (dual-router hop)', async ({ page }) => {
  // Seed the token before any page script runs so AdminRoute finds it.
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'e2e-fake-jwt');
  });
  // Mock every admin API call — /api/me authorizes AdminRoute, the rest keep
  // Dashboard's Promise.all happy with empty-but-shaped payloads.
  await page.route('**/api/**', (route) => {
    const { pathname } = new URL(route.request().url());
    const json = (body) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    if (pathname === '/api/me') return json({ role: 'admin' });
    if (pathname === '/api/leads') return json({ leads: [], total: 0 });
    if (pathname === '/api/finances/summary') return json({ this_month: 0 });
    return json([]);
  });
  await page.goto('/admin/dashboard');
  const backLink = page.getByRole('link', { name: 'Back to Site' });
  await expect(backLink).toBeVisible();
  await backLink.click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('h1')).toContainText('If Your Garage Could Talk');
});

// CURRENT (expected) behavior, documented: /admin/<unknown> is caught by the
// app/admin/[[...rest]] shell, so the branded 404 (app/not-found.js) never
// runs; inside the SPA no react-router route matches and Routes renders
// nothing → an empty admin shell. Deliberately asserted as-is.
test('/admin/nope renders the empty admin shell, not the branded 404', async ({ page }) => {
  await page.goto('/admin/nope');
  // The ssr:false loading placeholder appears, then AdminApp mounts… nothing.
  await expect(page.getByText('Loading CRM…')).toHaveCount(0);
  // No branded 404 markers: no its headline, no heading at all, no 404 title.
  await expect(page.getByText('slipped through a crack')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveCount(0);
  await expect(page).not.toHaveTitle(/Page Not Found/);
});

test('/colors: swatch modal opens and Escape closes it', async ({ page }) => {
  await page.goto('/colors');
  // AllColors Cards carry aria-label="View <name>"
  await page.locator('[aria-label^="View "]').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

// E-sign consent card (all /api/sign/* mocked) + the token-hygiene gate: the
// inline gtag snippet must NOT even ATTEMPT a googletagmanager.com request on
// /sign pages — the secret URL token would leak via page_location.
test('/sign/:token shows the consent card and never attempts a gtag request', async ({ page }) => {
  const gtmAttempts = [];
  // page.on('request') fires before route handlers abort, so this records
  // every ATTEMPTED request even though beforeEach aborts the transfer.
  page.on('request', (req) => {
    if (/googletagmanager\.com/.test(req.url())) gtmAttempts.push(req.url());
  });
  // Minimal syntactically-valid PDF — SignDocumentClient only blobs it
  // pre-consent (PdfPreview parses it after consent, not asserted here).
  const tinyPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n' +
      '2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n' +
      '3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>\nendobj\n' +
      'trailer\n<</Root 1 0 R>>\n%%EOF\n'
  );
  await page.route('**/api/sign/**', (route) => {
    const { pathname } = new URL(route.request().url());
    const json = (body) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    if (pathname === '/api/sign/agreement')
      return json({ text: 'E-sign consent agreement (smoke fixture).' });
    if (pathname === '/api/sign/tok-x')
      return json({ id: 1, title: 'Smoke Test Agreement', status: 'sent', fields: [] });
    if (pathname === '/api/sign/tok-x/file')
      return route.fulfill({ status: 200, contentType: 'application/pdf', body: tinyPdf });
    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'not found' }),
    });
  });
  await page.goto('/sign/tok-x');
  await expect(page.getByRole('heading', { name: 'Ready to sign?' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'I agree — start signing' })
  ).toBeVisible();
  expect(gtmAttempts).toEqual([]);
});

// The Torginol swatch images are gitignored-but-required-locally — a missing
// tree would 404 every card on /colors. Probe one representative file.
test('swatch asset probe: almond.jpg serves 200 image/jpeg', async ({ request }) => {
  const res = await request.get('/images/torginol/archive/almond.jpg');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/jpeg');
});
