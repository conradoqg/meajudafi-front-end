import calculateStatistics from '../math/calculateStatistics';

self.addEventListener('message', e => { // eslint-disable-line no-restricted-globals
    if (!e) return;
    postMessage(calculateStatistics(e.data.data, e.data.benchmark));
});