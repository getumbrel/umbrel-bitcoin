import { BigNumber } from "bignumber.js";

// Never display numbers as exponents
BigNumber.config({ EXPONENTIAL_AT: 1e9 });

export function toPrecision(input, decimals = 8) {
  const number = new BigNumber(input);

  if (isNaN(number)) {
    return 0;
  }

  return number.decimalPlaces(decimals).toString();
}
