export const ADMIN_FEE_RATE = 0.15;

export const roundMoney = (value: number) => Number((Number(value) || 0).toFixed(2));

export const calculateAdminFeeAmount = (baseAmount: number) =>
  roundMoney((Number(baseAmount) || 0) * ADMIN_FEE_RATE);

export const calculateProviderNetAmount = (baseAmount: number) =>
  roundMoney(Math.max((Number(baseAmount) || 0) - calculateAdminFeeAmount(baseAmount), 0));

export const calculateClientPaymentAmount = (baseAmount: number) => roundMoney(Number(baseAmount) || 0);
