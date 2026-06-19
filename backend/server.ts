import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { TransactionModel } from "./models/Transaction.js";
import { ReminderModel } from "./models/Reminder.js";
import { protect, AuthRequest } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.set('toJSON', { virtuals: true });

if (!MONGODB_URI) {
  console.warn("WARNING: MONGODB_URI is not set. Database operations will fail.");
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB Atlas successfully!"))
    .catch(err => console.error("MongoDB Connection Error:", err));
}

const app = express();
app.use(cors());
app.use(express.json());

// ─── Auth Routes (public) ─────────────────────────────────────────────────────
app.use("/api/auth", authRouter);

// ─── Transactions (protected) ─────────────────────────────────────────────────
app.get("/api/transactions", protect, async (req: AuthRequest, res) => {
  try {
    const list = await TransactionModel.find({ userId: req.userId }).sort({ date: -1 });
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
    await TransactionModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Reminders (protected) ────────────────────────────────────────────────────
app.get("/api/reminders", protect, async (req: AuthRequest, res) => {
  try {
    const list = await ReminderModel.find({ userId: req.userId }).sort({ date: 1 });
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
      model: "gemini-3.5-flash",
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

// ─── Production Static Files ───────────────────────────────────────────────────
const distPath = path.join(process.cwd(), "..", "frontend", "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Expense Tracker backend server running at: http://localhost:${PORT}`);
});
