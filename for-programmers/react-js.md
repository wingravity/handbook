# React.js

## Organize components by feature

Group components by feature or domain rather than type. Keep components small and focused, with clear props and minimal side effects. Use meaningful and consistent names.

## Use hooks correctly and sparingly

Follow the rules of hooks: only call hooks at the top level of functional components and only in React functions. Use `useEffect` for side effects, `useMemo` and `useCallback` for optimization, and avoid unnecessary state.

## Manage state with context or dedicated libraries

Use `React Context` for global state when appropriate, but avoid overuse. For complex state management, consider libraries like `Redux Toolkit` or `Zustand` for better scalability and maintainability.

## Optimize context usage for performance

Minimize unnecessary re-renders by splitting context providers and using `useMemo` for context values. Avoid passing entire objects directly into context to reduce diff checks.

## Use React Router for declarative navigation

Use React Router for routing, with clear and logical URL structures. Leverage useNavigate for programmatic navigation and lazy-load routes using `React.lazy` and Suspense for better performance.

## Handle state efficiently

Prefer local state for UI-specific logic and context or libraries for global state. Use immutable data patterns and avoid deeply nested state objects to improve performance and maintainability.

## Write testable and maintainable code

Use testing libraries like React Testing Library and Jest to write tests that focus on component behavior rather than implementation details. Cover key use cases, edge cases, and user interactions.

## Debug with DevTools and console logs

Use `React DevTools` to inspect component trees, hooks, and state. Log key variables and function outputs with console.log or debug statements but remove them in production builds.

## Optimize performance with memoization and lazy loading

Use `React.memo` to prevent unnecessary re-renders of components, useMemo for expensive calculations, and `useCallback` to memoize callback functions. Lazy-load components and images to reduce initial load time.

## Follow best practices for production builds

Optimize production builds using tools like `Webpack` or `Vite`, enable code splitting, and set `NODE_ENV=production` to improve performance. Use tools like `Lighthouse` to identify performance bottlenecks and optimize accordingly.
