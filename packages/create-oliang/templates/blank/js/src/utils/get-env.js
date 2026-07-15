export const getEnv = (key, defaultValue = "") => {
  const value = process.env[key] ?? defaultValue;
  if (!value) throw new Error(`Missing env variable:${key}`);
  return value;
};
