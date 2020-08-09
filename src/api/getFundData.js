import fetchBE from '../util/fetchBE';

async function getFundData(cnpj, additionalFields) {
    let additionalFieldsPart = '';
    if (Array.isArray(additionalFields) && additionalFields.length > 0)
        additionalFieldsPart = ',' + additionalFields.join(',');
        
    const { data } = await fetchBE(`funds_enhanced?select=f_name,f_short_name,f_cnpj,icf_rentab_fundo${additionalFieldsPart}&f_cnpj=eq.${cnpj}`);

    return data;
};

export default getFundData;