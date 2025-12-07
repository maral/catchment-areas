export const sortFounders = (a: string, b: string) => {
  if (a.includes("Městská část Praha ") && a.length < b.length) {
    return -1;
  } else if (b.includes("Městská část Praha ") && a.length > b.length) {
    return 1;
  }
  return a.localeCompare(b, "cs");
};