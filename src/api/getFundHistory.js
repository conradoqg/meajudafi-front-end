import fetchBE from '../util/fetchBE';

async function getFundHistory(cnpj, benchmark, lastDaysOrFromDate, additionalFields) {
    let limit = '';
    if (lastDaysOrFromDate instanceof Date)
        limit = `&ird_dt_comptc=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
    else if (typeof (lastDaysOrFromDate) == 'number')
        limit = `&limit=${lastDaysOrFromDate - 1}`;

    let additionalFieldsPart = '';
    if (Array.isArray(additionalFields) && additionalFields.length > 0)
        additionalFieldsPart = '&' + additionalFields.join(',');
    const { data } = await fetchBE(`investment_return_daily?select=${additionalFieldsPart}ird_dt_comptc,ird_investment_return,${`ird_${benchmark}_investment_return`},ird_accumulated_quotaholders,ird_accumulated_networth&ird_cnpj_fundo=eq.${cnpj}${limit}&order=ird_dt_comptc.desc`);

    if (data.length === 0)
        throw new Error(`No data found for CNPJ ${cnpj}`);
        
    return data;
};


export default getFundHistory;