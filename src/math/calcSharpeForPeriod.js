export default (risk, investment_return, cdi_investment_return, length) => {
    if (risk === 0)
        return 0;
    const annualizedAccInvestmentReturn = ((investment_return / length) * 252);
    const annualizedAccCDIInvestmentReturn = ((cdi_investment_return / length) * 252);
    return (annualizedAccInvestmentReturn - annualizedAccCDIInvestmentReturn) / risk;
};
