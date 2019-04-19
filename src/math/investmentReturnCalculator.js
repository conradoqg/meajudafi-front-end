export default class InvestmentReturnCalculator {
    constructor() {
        this.investmentReturn = 0;
    }
    add(investmentReturn) {
        this.investmentReturn = ((1 + this.investmentReturn) * (1 + investmentReturn)) - 1;
        return this.investmentReturn;
    }
}
