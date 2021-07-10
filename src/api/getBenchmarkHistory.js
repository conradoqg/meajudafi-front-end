import fetchBE from '../util/fetchBE';

async function getBenchmarkHistory(benchmark, lastDaysOrFromDate) {
    let tablePart = null;
    let selectPart = null;
    let dateField = null;
    if (benchmark === 'cdi') {
        tablePart = 'fbcdata_sgs_12i';
        selectPart = 'data,valor';
        dateField = 'data';
    }
    else if (benchmark === 'bovespa') {
        tablePart = 'yahoo_data';
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

    const { data } = await fetchBE(`${tablePart}?select=${selectPart}${limit}&order=${dateField}.desc`);

    return data;
};

export default getBenchmarkHistory;