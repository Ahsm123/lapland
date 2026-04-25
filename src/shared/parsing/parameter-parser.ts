const PARAM_REGEX = /\{\{(\w+)\}\}/g;

export function extractParameters(script: string): string[] {
  const names: string[] = [];

  for (const match of script.matchAll(PARAM_REGEX)) {
    const name = match[1];
    if (!names.includes(name)) {
      names.push(name);
    }
  }

  return names;
}

export function resolveScript(
  script: string,
  parameters: Record<string, string>,
): string {
  return script.replace(PARAM_REGEX, (match, name: string) => {
    return name in parameters ? parameters[name] : match;
  });
}
