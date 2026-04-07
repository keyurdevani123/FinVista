"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

function isMissingTickerColumnError(error) {
  return (
    error?.code === "P2022" &&
    String(error?.meta?.column || "").includes("investment_stock.ticker")
  );
}

export async function getUserInvestments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  let investments;

  try {
    investments = await db.investment.findMany({
      where: { userId: user.id },
      include: {
        fd: true,
        stock: true,
        sip: true,
        mutualFund: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (!isMissingTickerColumnError(error)) {
      throw error;
    }

    investments = await db.investment.findMany({
      where: { userId: user.id },
      include: {
        fd: true,
        stock: {
          select: {
            id: true,
            companyName: true,
            buyPrice: true,
            quantity: true,
            purchaseDate: true,
          },
        },
        sip: true,
        mutualFund: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return investments.map((inv) => {
    // Only include flat scalars — never spread Prisma relation objects
    // (they contain Decimal fields that can't be passed to Client Components)
    const base = {
      id: inv.id,
      userId: inv.userId,
      type: inv.type,
      amount: inv.amount?.toString(),
      createdAt: inv.createdAt?.toISOString(),
      updatedAt: inv.updatedAt?.toISOString(),
    };

    if (inv.type === "FD" && inv.fd) {
      return {
        ...base,
        fdName: inv.fd.fdName,
        startDate: inv.fd.startDate?.toISOString(),
        endDate: inv.fd.endDate?.toISOString(),
        interestRate: inv.fd.interestRate,
        maturityValue: inv.fd.maturityValue?.toString(),
      };
    }

    if (inv.type === "STOCKS" && inv.stock) {
      return {
        ...base,
        companyName: inv.stock.companyName,
        ticker: inv.stock.ticker ?? null,
        buyPrice: inv.stock.buyPrice?.toString(),
        quantity: inv.stock.quantity,
        purchaseDate: inv.stock.purchaseDate?.toISOString(),
      };
    }

    if (inv.type === "SIP" && inv.sip) {
      return {
        ...base,
        fundName: inv.sip.fundName,
        startDate: inv.sip.startDate?.toISOString(),
        isActive: inv.sip.isActive,
        status: inv.sip.isActive ? "Active" : "Inactive",
      };
    }

    if (inv.type === "MUTUAL_FUNDS" && inv.mutualFund) {
      return {
        ...base,
        fundName: inv.mutualFund.fundName,
        investmentDate: inv.mutualFund.investmentDate?.toISOString(),
      };
    }

    return base;
  });
}

export async function bulkDelete(InvestmentIds) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    await db.investment.deleteMany({
      where: {
        id: { in: InvestmentIds },
        userId: user.id,
      },
    });

    revalidatePath("/Investement");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
