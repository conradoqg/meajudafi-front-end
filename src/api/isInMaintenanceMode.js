import packageJson from '../../package.json';
import { PROTOCOL, API_URL } from './index';

export default async () => {
    const currentVersionArray = packageJson.version.split('.').map(value => parseInt(value));
    const minor = parseInt(currentVersionArray[currentVersionArray.length - 2]);

    const workerVersionObject = await fetch(`${PROTOCOL}//${API_URL}/about?select=info->>version&what=eq.worker`);

    if (workerVersionObject.status < 200 || workerVersionObject.status > 299)
        throw new Error('Unable to retrieve maintenance mode');
    const workerVersion = await workerVersionObject.json();
    let workerMinor = 0;
    if (workerVersion.length > 0) {
        const workerVersionArray = workerVersion[0].version.split('.').map(value => parseInt(value));
        workerMinor = parseInt(workerVersionArray[workerVersionArray.length - 2]);
    }    
    return minor < workerMinor;
};
