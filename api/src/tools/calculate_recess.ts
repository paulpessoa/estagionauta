export const calculateRecessDefinition = {
  type: 'function' as const,
  function: {
    name: 'calculate_recess',
    description: 'Calcula os dias e o valor proporcional de recesso (férias) de um estágio com base na data de início, data de término (opcional, padrão hoje) e valor da bolsa-auxílio.',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Data de início do estágio no formato YYYY-MM-DD.',
        },
        endDate: {
          type: 'string',
          description: 'Data de término do estágio no formato YYYY-MM-DD (opcional, padrão hoje).',
        },
        salario: {
          type: 'number',
          description: 'Valor da bolsa-auxílio mensal em Reais (ex: 1200.00).',
        },
      },
      required: ['startDate', 'salario'],
    },
  },
};

export async function runCalculateRecess(args: {
  startDate: string;
  endDate?: string;
  salario: number;
}) {
  try {
    const { startDate, endDate, salario } = args;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    if (isNaN(start.getTime())) {
      return { error: 'Data de início inválida. Use o formato YYYY-MM-DD.' };
    }

    // Reset hours to avoid timezone differences affecting daily diff
    const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    
    const diffTime = utcEnd - utcStart;
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    // Calculate months worked (fraction of 15 days or more counts as a month)
    const fullMonths = Math.floor(diffDays / 30);
    const remainderDays = diffDays % 30;
    const monthsWorked = remainderDays >= 15 ? fullMonths + 1 : fullMonths;

    // For every 12 months, student gets 30 days of recess
    const diasRecesso = Math.max(0, Math.floor((monthsWorked / 12) * 30));

    // Calculate daily salary
    const salarioDiario = salario / 30;

    // Calculate recess payment (same as salary)
    const valorRecesso = diasRecesso * salarioDiario;

    return {
      success: true,
      monthsWorked,
      diasRecesso,
      valorRecesso: parseFloat(valorRecesso.toFixed(2)),
      salarioDiario: parseFloat(salarioDiario.toFixed(2)),
      formula: 'Dias = (Meses Trabalhados ÷ 12) × 30; Valor = Dias × (Salário Mensal ÷ 30)',
    };
  } catch (err: any) {
    return { error: `Erro ao calcular recesso: ${err.message}` };
  }
}
