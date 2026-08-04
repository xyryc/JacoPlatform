export const extractZipCode = (value: string) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.slice(0, 5);
};

export const isValidZipCode = (value: string) => /^\d{5}$/.test(String(value || ""));
