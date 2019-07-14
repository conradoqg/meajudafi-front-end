import { PROTOCOL, API_URL } from './index';

export default async () => {
    const investment_return_monthly_complete = await fetch(`${PROTOCOL}//${API_URL}/irm_timeseries`);
    if (investment_return_monthly_complete.status < 200 || investment_return_monthly_complete.status > 299)
        throw new Error('Unable to retrieve fund data');

    return investment_return_monthly_complete.json()
}