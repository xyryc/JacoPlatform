const ZIP_CODE_REGEX = /\b\d{5}(?:-\d{4})?\b/;

export const extractZipCode = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const text = String(value || '').trim();
    if (!text) continue;

    const match = text.match(ZIP_CODE_REGEX);
    if (match?.[0]) {
      return match[0].slice(0, 5);
    }
  }

  return '';
};

export const isValidZipCode = (value: string) => ZIP_CODE_REGEX.test(String(value || '').trim());
