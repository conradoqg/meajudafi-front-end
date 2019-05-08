import allKeys from 'promise-results/allKeys';
import StatisticsService from '../service/statisticsService';
import getFundHistory from './getFundHistory';

export default async (cnpj, benchmark, lastDaysOrFromDate, additionalFields) => {
    const { statisticsServiceInstance, data } = await allKeys({
        statisticsServiceInstance: StatisticsService.getInstance(),
        data: getFundHistory(cnpj, benchmark, lastDaysOrFromDate, additionalFields)
    })
    return statisticsServiceInstance.calculateFundStatistics(data, benchmark);
};
