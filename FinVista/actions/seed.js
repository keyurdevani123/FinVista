"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { subDays } from "date-fns";
import { revalidatePath } from "next/cache";

const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [50000, 150000] },
    { name: "freelance", range: [22000, 66000] },
    { name: "investments", range: [11000, 44000] },
    { name: "other-income", range: [2200, 22000] },
  ],
  EXPENSE: [
    { name: "housing", range: [22000, 44000] },
    { name: "transportation", range: [2200, 11000] },
    { name: "groceries", range: [4400, 13200] },
    { name: "utilities", range: [2200, 6600] },
    { name: "entertainment", range: [1100, 4400] },
    { name: "food", range: [1100, 3300] },
    { name: "shopping", range: [2200, 11000] },
    { name: "healthcare", range: [2200, 22000] },
    { name: "education", range: [4400, 22000] },
    { name: "travel", range: [11000, 44000] },
  ],
};

function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomCategory(type) {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  return { category: category.name, amount: getRandomAmount(...category.range) };
}

export async function seedTransactions() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return { success: false, error: "User not found" };

    // Find existing account or create one
    let account = await db.account.findFirst({ where: { userId: user.id } });
    if (!account) {
      account = await db.account.create({
        data: {
          name: "Main Savings",
          type: "SAVINGS",
          balance: 0,
          isDefault: true,
          userId: user.id,
        },
      });
    }

    const transactions = [];
    let totalBalance = 0;

    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const count = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < count; j++) {
        const type = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
        const { category, amount } = getRandomCategory(type);

        transactions.push({
          id: crypto.randomUUID(),
          type,
          amount,
          description: `${type === "INCOME" ? "Received" : "Paid for"} ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId: user.id,
          accountId: account.id,
          createdAt: date,
          updatedAt: date,
        });

        totalBalance += type === "INCOME" ? amount : -amount;
      }
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { accountId: account.id } });
      await tx.transaction.createMany({ data: transactions });
      await tx.account.update({
        where: { id: account.id },
        data: { balance: totalBalance },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/account/" + account.id);

    return { success: true, message: `Created ${transactions.length} transactions` };
  } catch (error) {
    console.error("Error seeding transactions:", error);
    return { success: false, error: error.message };
  }
}
