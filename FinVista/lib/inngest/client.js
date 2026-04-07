import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "finvista", // Unique app ID
  name: "FinVista",
  retryFunction: async (attempt) => ({
    delay: Math.pow(2, attempt) * 1000, // Exponential backoff
    maxAttempts: 2,
  }),
});
