import { getNextAuth } from "./config";

const auth = getNextAuth();

export { auth as GET, auth as POST };
