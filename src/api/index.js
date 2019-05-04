import getFundList from './getFundList';
import getFundData from './getFundData';
import getFundStatistic from './getFundStatistic';
import getFundHistory from './getFundHistory';
import getBenchmarkStatistic from './getBenchmarkStatistic';
import getBenchmarkHistory from './getBenchmarkHistory';
import getFundIndicators from './getFundIndicators';
import getEconomyIndicators from './getEconomyIndicators';
import getFundsChanged from './getFundsChanged';
import isInMaintenanceMode from './isInMaintenanceMode';

/* global process */
export const API_URL = process.env.REACT_APP_API_URL || `api.${window.location.host}`;
export const PROTOCOL = process.env.REACT_APP_PROTOCOL ? process.env.REACT_APP_PROTOCOL + ':' : '';

// const getCorrelationMatrix = async (fundsHistory, benchmarksHistory, benchmark) => {
//     benchmark = 'bovespa';

//     fundsHistory = [
//         (await getFundHistory('26673556000132', benchmark, 252)),
//         (await getFundHistory('18993924000100', benchmark, 252)),
//         (await getFundHistory('28798135000163', benchmark, 252)),
//         (await getFundHistory('00601692000123', benchmark, 252)),
//         (await getFundHistory('27347332000101', benchmark, 252)),
//         (await getFundHistory('26648868000196', benchmark, 252)),
//         (await getFundHistory('26673556000132', benchmark, 252)),
//         (await getFundHistory('18993924000100', benchmark, 252)),
//         (await getFundHistory('28798135000163', benchmark, 252)),
//         (await getFundHistory('00601692000123', benchmark, 252)),
//         (await getFundHistory('27347332000101', benchmark, 252)),
//         (await getFundHistory('26648868000196', benchmark, 252))
//     ]

//     benchmarksHistory = [
//         (await getBenchmarkHistory(benchmark, 252))
//     ];
//     return (await StatisticsService.getInstance()).calculateCorrelationMatrix(fundsHistory, benchmarksHistory, benchmark);
// };

export default {
    getFundList,
    getFundData,
    getFundStatistic,
    getFundHistory,
    getBenchmarkStatistic,
    getBenchmarkHistory,
    getFundIndicators,
    getEconomyIndicators,
    getFundsChanged,
    isInMaintenanceMode,
    //getCorrelationMatrix
};


