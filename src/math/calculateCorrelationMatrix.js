import CorrelationCalculator from '../math/correlationCalculator';
import QuotaToPercentageCalculator from '../math/quotaToPercentageCalculator';

export default async (fundsHistory, benchmarksHistory, benchmark) => {
    if (process.env.NODE_ENV === 'development') {
        console.time('calculateCorrelationMatrix');
    }

    fundsHistory = fundsHistory.map(fundHistory => fundHistory.map(day => { return { date: day.ird_dt_comptc, value: day.ird_investment_return } }));

    const quotaToPercentageCalculator = new QuotaToPercentageCalculator(benchmark);
    benchmarksHistory = benchmarksHistory.map(benchmarkHistory => {
        const newBenchmarkHistory = [];
        for (let index = benchmarkHistory.length - 1; index >= 0; index--) {
            const day = benchmarkHistory[index];
            newBenchmarkHistory.unshift({ date: day.data, value: quotaToPercentageCalculator.add(day.valor) });
        }
        return newBenchmarkHistory;
    });

    let history = benchmarksHistory.concat(fundsHistory);

    const data = Array(history.length);

    let indexes = history.map(fundHistory => fundHistory.length - 1);

    const moveIndexes = largestDay => (fundHistoryIndex, index) => {
        while (history[index][fundHistoryIndex].date < largestDay) {
            fundHistoryIndex--;
        }

        return fundHistoryIndex;
    }

    const findLargestDay = (acc, fundHistory, index) => {
        return fundHistory[indexes[index]].date > acc ? fundHistory[indexes[index]].date : acc;
    };

    const addData = (fundHistoryIndex, index) => {
        if (!Array.isArray(data[index])) data[index] = [];
        data[index].push(history[index][fundHistoryIndex]);
    }

    while (!indexes.some(fundHistoryIndex => fundHistoryIndex < 0)) {
        const largestDay = history.reduce(findLargestDay, '');

        indexes = indexes.map(moveIndexes(largestDay));

        indexes.forEach(addData);

        indexes = indexes.map(fundHistoryIndex => --fundHistoryIndex);
    }

    const correlationMatrix = data.map((fund, currentIndex) => {
        const correlations = [];
        for (let index = 0; index <= currentIndex; index++) {
            const fundAgainst = data[index];
            if (index !== currentIndex) {
                const correlationCalculator = new CorrelationCalculator();
                correlations.push(fund.reduce((acc, day, reduceIndex) => {
                    if (reduceIndex === 0) return 0;
                    return correlationCalculator.add(day.value, fundAgainst[reduceIndex].value, reduceIndex + 1)
                }, 0));
            } else {
                correlations.push(1)
            }
        }
        return correlations;
    });

    if (process.env.NODE_ENV === 'development') {
        console.timeEnd('calculateCorrelationMatrix');
    }

    return correlationMatrix;
};