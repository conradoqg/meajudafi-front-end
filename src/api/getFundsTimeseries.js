import fetchBE from '../util/fetchBE';

async function getFundsTimeseries(lastDaysOrFromDate, additionalFields) {
    let limit = '';
    if (lastDaysOrFromDate instanceof Date)
        limit = `&irm_dt_comptc=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
    else if (typeof (lastDaysOrFromDate) == 'number')
        limit = `&limit=${lastDaysOrFromDate - 1}`;

    let additionalFieldsPart = '';
    if (Array.isArray(additionalFields) && additionalFields.length > 0)
        additionalFieldsPart = additionalFields.join(',');

    const { data } = await fetchBE(`irm_timeseries?select=irm_dt_comptc,f_short_name,f_cnpj,icf_classe,${additionalFieldsPart}${limit}`);

    return data;
};

export default getFundsTimeseries;