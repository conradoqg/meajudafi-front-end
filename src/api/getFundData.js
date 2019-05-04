import { PROTOCOL, API_URL } from './index';

export default async (cnpj, additionalFields) => {
    let additionalFieldsPart = '';
    if (Array.isArray(additionalFields) && additionalFields.length > 0)
        additionalFieldsPart = ',' + additionalFields.join(',');
    const funds = await fetch(`${PROTOCOL}//${API_URL}/funds_enhanced?select=f_name,f_short_name,f_cnpj,icf_rentab_fundo${additionalFieldsPart}&f_cnpj=eq.${cnpj}`);
    if (funds.status < 200 || funds.status > 299)
        throw new Error('Unable to retrieve fund data');
    return funds.json();
};
