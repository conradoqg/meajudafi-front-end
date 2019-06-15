import { PROTOCOL, API_URL } from './index';

export default async (benchmark, lastDaysOrFromDate) => {
    let limit = '';    
    if (lastDaysOrFromDate instanceof Date)
        limit = `&data=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
    else if (typeof (lastDaysOrFromDate) == 'number')
        limit = `&limit=${lastDaysOrFromDate - 1}`;
       
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
    const result = await fetch(`${PROTOCOL}//${API_URL}/${tablePart}?select=data,valor${limit}&order=data.desc`);
    if (result.status < 200 || result.status > 299)
        throw new Error('Unable to retrieve benchmark statistic');
    let data = await result.json();
    return data;
};
