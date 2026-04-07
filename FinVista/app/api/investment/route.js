import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

function isMissingTickerColumnError(error) {
  if (error?.code !== "P2022") return false;

  const column = String(error?.meta?.column || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    column.includes("ticker") ||
    column.includes("investment_stock.ticker") ||
    message.includes("investment_stock.ticker") ||
    message.includes("column") && message.includes("ticker")
  );
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data = await req.json();
  const { type, amount, name, ...extra } = data;

  const parsedAmount = amount ? Number(amount) : 0;

  if (type === "FD") {
    const startDate = extra.startDate ? new Date(extra.startDate) : new Date();
    const endDate = extra.endDate ? new Date(extra.endDate) : undefined;
    const interestRate = extra.interestRate ? Number(extra.interestRate) : 0;

    let maturityValue = parsedAmount;
    if (parsedAmount && interestRate && startDate && endDate) {
      const years =
        (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
      maturityValue = Number(
        (parsedAmount * Math.pow(1 + interestRate / 100, years)).toFixed(2)
      );
    }

    await db.investment.create({
      data: {
        userId: user.id,
        type,
        amount: parsedAmount,
        fd: {
          create: {
            fdName: name,
            startDate,
            endDate,
            interestRate,
            maturityValue,
          },
        },
      },
    });
  } else if (type === "STOCKS") {
    const quantity = extra.quantity ? Number(extra.quantity) : 0;
    const buyPrice = parsedAmount; // amount field = buy price per share

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
      return NextResponse.json(
        { error: "Buy price must be greater than 0" },
        { status: 400 }
      );
    }

    const totalCost = buyPrice * quantity;
    const ticker = extra.ticker?.trim() || null;

    // Check if user already has this stock (per-user dedup)
    const existingStock = await db.investmentStock.findFirst({
      where: {
        companyName: name,
        investment: { userId: user.id },
      },
      select: {
        id: true,
        quantity: true,
        buyPrice: true,
      },
    });

    if (existingStock) {
      const prevQty = Number(existingStock.quantity);
      const prevPrice = Number(existingStock.buyPrice);
      const newQty = prevQty + quantity;
      const avgPrice = (prevPrice * prevQty + buyPrice * quantity) / newQty;

      const stockUpdateData = {
        quantity: newQty,
        buyPrice: avgPrice,
        ...(ticker ? { ticker } : {}),
      };

      try {
        await db.investmentStock.update({
          where: { id: existingStock.id },
          data: stockUpdateData,
          select: { id: true },
        });
      } catch (error) {
        if (!(ticker && isMissingTickerColumnError(error))) {
          throw error;
        }

        await db.investmentStock.update({
          where: { id: existingStock.id },
          data: {
            quantity: newQty,
            buyPrice: avgPrice,
          },
          select: { id: true },
        });
      }

      // Update the base investment amount (total cost basis)
      await db.investment.update({
        where: { id: existingStock.id },
        data: { amount: avgPrice * newQty },
      });
    } else {
      const stockCreateData = {
        companyName: name,
        quantity,
        buyPrice,
        purchaseDate: extra.purchaseDate
          ? new Date(extra.purchaseDate)
          : new Date(),
        ...(ticker ? { ticker } : {}),
      };

      try {
        await db.investment.create({
          data: {
            userId: user.id,
            type,
            amount: totalCost,
            stock: {
              create: stockCreateData,
            },
          },
        });
      } catch (error) {
        if (!(ticker && isMissingTickerColumnError(error))) {
          throw error;
        }

        await db.investment.create({
          data: {
            userId: user.id,
            type,
            amount: totalCost,
            stock: {
              create: {
                companyName: name,
                quantity,
                buyPrice,
                purchaseDate: extra.purchaseDate
                  ? new Date(extra.purchaseDate)
                  : new Date(),
              },
            },
          },
        });
      }
    }
  } else if (type === "SIP") {
    await db.investment.create({
      data: {
        userId: user.id,
        type,
        amount: parsedAmount, // monthly installment stored as base amount
        sip: {
          create: {
            fundName: name,
            startDate: extra.startDate ? new Date(extra.startDate) : new Date(),
            isActive: extra.status === "Active",
          },
        },
      },
    });
  } else if (type === "MUTUAL_FUNDS") {
    await db.investment.create({
      data: {
        userId: user.id,
        type,
        amount: parsedAmount,
        mutualFund: {
          create: {
            fundName: name,
            investmentDate: extra.investmentDate
              ? new Date(extra.investmentDate)
              : new Date(),
          },
        },
      },
    });
  } else {
    return NextResponse.json(
      { error: "Invalid investment type" },
      { status: 400 }
    );
  }

  revalidatePath("/Investement");
  return NextResponse.json({ success: true });
}
