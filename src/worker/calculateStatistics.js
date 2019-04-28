export default () => {
    self.addEventListener('message', e => { // eslint-disable-line no-restricted-globals
        if (!e) return;

        function InvestmentReturnCalculator() {
            this.investmentReturn = 0;
        }

        InvestmentReturnCalculator.prototype.add = function add(investmentReturn) {
            this.investmentReturn = ((1 + this.investmentReturn) * (1 + investmentReturn)) - 1;
            return this.investmentReturn;
        }

        function ConsistencyCalculator() {
            this.consistencyReached = 0;
            this.lastConsistency = [];
        }

        ConsistencyCalculator.prototype.add = function add(investment_return, cdi_investment_return, period) {
            let consistencyPoint = 0;
            if (investment_return >= cdi_investment_return)
                consistencyPoint = 1;
            if (period !== 0 && this.lastConsistency.length >= period)
                this.consistencyReached -= this.lastConsistency.shift();
            this.consistencyReached += consistencyPoint;
            this.lastConsistency.push(consistencyPoint);
            return ((100 * this.consistencyReached) / this.lastConsistency.length) / 100;
        }

        function NetworthCalculator() {
            this.lastNetworth = null;
        }
        NetworthCalculator.prototype.add = function add(networth) {
            if (this.lastNetworth == null)
                this.lastNetworth = networth;
            return networth - this.lastNetworth;
        }

        function QuotaholdersCalculator() {
            this.lastQuotaholders = null;
        }
        QuotaholdersCalculator.prototype.add = function add(quotaholders) {
            if (this.lastQuotaholders == null)
                this.lastQuotaholders = quotaholders;
            return quotaholders - this.lastQuotaholders;
        }

        // A standard deviation object constructor. Running deviation (avoid growing arrays) which
        // is round-off error resistant. Based on an algorithm found in a Knuth book.
        function StandardDeviation(firstMeasurement) {
            this.workData = firstMeasurement == null ? 0 : firstMeasurement;
            this.lastWorkData = firstMeasurement == null ? firstMeasurement : null;
            this.S = 0;
            this.count = firstMeasurement == null ? 1 : 0;
        }

        // Add a measurement. Also calculates updates to stepwise parameters which are later used
        // to determine sigma.
        StandardDeviation.prototype.addMeasurement = function (measurement) {
            this.count += 1;
            this.lastWorkData = this.workData;
            this.workData = this.workData + (measurement - this.workData) / this.count;
            this.S = this.S + (measurement - this.lastWorkData) * (measurement - this.workData);
        };

        // Performs the final step needed to get the standard deviation and returns it.
        StandardDeviation.prototype.get = function () {
            if (this.count === 0) {
                throw new Error('Empty');
            }
            return Math.sqrt(this.S / (this.count));
        };

        // Replaces the value x currently present in this sample with the
        // new value y. In a sliding window, x is the value that
        // drops out and y is the new value entering the window. The sample
        // count remains constant with this operation.
        StandardDeviation.prototype.replace = function (x, y) {
            if (this.count === 0) {
                throw new Error('Empty');
            }
            const deltaYX = y - x;
            const deltaX = x - this.workData;
            const deltaY = y - this.workData;
            this.workData = this.workData + deltaYX / this.count;
            const deltaYp = y - this.workData;
            const countMinus1 = this.count - 1;
            this.S = this.S - this.count / countMinus1 * (deltaX * deltaX - deltaY * deltaYp) - deltaYX * deltaYp / countMinus1;
        };

        // Remove a measurement. Also calculates updates to stepwise parameters which are later used
        // to determine sigma.
        StandardDeviation.prototype.removeMeasurement = function (x) {
            if (this.count === 0) {
                throw new Error('Empty');
            } else if (this.count === 1) {
                this.workData = null;
                this.lastWorkData = null;
                this.S = 0;
                this.count = 1;
            }
            this.lastWorkData = (this.count * this.workData - x) / (this.count - 1);
            this.S -= (x - this.workData) * (x - this.lastWorkData);
            this.workData = this.lastWorkData;
            this.count -= 1;
        };

        function RiskCalculator() {
            this.standardDeviation = new StandardDeviation();
        }
        
        RiskCalculator.prototype.add = function add(investment_return) {
            this.standardDeviation.addMeasurement(investment_return);
            return this.standardDeviation.get() * Math.sqrt(252);
        }

        const calcSharpeForPeriod = (risk, investment_return, cdi_investment_return, length) => {
            if (risk === 0)
                return 0;
            const annualizedAccInvestmentReturn = ((investment_return / length) * 252);
            const annualizedAccCDIInvestmentReturn = ((cdi_investment_return / length) * 252);
            return (annualizedAccInvestmentReturn - annualizedAccCDIInvestmentReturn) / risk;
        };

        const calcRelativeInvestmentReturn = (investment_return, benchmark_investment_return) => investment_return / benchmark_investment_return;

        function CorrelationCalculator() {
            this.sum1 = 0;
            this.sum2 = 0;
            this.sum1Sq = 0;
            this.sum2Sq = 0;
            this.pSum = 0;
        }

        CorrelationCalculator.prototype.add = function add(investment_return, benchmark_investment_return, n) {
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

        const calculateStatistics = (data, benchmark) => {
        if (process.env.NODE_ENV === 'development') {
            console.time('calculateStatistics');
        }
        const statistics = {
            daily: {
                date: [],
                investment_return: [],
                benchmark_investment_return: [],
                relative_investment_return: [],
                risk: [],
                sharpe: [],
                consistency: [],
                networth: [],
                quotaholders: [],
                correlation: [],
                min_investment_return: 0,
                max_investment_return: 0,
                min_benchmark_investment_return: 0,
                max_benchmark_investment_return: 0,
            },
            accumulated: {},
            accumulatedByYear: {},
            byMonth: {},
            byYear: {}
        };
        const createCalculators = () => {
            return {
                entries: 1,
                investmentReturnCalculator: new InvestmentReturnCalculator(),
                benchmarkInvestmentReturnCalculator: new InvestmentReturnCalculator(),
                riskCalculator: new RiskCalculator(),
                consistencyCalculator: new ConsistencyCalculator(),
                networthCalculator: new NetworthCalculator(),
                quotaholdersCalculator: new QuotaholdersCalculator(),
                correlationCalculator: new CorrelationCalculator()
            };
        };
        const calculatorAccumulated = createCalculators();
        const calculatorByMonth = {};
        const calculatorByYear = {};
        for (let index = data.length - 1; index >= 0; index--) {
            const item = data[index];
            const date = item.ird_dt_comptc;
            const year = date.substring(0, 4);
            const month = date.substring(5, 7);
            if (index === data.length - 1) {
                statistics.daily.date.push(date);
                statistics.daily.investment_return.push(0);
                statistics.daily.benchmark_investment_return.push(0);
                statistics.daily.relative_investment_return.push(0);
                statistics.daily.risk.push(0);
                statistics.daily.sharpe.push(0);
                statistics.daily.consistency.push(0);
                statistics.daily.networth.push(0);
                statistics.daily.quotaholders.push(0);
                statistics.daily.correlation.push(0);
                statistics.daily.min_investment_return = 0;
                statistics.daily.max_investment_return = 0;
                statistics.daily.min_benchmark_investment_return = 0;
                statistics.daily.max_benchmark_investment_return = 0;
                continue;
            }
            calculatorAccumulated.entries += 1;
            if (!calculatorByMonth[year + month])
                calculatorByMonth[year + month] = createCalculators();
            else
                calculatorByMonth[year + month].entries += 1;
            if (!calculatorByYear[year])
                calculatorByYear[year] = createCalculators();
            else
                calculatorByYear[year].entries += 1;
            const investment_return = calculatorAccumulated.investmentReturnCalculator.add(item.ird_investment_return);
            const month_investment_return = calculatorByMonth[year + month].investmentReturnCalculator.add(item.ird_investment_return);
            const year_investment_return = calculatorByYear[year].investmentReturnCalculator.add(item.ird_investment_return);
            const benchmark_investment_return = calculatorAccumulated.benchmarkInvestmentReturnCalculator.add(item[`ird_${benchmark}_investment_return`]);
            const month_benchmark_investment_return = calculatorByMonth[year + month].benchmarkInvestmentReturnCalculator.add(item[`ird_${benchmark}_investment_return`]);
            const year_benchmark_investment_return = calculatorByYear[year].benchmarkInvestmentReturnCalculator.add(item[`ird_${benchmark}_investment_return`]);
            const relative_investment_return = calcRelativeInvestmentReturn(investment_return, benchmark_investment_return);
            const month_relative_investment_return = calcRelativeInvestmentReturn(month_investment_return, month_benchmark_investment_return);
            const year_relative_investment_return = calcRelativeInvestmentReturn(year_investment_return, year_benchmark_investment_return);
            const risk = calculatorAccumulated.riskCalculator.add(item.ird_investment_return);
            const month_risk = calculatorByMonth[year + month].riskCalculator.add(item.ird_investment_return);
            const year_risk = calculatorByYear[year].riskCalculator.add(item.ird_investment_return);
            const sharpe = calcSharpeForPeriod(risk, investment_return, benchmark_investment_return, calculatorAccumulated.entries);
            const month_sharpe = calcSharpeForPeriod(month_risk, month_investment_return, month_benchmark_investment_return, calculatorByMonth[year + month].entries);
            const year_sharpe = calcSharpeForPeriod(year_risk, year_investment_return, year_benchmark_investment_return, calculatorByYear[year].entries);
            const consistency = calculatorAccumulated.consistencyCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorAccumulated.entries);
            const month_consistency = calculatorByMonth[year + month].consistencyCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorByMonth[year + month].entries);
            const year_consistency = calculatorByYear[year].consistencyCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorByYear[year].entries);
            const networth = calculatorAccumulated.networthCalculator.add(item.ird_accumulated_networth);
            const month_networth = calculatorByMonth[year + month].networthCalculator.add(item.ird_accumulated_networth);
            const year_networth = calculatorByYear[year].networthCalculator.add(item.ird_accumulated_networth);
            const quotaholders = calculatorAccumulated.quotaholdersCalculator.add(item.ird_accumulated_quotaholders);
            const month_quotaholders = calculatorByMonth[year + month].quotaholdersCalculator.add(item.ird_accumulated_quotaholders);
            const year_quotaholders = calculatorByYear[year].quotaholdersCalculator.add(item.ird_accumulated_quotaholders);
            const correlation = calculatorAccumulated.correlationCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorAccumulated.entries);
            const month_correlation = calculatorByMonth[year + month].correlationCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorByMonth[year + month].entries);
            const year_correlation = calculatorByYear[year].correlationCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorByYear[year].entries);
            const min_investment_return = Math.min(statistics.daily.min_investment_return, investment_return);
            const max_investment_return = Math.max(statistics.daily.max_investment_return, investment_return);
            const min_benchmark_investment_return = Math.min(statistics.daily.min_benchmark_investment_return, benchmark_investment_return);
            const max_benchmark_investment_return = Math.max(statistics.daily.max_benchmark_investment_return, benchmark_investment_return);
            statistics.daily.date.push(date);
            statistics.daily.investment_return.push(investment_return);
            statistics.daily.benchmark_investment_return.push(benchmark_investment_return);
            statistics.daily.relative_investment_return.push(relative_investment_return);
            statistics.daily.risk.push(risk);
            statistics.daily.sharpe.push(sharpe);
            statistics.daily.consistency.push(consistency);
            statistics.daily.networth.push(networth);
            statistics.daily.quotaholders.push(quotaholders);
            statistics.daily.correlation.push(correlation);
            statistics.daily.min_investment_return = min_investment_return;
            statistics.daily.max_investment_return = max_investment_return;
            statistics.daily.min_benchmark_investment_return = min_benchmark_investment_return;
            statistics.daily.max_benchmark_investment_return = max_benchmark_investment_return;
            statistics.accumulated = {
                investment_return,
                benchmark_investment_return,
                relative_investment_return,
                risk,
                sharpe,
                consistency,
                networth,
                quotaholders,
                correlation,
                min_investment_return,
                max_investment_return,
                min_benchmark_investment_return,
                max_benchmark_investment_return
            };
            statistics.accumulatedByYear[year] = {
                year,
                investment_return,
                benchmark_investment_return,
                relative_investment_return,
                risk,
                sharpe,
                consistency,
                networth,
                quotaholders,
                correlation,
                min_investment_return,
                max_investment_return,
                min_benchmark_investment_return,
                max_benchmark_investment_return
            };
            statistics.byMonth[year + month] = {
                year,
                month,
                investment_return: month_investment_return,
                benchmark_investment_return: month_benchmark_investment_return,
                relative_investment_return: month_relative_investment_return,
                risk: month_risk,
                sharpe: month_sharpe,
                consistency: month_consistency,
                networth: month_networth,
                quotaholders: month_quotaholders,
                correlation: month_correlation
            };
            statistics.byYear[year] = {
                year,
                investment_return: year_investment_return,
                benchmark_investment_return: year_benchmark_investment_return,
                relative_investment_return: year_relative_investment_return,
                risk: year_risk,
                sharpe: year_sharpe,
                consistency: year_consistency,
                networth: year_networth,
                quotaholders: year_quotaholders,
                correlation: year_correlation
            };
        }
        if (process.env.NODE_ENV === 'development') {
            console.timeEnd('calculateStatistics');
        }
        return statistics;
    };

    postMessage(calculateStatistics(e.data.data, e.data.benchmark));
});
}