import bcrypt from "bcrypt";
export const hashPassword = async (password: string) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};
export const comparePassword = async (password: string, hash: string) => {
  // INFO: PHP's password_hash (used by Laravel) outputs $2y$ which Node's bcrypt doesn't recognize.
  // We swap it to $2a$ which is compatible and recognized by Node's bcrypt.
  const normalizedHash = hash.replace(/^\$2y\$/, "$2a$");
  return await bcrypt.compare(password, normalizedHash);
};
