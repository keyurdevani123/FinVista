# 💰 SaveSphere — Personal Finance & Investment Manager

![SaveSphere Logo](./public/savesphere-logo.png) <!-- Replace with your actual logo or banner image -->

[![Next.js](https://img.shields.io/badge/Built%20With-Next.js-blue.svg?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Styled%20With-TailwindCSS-06b6d4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2d3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/github/license/your-username/savesphere)](./LICENSE)

> 📊 A sleek and intelligent personal finance application to track, manage, and analyze your investments and expenses.

---

## 🚀 Features

✨ **Investment Management**
- Add, edit, and delete FDs, Stocks, SIPs, and Mutual Funds.
- Scrollable cards with sticky summary bars.
- Real-time summaries: Total Invested, Maturity Value, P&L, and more.

📌 **Transaction Tracking**
- Add recurring and categorized transactions.
- Upload receipts and auto-fill using **Gemini AI**.

📈 **Live Stock Prices**
- Integrated with **Yahoo Finance** for up-to-date stock data.

📧 **Smart Alerts**
- Monthly reports and budget alerts via **Inhest**.

🧹 **Bulk Actions**
- Select and delete multiple investments at once.

🌐 **Responsive & Accessible**
- Optimized for all devices using Tailwind and accessible components from `shadcn/ui`.

🛡️ **Security First**
- Powered by **Arcjet** for edge protection and bot shielding.

---

## 🧠 Tech Stack

| Layer         | Tech                                      |
|---------------|-------------------------------------------|
| **Frontend**  | Next.js App Router, React, Tailwind CSS   |
| **UI/UX**     | shadcn/ui, Lucide Icons                   |
| **Backend**   | Next.js API Routes (Server Actions)       |
| **Database**  | PostgreSQL + Prisma ORM                   |
| **Auth**      | Clerk                                     |
| **AI**        | Gemini AI (receipt auto-fill)             |
| **Finance API**| Yahoo Finance API                        |
| **Emails**    | Inngest (monthly reports & alerts)         |
| **Security**  | Arcjet                                     |

---

## 📸 Screenshots

<!-- Replace the placeholder paths with actual screenshots from your project -->
| Dashboard | Investment Cards | Add Investment Modal |
|----------|------------------|-----------------------|
| ![](./public/screens/dashboard.png) | ![](./public/screens/cards.png) | ![](./public/screens/modal.png) |

---

## 🛠️ Setup Instructions

```bash
# Clone the repo
git clone https://github.com/your-username/savesphere.git
cd savesphere

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Then update DB credentials, Clerk keys, Yahoo API key, etc.

# Run the development server
npm run dev
