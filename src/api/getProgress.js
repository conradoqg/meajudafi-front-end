import { PROTOCOL, API_URL } from './index';

export default async () => {    
    
    const progressObject = await fetch(`${PROTOCOL}//${API_URL}/progress?order=data->progressTracker->state->start.desc`, {
        method: 'GET',
        headers: {
            'Prefer': 'count=exact'
        }
    });
    if (progressObject.status < 200 || progressObject.status > 299)
        throw new Error('Unable to retrieve fund list');
   
    return await progressObject.json();
};
