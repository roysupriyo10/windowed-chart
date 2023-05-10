function convertToInternationalCurrencySystem(labelValue) {
  return Math.abs(Number(labelValue)) >= 1.0e+9
  ? (Math.abs(Number(labelValue)) / 1.0e+9).toFixed(3) + "B"
  : Math.abs(Number(labelValue)) >= 1.0e+6
  ? (Math.abs(Number(labelValue)) / 1.0e+6).toFixed(3) + "M"
  : Math.abs(Number(labelValue)) >= 1.0e+3
  ? (Math.abs(Number(labelValue)) / 1.0e+3).toFixed(3) + "K"
  : parseInt(Math.abs(Number(labelValue)));
}

export default convertToInternationalCurrencySystem