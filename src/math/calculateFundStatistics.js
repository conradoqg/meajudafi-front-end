import InvestmentReturnCalculator from './investmentReturnCalculator';
import ConsistencyCalculator from './consistencyCalculator';
import NetworthCalculator from './networthCalculator';
import QuotaholdersCalculator from './quotaholdersCalculator';
import RiskCalculator from './riskCalculator';
import calcSharpeForPeriod from './calcSharpeForPeriod';
import calcRelativeInvestmentReturn from './calcRelativeInvestmentReturn';
import CorrelationCalculator from './correlationCalculator';

export default (data, benchmark, startingFrom = '0001-01-01') => {
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
    let first = true;
    for (let index = data.length - 1; index >= 0; index--) {        
        const item = data[index];        
        const date = item.ird_dt_comptc;        
        const year = date.substring(0, 4);
        const month = date.substring(5, 7);        

        if (date >= startingFrom && first) {
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
            first = false;
            continue;
        } else if (first) continue;
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
