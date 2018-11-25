import allKeys from 'promise-results/allKeys';

/* global process */
const API_URL = process.env.API_URL || 'api.cvmfundexplorer.conradoqg.eti.br';

module.exports = {
    getFundList: async (options) => {        
        const range = `${(options.page * options.rowsPerPage)}-${((options.page * options.rowsPerPage) + options.rowsPerPage - 1)}`;
        const sort = `${options.sort.field}.${options.sort.order}`;

        let classFilter = '';
        let iry_investment_return_1yFilter = '';
        let iry_investment_return_2yFilter = '';
        let iry_investment_return_3yFilter = '';
        let iry_risk_1yFilter = '';
        let iry_risk_2yFilter = '';
        let iry_risk_3yFilter = '';
        let iry_sharpe_1yFilter = '';
        let iry_sharpe_2yFilter = '';
        let iry_sharpe_3yFilter = '';
        let iry_consistency_1yFilter = '';
        let iry_consistency_2yFilter = '';
        let iry_consistency_3yFilter = '';

        if (options.filter) {
            if (options.filter.class.length > 0) {
                const selectedFilterOptions = options.filter.class.map(selectedFilter => {
                    if (selectedFilter == null) return 'icf_classe.is.null';
                    else return `icf_classe.eq."${selectedFilter}"`;
                });
                classFilter = `or=(${selectedFilterOptions.join(',')})&`;
            }

            if (options.filter.iry_investment_return_1y) {
                iry_investment_return_1yFilter = `and=(iry_investment_return_1y.gte.${options.filter.iry_investment_return_1y.min},iry_investment_return_1y.lte.${options.filter.iry_investment_return_1y.max})&`;
            }

            if (options.filter.iry_investment_return_2y) {
                iry_investment_return_2yFilter = `and=(iry_investment_return_2y.gte.${options.filter.iry_investment_return_2y.min},iry_investment_return_2y.lte.${options.filter.iry_investment_return_2y.max})&`;
            }

            if (options.filter.iry_investment_return_3y) {
                iry_investment_return_3yFilter = `and=(iry_investment_return_3y.gte.${options.filter.iry_investment_return_3y.min},iry_investment_return_3y.lte.${options.filter.iry_investment_return_3y.max})&`;
            }

            if (options.filter.iry_risk_1y) {
                iry_risk_1yFilter = `and=(iry_risk_1y.gte.${options.filter.iry_risk_1y.min},iry_risk_1y.lte.${options.filter.iry_risk_1y.max})&`;
            }

            if (options.filter.iry_risk_2y) {
                iry_risk_2yFilter = `and=(iry_risk_2y.gte.${options.filter.iry_risk_2y.min},iry_risk_2y.lte.${options.filter.iry_risk_2y.max})&`;
            }

            if (options.filter.iry_risk_3y) {
                iry_risk_3yFilter = `and=(iry_risk_3y.gte.${options.filter.iry_risk_3y.min},iry_risk_3y.lte.${options.filter.iry_risk_3y.max})&`;
            }

            if (options.filter.iry_sharpe_1y) {
                iry_sharpe_1yFilter = `and=(iry_sharpe_1y.gte.${options.filter.iry_sharpe_1y.min},iry_sharpe_1y.lte.${options.filter.iry_sharpe_1y.max})&`;
            }

            if (options.filter.iry_sharpe_2y) {
                iry_sharpe_2yFilter = `and=(iry_sharpe_2y.gte.${options.filter.iry_sharpe_2y.min},iry_sharpe_2y.lte.${options.filter.iry_sharpe_2y.max})&`;
            }

            if (options.filter.iry_sharpe_3y) {
                iry_sharpe_3yFilter = `and=(iry_sharpe_3y.gte.${options.filter.iry_sharpe_3y.min},iry_sharpe_3y.lte.${options.filter.iry_sharpe_3y.max})&`;
            }

            if (options.filter.iry_consistency_1y) {
                iry_consistency_1yFilter = `and=(iry_consistency_1y.gte.${options.filter.iry_consistency_1y.min},iry_consistency_1y.lte.${options.filter.iry_consistency_1y.max})&`;
            }

            if (options.filter.iry_consistency_2y) {
                iry_consistency_2yFilter = `and=(iry_consistency_2y.gte.${options.filter.iry_consistency_2y.min},iry_consistency_2y.lte.${options.filter.iry_consistency_2y.max})&`;
            }

            if (options.filter.iry_consistency_3y) {
                iry_consistency_3yFilter = `and=(iry_consistency_3y.gte.${options.filter.iry_consistency_3y.min},iry_consistency_3y.lte.${options.filter.iry_consistency_3y.max})&`;
            }
        }

        let searchPart = '';
        if (options.search) {            
            if (options.search.term != '') {
                // Identify if it's a CNPJ or a fund name
                if (/^\d+$/.test(options.search.term)) {
                    searchPart = `and=(icf_cnpj_fundo.ilike.*${options.search.term}*)`;
                } else {
                    searchPart = `and=(icf_denom_social_unaccented.ilike.*${options.search.term.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}*)`;
                }
            }
        }

        const fundListObject = await fetch(`//${API_URL}/inf_cadastral_fi_with_xpi_and_iryf_of_last_year?${classFilter}${iry_investment_return_1yFilter}${iry_investment_return_2yFilter}${iry_investment_return_3yFilter}${iry_risk_1yFilter}${iry_risk_2yFilter}${iry_risk_3yFilter}${iry_sharpe_1yFilter}${iry_sharpe_2yFilter}${iry_sharpe_3yFilter}${iry_consistency_1yFilter}${iry_consistency_2yFilter}${iry_consistency_3yFilter}${searchPart}order=${sort}`, {
            method: 'GET',
            headers: {
                'Range-Unit': 'items',
                'Range': range,
                'Prefer': 'count=exact'
            }
        });

        const CONTENT_RANGE_REGEX = /(\d+)-(\d+)\/(\d+)/gm;
        const contentRange = fundListObject.headers.get('Content-Range');
        const matchResult = CONTENT_RANGE_REGEX.exec(contentRange);
        const totalRows = matchResult && matchResult.length > 3 ? matchResult[3] : 0;

        return {
            range,
            totalRows: parseInt(totalRows),
            data: await fundListObject.json()
        };
    },
    getFundDetail: async (cnpj, limit) => {        
        const range = limit ? `0-${limit}` : '';
        const dailyReturn = await fetch(`//${API_URL}/investment_return_daily?cnpj_fundo=eq.${cnpj}&order=dt_comptc.desc`,{
            method: 'GET',
            headers: {
                'Range-Unit': 'items',
                'Range': range             
            }
        });
        const infCadastral = await fetch(`//${API_URL}/inf_cadastral_fi?cnpj_fundo=eq.${cnpj}`);

        return allKeys({ dailyReturn: dailyReturn.json(), infCadastral: infCadastral.json() });
    }
};