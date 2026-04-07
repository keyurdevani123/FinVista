import { seedTransactions } from "@/actions/seed";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { success: false, error: "Seed endpoint is disabled in production" },
      { status: 403 }
    );
  }

  const result = await seedTransactions();
  return Response.json(result);
}
