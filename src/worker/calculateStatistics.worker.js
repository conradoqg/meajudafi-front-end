import calculateFundStatistics from '../math/calculateFundStatistics';
import calculateBenchmarkStatistics from '../math/calculateBenchmarkStatistics';
import calculateCorrelationMatrix from '../math/calculateCorrelationMatrix';
import * as Comlink from 'comlinkjs';

class CalculateStatisticsWorker {
    calculateFundStatistics(fundHistory, benchmark, startingFrom) {
        return calculateFundStatistics(fundHistory, benchmark, startingFrom);
    }

    calculateBenchmarkStatistics(benchmarkHistory, benchmark, startingFrom) {
        return calculateBenchmarkStatistics(benchmarkHistory, benchmark, startingFrom);
    }

    calculateCorrelationMatrix(fundsHistory, benchmarksHistory, benchmark, startingFrom) {
        return calculateCorrelationMatrix(fundsHistory, benchmarksHistory, benchmark, startingFrom);
    }
}

Comlink.expose(CalculateStatisticsWorker, self); // eslint-disable-line no-restricted-globals