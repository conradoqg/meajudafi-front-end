export default class NetworthCalculator {
    constructor() {
        this.lastNetworth = null;
    }
    add(networth) {
        if (this.lastNetworth == null)
            this.lastNetworth = networth;
        return networth - this.lastNetworth;
    }
}
