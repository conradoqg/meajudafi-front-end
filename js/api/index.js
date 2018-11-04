import allKeys from 'promise-results/allKeys';

module.exports = {
    getFundList: async (options) => {
        const range = `${(options.page * options.rowsPerPage)}-${((options.page * options.rowsPerPage) + options.rowsPerPage - 1)}`;
        const sort = `${options.sort.field}.${options.sort.order}`;
        let classFilter = '';
        if (options.filter.class.length > 0) {
            const selectedFilterOptions = options.filter.class.map(selectedFilter => {
                if (selectedFilter == null) return 'icf_classe.is.null';
                else return `icf_classe.eq."${selectedFilter}"`;
            });
            classFilter = `or=(${selectedFilterOptions.join(',')})&`;
        }
        let iry_investment_return_1yFilter = '';
        if (options.filter.iry_investment_return_1y) {
            iry_investment_return_1yFilter = `and=(iry_investment_return_1y.gte.${options.filter.iry_investment_return_1y.min},iry_investment_return_1y.lte.${options.filter.iry_investment_return_1y.max})&`;
        }
        let iry_investment_return_2yFilter = '';
        if (options.filter.iry_investment_return_2y) {
            iry_investment_return_2yFilter = `and=(iry_investment_return_2y.gte.${options.filter.iry_investment_return_2y.min},iry_investment_return_2y.lte.${options.filter.iry_investment_return_2y.max})&`;
        }
        let iry_investment_return_3yFilter = '';
        if (options.filter.iry_investment_return_3y) {
            iry_investment_return_3yFilter = `and=(iry_investment_return_3y.gte.${options.filter.iry_investment_return_3y.min},iry_investment_return_3y.lte.${options.filter.iry_investment_return_3y.max})&`;
        }
        let searchPart = '';
        if (options.search.term != '') {
            // Identify if it's a CNPJ or a fund name
            if (/^\d+$/.test(options.search.term)) {
                searchPart = `and=(icf_cnpj_fundo.ilike.*${options.search.term}*)`;
            } else {
                searchPart = `and=(icf_denom_social.ilike.*${options.search.term}*)`;
            }

        }
        const fundListObject = await fetch(`http://localhost:82/inf_cadastral_fi_with_xpi_and_iryf_of_last_year?${classFilter}${iry_investment_return_1yFilter}${iry_investment_return_2yFilter}${iry_investment_return_3yFilter}${searchPart}order=${sort}`, {
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
    getFundDetail: async (cnpj) => {
        const dailyReturn = await fetch(`http://localhost:82/investment_return_daily?cnpj_fundo=eq.${cnpj}&order=dt_comptc`);
        const infCadastral = await fetch(`http://localhost:82/inf_cadastral_fi?cnpj_fundo=eq.${cnpj}`);

        return allKeys({ dailyReturn: dailyReturn.json(), infCadastral: infCadastral.json() });
    }
};