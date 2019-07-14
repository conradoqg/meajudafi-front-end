import { PROTOCOL, API_URL } from './index';

export default async (lastDaysOrFromDate, additionalFields) => {
    let limit = '';
    if (lastDaysOrFromDate instanceof Date)
        limit = `&irm_dt_comptc=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
    else if (typeof (lastDaysOrFromDate) == 'number')
        limit = `&limit=${lastDaysOrFromDate - 1}`;

    let additionalFieldsPart = '';
    if (Array.isArray(additionalFields) && additionalFields.length > 0)
        additionalFieldsPart = additionalFields.join(',');

    const investment_return_monthly_complete = await fetch(`${PROTOCOL}//${API_URL}/irm_timeseries?select=irm_dt_comptc,f_short_name,f_cnpj,icf_classe,${additionalFieldsPart}${limit}`);
    if (investment_return_monthly_complete.status < 200 || investment_return_monthly_complete.status > 299)
        throw new Error('Unable to retrieve fund data');

    return investment_return_monthly_complete.json()
}