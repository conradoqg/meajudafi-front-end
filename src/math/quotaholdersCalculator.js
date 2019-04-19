export default class QuotaholdersCalculator {
    constructor() {
        this.lastQuotaholders = null;
    }
    add(quotaholders) {
        if (this.lastQuotaholders == null)
            this.lastQuotaholders = quotaholders;
        return quotaholders - this.lastQuotaholders;
    }
}
