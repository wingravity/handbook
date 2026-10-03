# Docker

## Use multi-stage builds

Keep images lean and secure by copying only the necessary production files. This reduces build time, image size, and potential security risks.

## Start your app directly

Use CMD to start your application (e.g., `CMD ["node", "app.js"]`). Avoid `npm start` to ensure proper signal handling for graceful shutdowns.

## Let Docker handle scaling

Don’t use process managers like PM2 or custom clustering. Docker or orchestrators like Kubernetes manage scaling and uptime more efficiently.

## Use .dockerignore to protect secrets

Exclude sensitive files like `.env` and `.npmrc` to prevent them from being copied into the image. This also speeds up builds.

## Remove dev dependencies for production

Ensure only production dependencies are included in the final image to reduce the attack surface and image size.

## Handle shutdown gracefully

Catch signals like `SIGTERM` to clean up resources and allow ongoing requests to finish before shutting down.

## Set memory limits

Configure both Docker memory limits and application runtime limits (e.g., V8’s `--max-old-space-size`) to optimize resource usage and prevent crashes.

## Optimize caching in your Dockerfile

Place frequently changing instructions (like copying app code) at the bottom of the Dockerfile to speed up builds using Docker’s cache.

## Use explicit image versions

Avoid the `latest` tag. Pin images using a version tag or SHA256 digest to ensure consistent builds and deployments.

## Prefer smaller base images

Use minimal images like Alpine or Slim variants to reduce vulnerabilities, build times, and resource consumption.
