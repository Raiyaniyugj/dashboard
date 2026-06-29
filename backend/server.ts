import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import nodemailer from "nodemailer";
import { TransactionModel } from "./models/Transaction.js";
import { ReminderModel } from "./models/Reminder.js";
import { UserModel } from "./models/User.js";
import { protect, AuthRequest } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.set('toJSON', { virtuals: true });

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  if (!MONGODB_URI) {
    console.warn("WARNING: MONGODB_URI is not set. Database operations will fail.");
    return;
  }
  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log("Connected to MongoDB Atlas successfully!");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
};

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://wealthcapitalapp.vercel.app',
    'https://capital-front-raiyaniyugjs-projects.vercel.app',
    'https://capital-front-git-main-raiyaniyugjs-projects.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// ─── Ensure DB Connection (Serverless Middleware) ─────────────────────────────
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ─── Auth Routes (public) ─────────────────────────────────────────────────────
app.use("/api/auth", authRouter);

// ─── Transactions (protected) ─────────────────────────────────────────────────
app.get("/api/transactions", protect, async (req: AuthRequest, res) => {
  try {
    const list = await TransactionModel.find({ userId: req.userId, isDeleted: { $ne: true } }).sort({ date: -1 });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/transactions", protect, async (req: AuthRequest, res) => {
  try {
    const tx = new TransactionModel({ ...req.body, userId: req.userId });
    await tx.save();
    res.status(201).json(tx);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/transactions/:id", protect, async (req: AuthRequest, res) => {
  try {
    const tx = await TransactionModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!tx) return res.status(404).json({ error: "Transaction not found." });
    res.json(tx);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/transactions/:id", protect, async (req: AuthRequest, res) => {
  try {
    const tx = await TransactionModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!tx) return res.status(404).json({ error: "Transaction not found." });
    res.json({ success: true, message: "Transaction moved to trash." });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Deleted Transactions (protected) ─────────────────────────────────────────
app.get("/api/transactions/deleted/history", protect, async (req: AuthRequest, res) => {
  try {
    const list = await TransactionModel.find({ userId: req.userId, isDeleted: true }).sort({ deletedAt: -1 });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/transactions/:id/restore", protect, async (req: AuthRequest, res) => {
  try {
    const tx = await TransactionModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { isDeleted: false }, $unset: { deletedAt: 1 } },
      { new: true }
    );
    if (!tx) return res.status(404).json({ error: "Transaction not found." });
    res.json({ success: true, message: "Transaction restored.", transaction: tx });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/transactions/:id/permanent", protect, async (req: AuthRequest, res) => {
  try {
    const tx = await TransactionModel.findOneAndDelete({ _id: req.params.id, userId: req.userId, isDeleted: true });
    if (!tx) return res.status(404).json({ error: "Transaction not found." });
    res.json({ success: true, message: "Transaction permanently deleted." });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Reminders (protected) ────────────────────────────────────────────────────
app.get("/api/reminders", protect, async (req: AuthRequest, res) => {
  try {
    const list = await ReminderModel.find({ userId: req.userId }).sort({ dueDate: 1 });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reminders", protect, async (req: AuthRequest, res) => {
  try {
    const r = new ReminderModel({ ...req.body, userId: req.userId });
    await r.save();
    res.status(201).json(r);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/reminders/:id", protect, async (req: AuthRequest, res) => {
  try {
    const r = await ReminderModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!r) return res.status(404).json({ error: "Reminder not found." });
    res.json(r);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/reminders/:id", protect, async (req: AuthRequest, res) => {
  try {
    await ReminderModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── AI Insights (protected) ──────────────────────────────────────────────────
app.post("/api/insights", protect, async (req: AuthRequest, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return res.status(400).json({
        error: "API Key Missing",
        message: "Please configure your GEMINI_API_KEY variable in the Secrets Panel to unlock live AI Wealth Advising!"
      });
    }

    const { transactions, currentMonth } = req.body;
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: "Invalid data", message: "Missing transactions data array." });
    }

    const incomeList = transactions.filter((t: any) => t.type === 'income');
    const expenseList = transactions.filter((t: any) => t.type === 'expense');
    const totalIncome = incomeList.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const totalExpense = expenseList.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : "0.0";

    const transactionSummaries = expenseList.slice(0, 15).map((t: any) => {
      return `- ${t.date} | ${t.title} | ₹${t.amount} | "${t.note || 'No note'}"`;
    }).join("\n");

    const promptText = `
Analyze the following personal financial data for ${currentMonth || 'the current month'} and provide a professional, highly encouraging wealth audit and savings advisory.

=== FINANCIAL METRICS ===
- Total Income: ₹${totalIncome}
- Total Expenses: ₹${totalExpense}
- Net Monthly Savings: ₹${netSavings}
- Savings Rate: ${savingsRate}%

=== RECENT DETAILED EXPENSES (Top 15) ===
${transactionSummaries || '- No recent expenses registered.'}

Please craft your advisory in clean, professional, and visually stunning Markdown. Break it down structured exactly with these sections (use emojis tastefully to make parts highly readable):

1. 📊 ## Financial Health Grade & Summary
   Give a grade (A+, A, B, C, D, or F) representing their financial health based on their savings rate, and goal orientation. Provide a 2-3 sentence overview.

2.  ## Key Insights & Leak Detection
   Spot 2 or 3 significant patterns, anomalies, or hidden leaks in their spending.

3. 🚀 ## Personalized Optimization Playbook
   Deliver exactly 3 highly specific, creative, and action-oriented strategies they can implement immediately to save money or optimize their cash flow based on their transactions.

4. 💡 ## Smart Budgeting & Goals Recommendations
   Recommend what action or goals they should focus on next to achieve the highest wealth retention.
`;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: promptText,
      config: {
        systemInstruction: "You are an Elite Personal Financial Coach and Wealth Architect. Your goal is to guide clients toward financial independence with clear, realistic, and uplifting financial counseling. Always write in crisp, professional, structured Markdown with elegant headers, bold accents, and clear lists. Be encouraging, precise, and practical. Avoid boilerplate introductions or boring disclaimers.",
        temperature: 0.7
      }
    });

    return res.json({
      success: true,
      insights: response.text || "Your financial advisor is compiling numbers. Please request insights again in a moment."
    });

  } catch (err: any) {
    console.error("Gemini API Error details:", err);
    return res.status(500).json({
      success: false,
      error: "Advisory failed",
      message: err.message || "An error occurred while compiling your financial plan."
    });
  }
});

// ─── Cron Jobs (Serverless) ───────────────────────────────────────────────────
app.get("/api/cron/reminders", async (req, res) => {
  try {
    // Check for authorization (Vercel cron secret)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ error: "SMTP credentials not configured." });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Find reminders due within next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Normalize time for comparison
    const targetDateStr = threeDaysFromNow.toISOString().split('T')[0];

    // Find all incomplete, unnotified reminders where dueDate <= targetDateStr
    const remindersToNotify = await ReminderModel.find({
      completed: false,
      notificationSent: false,
      dueDate: { $lte: targetDateStr }
    }).populate('userId');

    let emailsSent = 0;

    for (const reminder of remindersToNotify) {
      const user = reminder.userId as any;
      if (!user || !user.email) continue;

      const remainingAmount = reminder.amount - (reminder.paidAmount || 0);

      const mailOptions = {
        from: `"Wealth Capital Alerts" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `⚠️ Upcoming Bill Reminder: ${reminder.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4F46E5;">Wealth Capital - Bill Guard Alert</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>This is a friendly automated reminder that you have an upcoming bill due very soon.</p>
            
            <div style="background-color: #F8FAFC; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Bill / Merchant:</strong> ${reminder.title}</p>
              <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(reminder.dueDate).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${reminder.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <p style="margin: 5px 0;"><strong>Remaining Balance:</strong> <span style="color: #E11D48; font-weight: bold;">₹${remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
              ${reminder.subject ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${reminder.subject}</p>` : ''}
            </div>
            
            <p>Please ensure you process the payment before the due date to avoid any late fees.</p>
            <br/>
            <p>Best regards,<br/><strong>Your Wealth Capital Assistant</strong></p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        reminder.notificationSent = true;
        await reminder.save();
        emailsSent++;
      } catch (err) {
        console.error(`Failed to send email to ${user.email}:`, err);
      }
    }

    res.json({ success: true, message: `Cron executed. Sent ${emailsSent} emails.` });
  } catch (err: any) {
    console.error("Cron Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "wealth-capital-api" });
});

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Expense Tracker backend server running at: http://localhost:${PORT}`);
  });
}

export default app;
