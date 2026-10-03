# Node.js

## Structure code by components and layers

Organize code into business components (e.g., `users`, `orders`) and follow a 3-tier structure: entry-point (controllers), domain (logic), and data-access (DB interactions).

## Use environment variables for configurations

Store sensitive data like API keys in environment variables, not in code or config files. Use libraries like `dotenv` or convict for secure and structured configuration.

## Handle errors centrally and gracefully

Use `try-catch` with `async-await`, extend the built-in `Error` class for custom errors, and differentiate between operational and catastrophic errors. Use `process.on('unhandledRejection')` and `process.on('uncaughtException')` for unhandled errors.

## Use ESLint and follow coding conventions

Use `ESLint` with plugins like `eslint-plugin-node` and `eslint-plugin-security` to enforce code quality and security. Use const for variables by default, follow camelCase for variables and PascalCase for classes, and use `===` for comparisons.

## Log errors and requests with a mature logger

Use logging libraries like `Pino` or `Winston` for structured logs. Write logs to stdout and let the infrastructure handle log storage and routing. Include a transaction ID to trace requests.

## Write automated tests with clear structure

Prioritize API/component tests using tools like `Jest` or `Mocha`. Use clear test names with Arrange-Act-Assert (AAA) structure. Simulate external API calls using libraries like `nock`. Ensure high test coverage using tools like `Istanbul/NYC`.

## Use a reverse proxy for performance and security

Delegate tasks like SSL termination, compression, and serving static files to reverse proxies like Nginx or CDN services to reduce load on your Node.js app.

## Optimize performance and resource usage

Use asynchronous and non-blocking code. Avoid heavy CPU tasks or offload them to worker threads. Utilize all CPU cores by running multiple instances of your app. Use native JS methods instead of utility libraries for better performance.

## Secure your application and dependencies

Use libraries like `helmet` for security headers and `bcrypt` for password hashing. Validate user input with libraries like zod or joi to prevent injection attacks. Regularly check for vulnerable dependencies using `npm audit` or tools like `Snyk`.

## Deploy using LTS versions and lock dependencies

Always use an LTS version of Node.js for stability and security. Commit `package-lock.json` and install dependencies using `npm ci` for consistent builds across environments. Set `NODE_ENV=production` for optimized performance.
