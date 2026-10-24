# Changelog

## 1.8.0

- Continue interactive project creation into optional GitHub, GitHub Actions, and deployment setup. Use `--no-setup` to finish locally.
- Introduce Forjex starter branding, a rotating hero mark with reduced-motion support, and a framework-specific `/docs` file guide in Next.js, React, and Vue starters.
- Add `forjex push` to commit staged changes and push the current branch to its configured origin, preserving unstaged work and existing commit messages.
- Add optional OpenAI commit messages in CLI setup, CLI pushes, and the cloud wizard, with editable previews, regeneration, filtering, and manual fallback.
- Check cloud preview file additions before committing and preserve GitHub's assigned default branch for new repositories.

- Add `forjex ai configure`, `ai status`, and `ai clear`, plus an OpenAI model field in the cloud wizard.

- Support OpenAI, OpenRouter, Google Gemini, Grok, Anthropic, and Mistral for CLI and cloud commit messages, with provider-specific credentials and response handling.
