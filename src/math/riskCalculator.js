import StandardDeviation from './standardDeviation';

export default class RiskCalculator {
    constructor() {
        this.standardDeviation = new StandardDeviation();
    }
    add(investment_return) {
        this.standardDeviation.addMeasurement(investment_return);
        return this.standardDeviation.get() * Math.sqrt(252);
    }
}
