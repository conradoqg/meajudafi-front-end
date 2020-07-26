import { PROTOCOL, API_URL } from './index';

export default async fromDate => {
    const fundsChangedObject = await fetch(`${PROTOCOL}//${API_URL}/changed_funds?action_tstamp_stm=gte.${fromDate.toISOString().substring(0, 10)}&order=action_tstamp_stm.desc`);
    if (fundsChangedObject.status < 200 || fundsChangedObject.status > 299)
        throw new Error('Unable to retrieve changed funds');
    let data = await fundsChangedObject.json();
    return data;
};
