/*
  Warnings:

  - You are about to drop the column `amount` on the `investment_fd` table. All the data in the column will be lost.
  - You are about to alter the column `maturityValue` on the `investment_fd` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the column `amount` on the `investment_mutual_fund` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `investment_sip` table. All the data in the column will be lost.
  - You are about to alter the column `buyPrice` on the `investment_stock` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `investments` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "investment_fd" DROP COLUMN "amount",
ALTER COLUMN "maturityValue" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "investment_mutual_fund" DROP COLUMN "amount";

-- AlterTable
ALTER TABLE "investment_sip" DROP COLUMN "amount";

-- AlterTable
ALTER TABLE "investment_stock" ADD COLUMN     "ticker" TEXT,
ALTER COLUMN "buyPrice" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "investments" ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);
