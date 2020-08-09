import fetchBE from '../util/fetchBE';

async function getEconomyIndicators(lastDaysOrFromDate) {
    let limit = '';
    if (lastDaysOrFromDate instanceof Date)
        limit = `&dt_comptc=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
    else if (typeof (lastDaysOrFromDate) == 'number')
        limit = `&limit=${lastDaysOrFromDate - 1}`;

    let { data } = await fetchBE(`running_days_with_indicators?select=dt_comptc,cdi_valor,selic_valor,bovespa_valor,euro_valor,dolar_valor${limit}&order=dt_comptc.desc`);

    const fields = [
        'date',
        'cdi',
        'selic',
        'bovespa',
        'euro',
        'dolar'
    ];
    const economyIndicators = {};
    const lastValue = {};
    fields.map(field => economyIndicators[field] = []);
    fields.map(field => lastValue[field] = 0);
    data = data.reverse();
    data.forEach(row => {
        fields.forEach(field => {
            var value = null;
            if (field === 'date')
                value = row.dt_comptc;
            else
                value = row[`${field}_valor`] == null ? lastValue[field] : row[`${field}_valor`];
            economyIndicators[field].push(value);
            lastValue[field] = value;
        });
    });
    return economyIndicators;
};

export default getEconomyIndicators;