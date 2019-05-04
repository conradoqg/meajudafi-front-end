import StatisticsService from '../service/statisticsService';
import { PROTOCOL, API_URL } from './index';

export default async (cnpj, benchmark, lastDaysOrFromDate, additionalFields) => {
    let fromDatePart = '';
    let rangePart = null;
    if (lastDaysOrFromDate instanceof Date)
        fromDatePart = `&ird_dt_comptc=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
    else if (typeof (lastDaysOrFromDate) == 'number')
        rangePart = {
            headers: {
                'Range-Unit': 'items',
                'Range': `0-${lastDaysOrFromDate - 1}`
            }
        };
    let additionalFieldsPart = '';
    if (Array.isArray(additionalFields) && additionalFields.length > 0)
        additionalFieldsPart = '&' + additionalFields.join(',');
    const result = await fetch(`${PROTOCOL}//${API_URL}/investment_return_daily?select=${additionalFieldsPart}ird_dt_comptc,ird_investment_return,${`ird_${benchmark}_investment_return`},ird_accumulated_quotaholders,ird_accumulated_networth&ird_cnpj_fundo=eq.${cnpj}${fromDatePart}&order=ird_dt_comptc.desc`, rangePart);
    if (result.status < 200 || result.status > 299)
        throw new Error('Unable to retrieve fund statistic');
    const data = await result.json();
    if (data.length === 0)
        throw new Error(`No data found for CNPJ ${cnpj}`);
    return (await StatisticsService.getInstance()).calculateFundHistory(data, benchmark);
};
