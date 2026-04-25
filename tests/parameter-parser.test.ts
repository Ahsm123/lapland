import { describe, it, expect } from 'vitest';
import { extractParameters, resolveScript } from '../src/shared/parsing/parameter-parser';

describe('extractParameters', () => {
  it('returns empty for no parameters', () => {
    expect(extractParameters("Write-Output 'Hello'")).toEqual([]);
  });

  it('returns single parameter', () => {
    expect(extractParameters("Write-Output '{{Name}}'")).toEqual(['Name']);
  });

  it('returns multiple parameters', () => {
    expect(
      extractParameters("Set-User -Name '{{Name}}' -Pass '{{Password}}'"),
    ).toEqual(['Name', 'Password']);
  });

  it('returns distinct for duplicates', () => {
    const result = extractParameters('{{Name}} and {{Name}} again');
    expect(result).toEqual(['Name']);
  });

  it('ignores PowerShell single braces', () => {
    expect(
      extractParameters('foreach ($x in $list) { Write-Output $x }'),
    ).toEqual([]);
  });

  it('only matches double curly braces', () => {
    expect(
      extractParameters(
        "foreach ($x in $list) { Write-Output '{{Name}}' }",
      ),
    ).toEqual(['Name']);
  });
});

describe('resolveScript', () => {
  it('replaces parameters with values', () => {
    const script = "Set-User -Name '{{Name}}' -Pass '{{Password}}'";
    const params = { Name: 'john', Password: 'secret123' };
    expect(resolveScript(script, params)).toBe(
      "Set-User -Name 'john' -Pass 'secret123'",
    );
  });

  it('leaves placeholder when parameter is missing', () => {
    expect(resolveScript("Write-Output '{{Name}}'", {})).toBe(
      "Write-Output '{{Name}}'",
    );
  });

  it('returns original when no parameters in script', () => {
    expect(resolveScript("Write-Output 'Hello'", {})).toBe(
      "Write-Output 'Hello'",
    );
  });
});
