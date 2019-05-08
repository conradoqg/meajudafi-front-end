import calculateFundStatistics from '../math/calculateFundStatistics';
import calculateBenchmarkStatistics from '../math/calculateBenchmarkStatistics';
import calculateCorrelationMatrix from '../math/calculateCorrelationMatrix';
import * as Comlink from 'comlinkjs';

class CalculateStatisticsWorker {
    calculateFundStatistics(fundHistory, benchmark) {
        return calculateFundStatistics(fundHistory, benchmark);
    }

    calculateBenchmarkStatistics(benchmarkHistory, benchmark) {
        return calculateBenchmarkStatistics(benchmarkHistory, benchmark);
    }

    calculateCorrelationMatrix(fundsHistory, benchmarksHistory, benchmark) {
        return calculateCorrelationMatrix(fundsHistory, benchmarksHistory, benchmark);
    }
}

Comlink.expose(CalculateStatisticsWorker, self); // eslint-disable-line no-restricted-globals