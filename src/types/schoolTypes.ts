export const SchoolTypes = {
  kindergarten: "kindergarten",
  elementary: "elementary",
};

export function isSchoolType(value: string): value is SchoolType {
  return Object.values(SchoolTypes).includes(value as SchoolType);
}

export type SchoolType = (typeof SchoolTypes)[keyof typeof SchoolTypes];

export const SchoolTypeValues = SchoolTypes;
