```markdown
# open-design Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions used in the `open-design` TypeScript codebase. You'll learn about file naming, import/export styles, commit message conventions, and testing patterns. This guide is designed to help you contribute code that matches the project's established standards.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `designSystem.ts`, `colorPalette.ts`

### Imports
- Use **relative imports** for modules within the project.
  - Example:
    ```typescript
    import { getColor } from './colorPalette';
    ```

### Exports
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // colorPalette.ts
    export const primaryColor = '#FF5733';
    export function getColor(name: string): string { ... }
    ```

### Commit Messages
- Follow **Conventional Commits** with the `fix` prefix for bug fixes.
  - Example:
    ```
    fix: correct color contrast in button component
    ```
- Average commit message length is about 55 characters.

## Workflows

### Code Contribution
**Trigger:** When adding or updating features or fixing bugs  
**Command:** `/contribute`

1. Create a new branch for your changes.
2. Write code following the coding conventions above.
3. Add or update tests in files matching `*.test.*`.
4. Commit your changes using the conventional commit format.
5. Push your branch and open a pull request.

### Testing
**Trigger:** Before submitting a pull request or after making changes  
**Command:** `/test`

1. Locate test files matching `*.test.*`.
2. Run the project's test suite (testing framework is not specified; check project documentation or use a common TypeScript test runner like Jest or Mocha).
3. Ensure all tests pass before merging or submitting code.

### Bug Fixing
**Trigger:** When addressing a bug  
**Command:** `/fix-bug`

1. Create a branch named `fix/<short-description>`.
2. Apply the bug fix, following coding conventions.
3. Write or update relevant tests.
4. Commit with a `fix:` prefix in the message.
5. Push and open a pull request.

## Testing Patterns

- Test files are named with the pattern `*.test.*` (e.g., `button.test.ts`).
- The specific testing framework is not specified; ensure your tests are compatible with the project's setup.
- Place tests alongside the code they cover or in a dedicated `tests` directory if present.

## Commands
| Command      | Purpose                                   |
|--------------|-------------------------------------------|
| /contribute  | Steps for contributing code               |
| /test        | Run the test suite                        |
| /fix-bug     | Steps for fixing and submitting a bug fix |
```
