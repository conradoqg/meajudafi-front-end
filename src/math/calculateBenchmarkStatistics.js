import StandardDeviation from './standardDeviation';

export default (data, benchmark) => {
    if (process.env.NODE_ENV === 'development') {
        console.time('calculateBenchmarkStatistics');
    }
    let fromQuoteToPercentage = null;
    if (benchmark === 'cdi') {
        fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : value / 100;
    }
    else if (benchmark === 'bovespa') {
        fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : (value / prevValue) - 1;
    }
    else if (benchmark === 'dolar') {
        fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : (value / prevValue) - 1;
    }
    else if (benchmark === 'euro') {
        fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : (value / prevValue) - 1;
    }
    const statistics = {
        daily: {
            date: [],
            investment_return: [],
            risk: [],
            min_investment_return: 0,
            max_investment_return: 0
        },
        accumulated: {}
    };
    let prevValue = null;
    let investment_return = 0;
    let riskCalculator = new StandardDeviation();
    for (let index = data.length - 1; index >= 0; index--) {
        const item = data[index];
        const date = item.data;
        if (item.valor == null) continue;
        const value = fromQuoteToPercentage(item.valor, prevValue);
        prevValue = item.valor;
        investment_return = ((1 + investment_return) * (1 + value)) - 1;
        riskCalculator.addMeasurement(value);
        const risk = riskCalculator.get() * Math.sqrt(252);
        const min_investment_return = Math.min(statistics.daily.min_investment_return, investment_return);
        const max_investment_return = Math.max(statistics.daily.max_investment_return, investment_return);
        statistics.daily.date.push(date);
        statistics.daily.investment_return.push(investment_return);
        statistics.daily.risk.push(risk);
        statistics.daily.min_investment_return = min_investment_return;
        statistics.daily.max_investment_return = max_investment_return;
        statistics.accumulated = {
            investment_return,
            risk,
            min_investment_return,
            max_investment_return
        };
    }
    if (process.env.NODE_ENV === 'development') {
        console.timeEnd('calculateBenchmarkStatistics');
    }
    return statistics;
};
