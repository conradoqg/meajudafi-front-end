import CalculateStatisticsWorker from '../worker/calculateStatistics.worker';
import * as Comlink from 'comlinkjs';

const CalculateStatisticsWorkerProxy = Comlink.proxy(new CalculateStatisticsWorker());

class StatisticsService {
    
    async getInstance() {
        if (!StatisticsService.instance) StatisticsService.instance = new CalculateStatisticsWorkerProxy()

        return StatisticsService.instance;
    }
}

export default new StatisticsService();