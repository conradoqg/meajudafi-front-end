import dayjs from 'dayjs';
import fetchBE from '../util/fetchBE';

async function getFundList(options, fromDate = dayjs().subtract(1, 'month').toDate()) {
    const range = options.page === 0 ? `&limit=${options.rowsPerPage}` : `&offset=${(options.page * options.rowsPerPage)}&limit=${options.rowsPerPage}`;
    const sort = `${options.sort.field}.${options.sort.order}`;
    let filterPart = '';
    if (options.filter) {
        Object.keys(options.filter).forEach(selectedFilterOptionsKey => {
            if (selectedFilterOptionsKey === 'switch') {
                let switchItems = [];
                Object.keys(options.filter.switch).map(switchItem => options.filter.switch[switchItem] ? switchItems.push(`${switchItem}.not.is.null`) : null);
                if (switchItems.length > 0)
                    filterPart += `or=(${switchItems.join(',')})&`;
            }
            else if (Array.isArray(options.filter[selectedFilterOptionsKey])) {
                const selectedFilterOptionsText = options.filter[selectedFilterOptionsKey].map(selectedFilter => {
                    if (selectedFilter == null)
                        return `${selectedFilterOptionsKey}.is.null`;
                    else
                        return `${selectedFilterOptionsKey}.eq."${selectedFilter}"`;
                });
                if (selectedFilterOptionsText.length > 0)
                    filterPart += `or=(${selectedFilterOptionsText.join(',')})&`;
            }
            else if (typeof options.filter[selectedFilterOptionsKey] === 'object') {
                if (options.filter[selectedFilterOptionsKey].min != null && options.filter[selectedFilterOptionsKey].min != null) {
                    let minPart = '';
                    let maxPart = '';
                    if (options.filter[selectedFilterOptionsKey].min !== '')
                        minPart = `${selectedFilterOptionsKey}.gte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].min) : options.filter[selectedFilterOptionsKey].min}`;
                    if (options.filter[selectedFilterOptionsKey].max !== '')
                        maxPart = `${selectedFilterOptionsKey}.lte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].max) : options.filter[selectedFilterOptionsKey].max}`;
                    if (minPart && maxPart)
                        filterPart += `and=(${minPart},${maxPart})&`;
                    else if (minPart || maxPart)
                        filterPart += `and=(${minPart}${maxPart})&`;
                }
            }
        });
    }
    let searchPart = '';
    if (options.search) {
        if (options.search !== '') {
            // Identify if it's a CNPJ or a fund name
            if (/^\d+$/.test(options.search)) {
                searchPart = `and=(f_cnpj.ilike.*${options.search}*)&`;
            }
            else {
                searchPart = `or=(f_unaccented_name.ilike.*${options.search.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}*,f_unaccented_short_name.ilike.*${options.search.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}*)&`;
            }
        }
    }
    const { data, headers } = await fetchBE(`icf_with_xf_and_bf_and_mf_and_iry_and_f_of_last_year?select=icf_cnpj_fundo,f_cnpj,f_short_name,iry_accumulated_networth,iry_accumulated_quotaholders,icf_rentab_fundo,iry_investment_return_1y,iry_investment_return_2y,iry_investment_return_3y,iry_risk_1y,iry_risk_2y,iry_risk_3y&${filterPart}${searchPart}iry_dt_comptc=gte.${fromDate.toJSON().slice(0, 10)}&order=${sort}${range}`, {
        method: 'GET',
        headers: {
            'Prefer': 'count=exact'
        }
    });
    const CONTENT_RANGE_REGEX = /(\d+)-(\d+)\/(\d+)/gm;
    const contentRange = headers.get('Content-Range');
    const matchResult = CONTENT_RANGE_REGEX.exec(contentRange);
    const totalRows = matchResult && matchResult.length > 3 ? matchResult[3] : 0;
    return {
        range,
        totalRows: parseInt(totalRows),
        data
    };
};

export default getFundList;