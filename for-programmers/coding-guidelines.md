# Coding Guidelines

## Core principles

- **Clarity over cleverness:** Code should be easy to read and maintain.
- **Predictability:** Avoid unexpected behavior.
- **Minimalism:** Write only the code you need.
- **Safety first:** Catch errors early and prevent runtime failures.
- **Simplicity and explicitness:** Prefer straightforward solutions over complex or implicit behavior.

## General rules

1. **No implicit type coercion:** Use strict equality (`===`, `!==`).
2. **No magic numbers or strings:** Use named constants.
3. **No global variables:** Use modules to scope your code.
4. **No side effects in functions:** Keep functions pure whenever possible.
5. **Limit function complexity:** Functions should have a single responsibility.
6. **Use explicit types:** Always type function parameters, return values, and variables.
7. **No dynamic code execution:** Avoid `eval()` and dynamic imports.
8. **Error handling:** Always handle errors explicitly.
9. **Immutable data:** Favor immutability where possible.
10. **Test coverage:** Every function must have tests covering normal and edge cases.

## Typescript-specific rules

- **Enable strict mode:** Always use `"strict": true` in `tsconfig.json`.
- **Avoid `any` type:** Use specific types or generics instead.
- **Use readonly:** Mark properties and arrays as `readonly` when they shouldn't change.
- **Type narrowing:** Use type guards and `unknown` instead of `any`.
- **No implicit any:** Avoid missing type annotations.

## Code structure

- **Function length:** Max 20 lines per function.
- **File length:** Max 300 lines per file.
- **Module exports:** Export a single default entity unless multiple named exports are justified.
- **Inline code simplicity:** Avoid deeply nested code blocks; use early returns.

## Naming conventions

- Use camelCase for variables and functions.
- Use PascalCase for classes and types.
- Use UPPER_CASE for constants.

## Security

- Never expose sensitive data in logs.
- Never expose environment variables or secrets/keys that should remain private.
- Validate all user inputs.
- Sanitize any data used in dynamic contexts.

## Testing

- Use Jest or Vitest for unit tests.
- Test every function with valid, invalid, and edge-case inputs.
- Mock external dependencies.

## Control flow and abstractions

- **Use simple and explicit control flow:** Avoid complex or nested control structures.
- **Minimal use of abstractions:** Introduce abstractions only if they clearly improve code clarity.
- **Beware of abstraction costs:** Every abstraction has a cost. Use them judiciously.
- **Predictable loops:** Use standard loops with clear bounds.
- **Clear conditionals:** Prefer straightforward conditional statements over ternary chains.

## Assertions

- **Use assertions to catch programming errors early:** Verify assumptions that should never occur during normal operation.
- **Fail fast:** Assertions should trigger immediate failures when assumptions are violated.
- **No production assertions:** Avoid assertions in production code; use proper error handling for expected scenarios.
- **Not for regular conditions:** Do not use assertions for normal conditional checks. Use standard control flow instead.

## Third-party packages

- **Avoid excessive dependencies:** Only use third-party packages when they provide significant value.
- **Prefer in-house solutions:** Many tasks can be accomplished with simple, custom code.
- **Evaluate package reliability:** Ensure that any package used is well-maintained, secure, and aligns with the project's needs.
- **Minimize package bloat:** Reducing dependencies helps improve performance, security, and maintainability.
