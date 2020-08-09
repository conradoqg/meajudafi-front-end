import packageJson from '../../package.json';
import fetchBE from '../util/fetchBE';

async function isInMaintenanceMode() {
    const currentVersionArray = packageJson.version.split('.').map(value => parseInt(value));
    const minor = parseInt(currentVersionArray[currentVersionArray.length - 2]);

    const workerVersion = await fetchBE(`about?select=info->>version&what=eq.worker`);
        
    let workerMinor = 0;
    if (workerVersion.length > 0) {
        const workerVersionArray = workerVersion[0].version.split('.').map(value => parseInt(value));
        workerMinor = parseInt(workerVersionArray[workerVersionArray.length - 2]);
    }
    return minor < workerMinor;
};

export default isInMaintenanceMode;