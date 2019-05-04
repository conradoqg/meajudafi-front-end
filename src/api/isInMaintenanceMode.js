import packageJson from '../../package.json';
import { PROTOCOL, API_URL } from './index';

export default async () => {
    const currentVersionArray = packageJson.version.split('.').map(value => parseInt(value));
    const minor = currentVersionArray[currentVersionArray.length - 2];
    const lastMigrationObject = await fetch(`${PROTOCOL}//${API_URL}/migrations?order=name.desc&limit=1`);
    if (lastMigrationObject.status < 200 || lastMigrationObject.status > 299)
        throw new Error('Unable to retrieve maintenance mode');
    const lastMigrationData = await lastMigrationObject.json();
    let migrationMinor = 0;
    if (lastMigrationData.length > 0) {
        migrationMinor = parseInt(lastMigrationData[0].name.substring(0, 8));
    }
    return minor !== migrationMinor;
};
