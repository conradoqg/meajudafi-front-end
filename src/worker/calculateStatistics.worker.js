import calculateStatistics from '../math/calculateStatistics';
import calculateBenchmarkStatistics from '../math/calculateBenchmarkStatistics';
import * as Comlink from 'comlinkjs';

class CalculateStatisticsWorker {
    calculateFundHistory(data, benchmark) {
        return calculateStatistics(data, benchmark);
    }

    calculateBenchmarkHistory(data, benchmark) {
        return calculateBenchmarkStatistics(data, benchmark);
    }
}

Comlink.expose(CalculateStatisticsWorker, self); // eslint-disable-line no-restricted-globals