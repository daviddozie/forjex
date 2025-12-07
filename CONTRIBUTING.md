# Contributing to Forjex

Thank you for your interest in contributing to **Forjex**! Your support helps improve the developer experience and keeps the project growing.

This guide outlines the recommended process to ensure smooth and consistent contributions.

---

## 🚀 How to Contribute

### 📝 0. Create an Issue First

Before starting any contribution, **create a GitHub Issue** describing what you want to work on.

Your issue should include:

* What you want to contribute (bug fix, new feature, improvement, documentation update, etc.)
* Why it is necessary
* Any relevant screenshots or examples

A maintainer will review and approve it before you start working.

### 1. **Fork the Repository**

Create your own copy of the project by clicking the **Fork** button on GitHub.

### 2. **Clone Your Fork**

```bash
git clone https://github.com/<your-username>/forjex.git
```

### 3. **Create a Feature Branch**

```bash
git checkout -b feature/YourAmazingFeature
```

Use clear and descriptive branch names.

### 4. **Make Your Changes**

Implement your feature, fix, or improvement following project coding standards.

### 5. **Commit Your Changes**

Use conventional commit messages:

```bash
git commit -m "feat: add YourAmazingFeature"
```

Example commit types:

* `feat:` for new features
* `fix:` for bug fixes
* `docs:` for documentation updates
* `refactor:` for code restructuring
* `chore:` for maintenance tasks

### 6. **Push to Your Branch**

```bash
git push origin feature/YourAmazingFeature
```

### 7. **Open a Pull Request (PR)**

Submit a PR to the main Forjex repository. Ensure your PR includes:

* A clear description of what you changed
* The motivation behind the change
* Screenshots or logs when necessary

A maintainer will review your PR and may request modifications.

---

## 📁 Project Structure Overview

Understanding the structure helps with accurate contributions:

* `src/` — Core CLI logic and utilities
* `commands/` — Command implementations
* `utils/` — Helpers like loggers, parsers, environment utilities
* `templates/` — Boilerplates used by Forjex
* `services/` — Core service modules powering Forjex’s automation:

  * `git.ts` — Git operations and commit handling
  * `vercel.ts` — Deployments and Vercel-related actions
  * `github.ts` — GitHub interaction utilities (repos, user info, API calls)
  * `cicd.ts` — CI/CD-related logic and workflows
  * `detector.ts` — Detects frameworks, project types, tools (npm, pnpm, bun, yarn)
  * `commit-generator.ts` — Generates commit messages using AI

---

## 🧪 Running the Project Locally

Ensure tests pass before submitting:

```bash
npm install
npm run build
npm test
```

---

## 📜 Licensing

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Forjex! Your effort helps build a smoother, smarter, and more powerful developer tool. 💛
