---
'@clerk/clerk-js': minor
'@clerk/types': minor
---

Introduce `afterLogoClickUrl` prop in `ClerkProvider`
A new `afterLogoClickUrl` prop has been added to the `ClerkProvider` provider and used in `ApplicationLogo.tsx` in order to change the target of logo.
When set then logo url will redirect to that value otherwise logo url will set to `displayConfig.after_logo_click_url` or `homeUrl`