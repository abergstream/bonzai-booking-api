import { nanoid } from "nanoid";
const test = nanoid();
export const handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: test,
    }),
  };
};
