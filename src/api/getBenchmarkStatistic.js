import allKeys from 'promise-results/allKeys';
import StatisticsService from '../service/statisticsService';
import getBenchmarkHistory from './getBenchmarkHistory';

export default async (benchmark, lastDaysOrFromDate) => {
    const { statisticsServiceInstance, data } = await allKeys({
        statisticsServiceInstance: StatisticsService.getInstance(),
        data: getBenchmarkHistory(benchmark, lastDaysOrFromDate)
    });
    return statisticsServiceInstance.calculateBenchmarkStatistics(data, benchmark);
};
