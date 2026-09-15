export const enumToArray = (enumObj: any) =>
  Object.values(enumObj) as [string, ...string[]];
