import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  note: { type: String, default: '' }
}, { timestamps: true });

export const TransactionModel = mongoose.model('Transaction', TransactionSchema);
