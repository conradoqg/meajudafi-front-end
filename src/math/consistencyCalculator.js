export default class ConsistencyCalculator {
    constructor() {
        this.consistencyReached = 0;
        this.lastConsistency = [];
    }
    add(investment_return, cdi_investment_return, period) {
        let consistencyPoint = 0;
        if (investment_return >= cdi_investment_return)
            consistencyPoint = 1;
        if (period !== 0 && this.lastConsistency.length >= period)
            this.consistencyReached -= this.lastConsistency.shift();
        this.consistencyReached += consistencyPoint;
        this.lastConsistency.push(consistencyPoint);
        return ((100 * this.consistencyReached) / this.lastConsistency.length) / 100;
    }
}
