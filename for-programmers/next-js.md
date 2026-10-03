# NextJS

## Use app router for new projects

Prefer the App Router with Server Components for better performance and maintainability.

## Leverage server-side rendering (SSR) and static site generation (SSG)

Use SSR for dynamic content and SSG for static pages to optimize speed and SEO.

## Optimize images with next/image

Use `<Image>` from next/image for responsive, optimized images with automatic lazy loading.

## Prefetch links for faster navigation

Use `<Link>` from next/link to enable client-side navigation with automatic prefetching.

## Load code and components lazily

Use `React.lazy()` and dynamic imports with `next/dynamic` to reduce initial page load time.

## Set up environment variables correctly

Use `.env.local` for sensitive data and prefix public variables with `NEXT_PUBLIC_`.
