import { PROTOCOL, API_URL } from './index';

export default async (benchmark, lastDaysOrFromDate) => {           
    let tablePart = null;
    let selectPart = null;
    let dateField = null;
    if (benchmark === 'cdi') {
        tablePart = 'fbcdata_sgs_12i';
        selectPart = 'data,valor';
        dateField = 'data';
    }
    else if (benchmark === 'bovespa') {
        tablePart = 'wtd_ibov';
        selectPart = 'data:date,valor:close';
        dateField = 'date';
    }
    else if (benchmark === 'dolar') {
        tablePart = 'fbcdata_sgs_1i';
        selectPart = 'data,valor';
        dateField = 'data';
    }
    else if (benchmark === 'euro') {
        tablePart = 'fbcdata_sgs_21619i';
        selectPart = 'data,valor';
        dateField = 'data';
    }

    let limit = '';    
    if (lastDaysOrFromDate instanceof Date)
        limit = `&${dateField}=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
    else if (typeof (lastDaysOrFromDate) == 'number')
        limit = `&limit=${lastDaysOrFromDate - 1}`;

    const result = await fetch(`${PROTOCOL}//${API_URL}/${tablePart}?select=${selectPart}${limit}&order=${dateField}.desc`);
    if (result.status < 200 || result.status > 299)
        throw new Error('Unable to retrieve benchmark statistic');
    let data = await result.json();
    return data;
};
