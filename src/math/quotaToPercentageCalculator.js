export default class QuotaToPercentageCalculator {
    constructor(benchmark) {
        this.lastQuota = null;
        this.fromQuoteToPercentage = null;
        if (benchmark === 'cdi') {
            this.fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : value / 100;
        }
        else if (benchmark === 'bovespa') {
            this.fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : (value / prevValue) - 1;
        }
        else if (benchmark === 'dolar') {
            this.fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : (value / prevValue) - 1;
        }
        else if (benchmark === 'euro') {
            this.fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : (value / prevValue) - 1;
        }
    }
    add(quota) {
        const percentage = this.fromQuoteToPercentage(quota, this.lastQuota);
        this.lastQuota = quota;
        return percentage;        
    }
}
