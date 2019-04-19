export default class CorrelationCalculator {
    constructor() {
        this.sum1 = 0;
        this.sum2 = 0;
        this.sum1Sq = 0;
        this.sum2Sq = 0;
        this.pSum = 0;
    }
    add(investment_return, benchmark_investment_return, n) {
        this.sum1 += investment_return;
        this.sum2 += benchmark_investment_return;
        this.sum1Sq += Math.pow(investment_return, 2);
        this.sum2Sq += Math.pow(benchmark_investment_return, 2);
        this.pSum += investment_return * benchmark_investment_return;
        let num = this.pSum - (this.sum1 * this.sum2 / n);
        let den = Math.sqrt((this.sum1Sq - Math.pow(this.sum1, 2) / n) *
            (this.sum2Sq - Math.pow(this.sum2, 2) / n));
        if (den === 0 || Number.isNaN(den))
            return 0;
        else
            return num / den;
    }
}
