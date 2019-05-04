import { PROTOCOL, API_URL } from './index';

export default async (benchmark, lastDaysOrFromDate) => {
    let fromDatePart = '';
    let rangePart = null;
    if (lastDaysOrFromDate instanceof Date)
        fromDatePart = `&data=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
    else if (typeof (lastDaysOrFromDate) == 'number')
        rangePart = {
            headers: {
                'Range-Unit': 'items',
                'Range': `0-${lastDaysOrFromDate - 1}`
            }
        };
    let tablePart = null;
    if (benchmark === 'cdi') {
        tablePart = 'fbcdata_sgs_12i';
    }
    else if (benchmark === 'bovespa') {
        tablePart = 'fbcdata_sgs_7i';
    }
    else if (benchmark === 'dolar') {
        tablePart = 'fbcdata_sgs_1i';
    }
    else if (benchmark === 'euro') {
        tablePart = 'fbcdata_sgs_21619i';
    }
    const result = await fetch(`${PROTOCOL}//${API_URL}/${tablePart}?select=data,valor${fromDatePart}&order=data.desc`, rangePart);
    if (result.status < 200 || result.status > 299)
        throw new Error('Unable to retrieve benchmark statistic');
    let data = await result.json();
    return data;
};
