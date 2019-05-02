import calculateStatistics from '../math/calculateStatistics';
import calculateBenchmarkStatistics from '../math/calculateBenchmarkStatistics';
import calculateCorrelationMatrix from '../math/calculateCorrelationMatrix';
import * as Comlink from 'comlinkjs';

class CalculateStatisticsWorker {
    calculateFundHistory(data, benchmark) {
        return calculateStatistics(data, benchmark);
    }

    calculateBenchmarkHistory(data, benchmark) {
        return calculateBenchmarkStatistics(data, benchmark);
    }

    calculateCorrelationMatrix(fundsHistory, benchmarksHistory, benchmark) {
        return calculateCorrelationMatrix(fundsHistory, benchmarksHistory, benchmark);
    }
}

Comlink.expose(CalculateStatisticsWorker, self); // eslint-disable-line no-restricted-globals