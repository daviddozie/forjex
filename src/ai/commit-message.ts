import { AI_PROVIDERS, isAIProvider, validAIModel, type AIProvider } from './settings';
import { requestCommitText } from './provider-request';
/** Shared by the CLI and cloud. No credentials or source are persisted here. */
export interface CommitChange {
  path: string;
  content: string;
  binary?: boolean;
}

export function isSensitivePath(path: string): boolean {
  return (
    /(^|\/)(\.env(?:\..*)?|\.npmrc|\.pypirc|credentials(?:\.[^/]*)?|secrets?(?:\.[^/]*)?|id_(?:rsa|ed25519)|[^/]+\.(?:pem|key|p12|pfx))$/i.test(
      path,
    ) || /(^|\/)(\.git|\.aws|\.ssh|secrets?|credentials|node_modules|dist|\.next)(\/|$)/i.test(path)
  );
}

export function redactSecrets(text: string): string {
  return text
    .replace(
      /-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g,
      '[REDACTED PRIVATE KEY]',
    )
    .replace(
      /\b(?:sk-[\w-]{16,}|gh[pousr]_[\w]{16,}|github_pat_[\w]{16,}|AIza[\w-]{30,}|xai-[\w-]{16,}|AKIA[A-Z0-9]{16})\b/g,
      '[REDACTED]',
    )
    .replace(
      /((?:api[_-]?key|secret|password|token|authorization)\s*["']?\s*[:=]\s*)[^\r\n]+/gi,
      '$1[REDACTED]',
    )
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/g, '$1[REDACTED]@');
}

export function prepareCommitInput(changes: CommitChange[]) {
  let remaining = 48_000;
  const included: string[] = [];
  const omitted: string[] = [];
  const sections: string[] = [];
  for (const change of changes) {
    if (
      change.binary ||
      isSensitivePath(change.path) ||
      remaining < 256 ||
      included.length >= 100
    ) {
      omitted.push(change.path);
      continue;
    }
    const redacted = redactSecrets(change.content);
    const content = redacted.slice(
      0,
      Math.max(0, Math.min(12_000, remaining - change.path.length - 100)),
    );
    remaining -= content.length + change.path.length + 100;
    included.push(change.path);
    sections.push(
      JSON.stringify({
        path: change.path,
        change: content,
        truncated: redacted.length > content.length,
      }),
    );
  }
  return { input: sections.join('\n'), included, omitted };
}

export function validateCommitMessage(message: unknown): string {
  if (
    typeof message !== 'string' ||
    !message.trim() ||
    message.length > 4000 ||
    [...message].some((char) => {
      const code = char.charCodeAt(0);
      return (code < 32 && ![9, 10, 13].includes(code)) || code === 127;
    })
  ) {
    throw new Error('Enter a commit message between 1 and 4000 characters.');
  }
  return message.trim();
}

export async function generateAICommitMessage(
  changes: CommitChange[],
  options: { apiKey: string; provider?: AIProvider; model?: string; fetch?: typeof fetch },
): Promise<{ message: string; included: string[]; omitted: string[] }> {
  const provider = options.provider ?? 'openai';
  if (!isAIProvider(provider)) throw new Error('Unsupported AI provider.');
  if (!options.apiKey.trim())
    throw new Error(`A ${AI_PROVIDERS[provider].label} API key is required.`);
  const model = options.model || AI_PROVIDERS[provider].defaultModel;
  if (!validAIModel(model)) throw new Error('Choose a valid model ID for your selected provider.');
  const prepared = prepareCommitInput(changes);
  if (!prepared.included.length)
    throw new Error('No eligible text changes to summarize. Enter a message manually.');
  const output = await requestCommitText(
    provider,
    model,
    options.apiKey,
    prepared.input,
    options.fetch,
  );
  let parsed: { title: string; body: string };
  try {
    parsed = JSON.parse(output.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1'));
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON object');
  } catch {
    throw new Error('AI returned an invalid message. Enter a message manually.');
  }
  if (
    typeof parsed.title !== 'string' ||
    typeof parsed.body !== 'string' ||
    parsed.title.includes('\n') ||
    parsed.title.length > 100 ||
    !/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?: .+/.test(
      parsed.title,
    )
  ) {
    throw new Error('AI returned an invalid commit title. Enter a message manually.');
  }
  return {
    message: validateCommitMessage(
      redactSecrets(parsed.title + (parsed.body.trim() ? '\n\n' + parsed.body.trim() : '')),
    ),
    included: prepared.included,
    omitted: prepared.omitted,
  };
}
