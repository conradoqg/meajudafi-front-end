const createOptionsFor = (displayName, field) => {
    return [{
        displayName,
        field,
        order: 'asc'
    },
    {
        displayName,
        field,
        order: 'desc'
    }];
};

module.exports = [
    ...createOptionsFor('CNPJ', 'icf_cnpj_fundo'),
    ...createOptionsFor('Denominação social', 'icf_denom_social'),
    ...createOptionsFor('Desempenho 1 ano', 'iry_investment_return_1y'),
    ...createOptionsFor('Desempenho 2 anos', 'iry_investment_return_2y'),
    ...createOptionsFor('Desempenho 3 anos', 'iry_investment_return_3y'),
    ...createOptionsFor('Risco 1 ano', 'iry_risk_1y'),
    ...createOptionsFor('Risco 2 ano', 'iry_risk_2y'),
    ...createOptionsFor('Risco 3 ano', 'iry_risk_3y')    
];