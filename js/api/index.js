import allKeys from 'promise-results/allKeys';

/* global process */
const API_URL = process.env.API_URL || 'api.cvmfundexplorer.conradoqg.eti.br';

module.exports = {
    getFundList: async (options) => {
        const range = `${(options.page * options.rowsPerPage)}-${((options.page * options.rowsPerPage) + options.rowsPerPage - 1)}`;
        const sort = `${options.sort.field}.${options.sort.order}`;

        let filterPart = '';
        if (options.filter) {

            Object.keys(options.filter).map(selectedFilterOptionsKey => {
                if (Array.isArray(options.filter[selectedFilterOptionsKey])) {
                    const selectedFilterOptionsText = options.filter[selectedFilterOptionsKey].map(selectedFilter => {
                        if (selectedFilter == null) return `${selectedFilterOptionsKey}.is.null`;
                        else return `${selectedFilterOptionsKey}.eq."${selectedFilter}"`;
                    });
                    if (selectedFilterOptionsText.length > 0) filterPart += `or=(${selectedFilterOptionsText.join(',')})&`;
                } else if (typeof options.filter[selectedFilterOptionsKey] === 'object') {
                    let minPart = '';
                    let maxPart = '';
                    if (options.filter[selectedFilterOptionsKey].min != '') minPart = `${selectedFilterOptionsKey}.gte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].min) : options.filter[selectedFilterOptionsKey].min}`;
                    if (options.filter[selectedFilterOptionsKey].max != '') maxPart = `${selectedFilterOptionsKey}.lte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].max) : options.filter[selectedFilterOptionsKey].max}`;
                    if (minPart && maxPart) filterPart += `and=(${minPart},${maxPart})&`;
                    else if (minPart || maxPart) filterPart += `and=(${minPart}${maxPart})&`;
                } else {
                    if (options.filter[selectedFilterOptionsKey]) filterPart += `and=(${selectedFilterOptionsKey}.not.is.null)&`;
                }
            });
        }

        let searchPart = '';
        if (options.search) {
            if (options.search.term != '') {
                // Identify if it's a CNPJ or a fund name
                if (/^\d+$/.test(options.search.term)) {
                    searchPart = `and=(icf_cnpj_fundo.ilike.*${options.search.term}*)&`;
                } else {
                    searchPart = `and=(icf_denom_social_unaccented.ilike.*${options.search.term.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}*)&`;
                }
            }
        }

        const fundListObject = await fetch(`//${API_URL}/icf_with_xf_and_iry_of_last_year?${filterPart}${searchPart}order=${sort}`, {
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
    getFundDetail: async (cnpj, limit, from) => {
        const range = limit ? `0-${limit}` : '';
        const fromPart = from ? `&ird_dt_comptc=gte.${from.toJSON().slice(0, 10)}` : '';
        const dailyReturn = await fetch(`//${API_URL}/investment_return_daily?ird_cnpj_fundo=eq.${cnpj}${fromPart}&order=ird_dt_comptc.desc`, {
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