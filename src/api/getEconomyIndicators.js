import { PROTOCOL, API_URL } from './index';

export default async (lastDaysOrFromDate) => {
    let fromDatePart = '';
    let rangePart = null;
    if (lastDaysOrFromDate instanceof Date)
        fromDatePart = `&dt_comptc=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
    else if (typeof (lastDaysOrFromDate) == 'number')
        rangePart = {
            headers: {
                'Range-Unit': 'items',
                'Range': `0-${lastDaysOrFromDate - 1}`
            }
        };
    const fundIndicatorsObject = await fetch(`${PROTOCOL}//${API_URL}/running_days_with_indicators?select=dt_comptc,cdi_valor,selic_valor,bovespa_valor,euro_valor,dolar_valor${fromDatePart}&order=dt_comptc.desc`, rangePart);
    if (fundIndicatorsObject.status < 200 || fundIndicatorsObject.status > 299)
        throw new Error('Unable to retrieve economy indicators');
    let data = await fundIndicatorsObject.json();
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
