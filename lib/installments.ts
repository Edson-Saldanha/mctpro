// Gera o cronograma de parcelas a partir do valor financiado,
// tipo de parcelamento e quantidade de parcelas.

export type InstallmentType = "vista" | "semanal" | "quinzenal" | "mensal";

export interface GeneratedInstallment {
  installment_number: number;
  due_date: string; // ISO date
  amount: number;
}

export function generateInstallments(
  financedAmount: number,
  type: InstallmentType,
  count: number,
  firstDueDate: Date = new Date()
): GeneratedInstallment[] {
  if (type === "vista" || count <= 1) {
    return [
      {
        installment_number: 1,
        due_date: firstDueDate.toISOString().slice(0, 10),
        amount: round2(financedAmount),
      },
    ];
  }

  const baseAmount = round2(financedAmount / count);
  const result: GeneratedInstallment[] = [];
  let runningTotal = 0;

  for (let i = 0; i < count; i++) {
    const due = new Date(firstDueDate);
    if (type === "semanal") due.setDate(due.getDate() + 7 * i);
    if (type === "quinzenal") due.setDate(due.getDate() + 15 * i);
    if (type === "mensal") due.setMonth(due.getMonth() + i);

    // ajusta a última parcela para fechar exatamente o valor total (resto de centavos)
    const isLast = i === count - 1;
    const amount = isLast ? round2(financedAmount - runningTotal) : baseAmount;
    runningTotal += amount;

    result.push({
      installment_number: i + 1,
      due_date: due.toISOString().slice(0, 10),
      amount,
    });
  }

  return result;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
