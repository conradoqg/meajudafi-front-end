import { filterOptions } from '../view/options';
import * as d3Format from 'd3-format';
import StandardDeviation from './standardDeviation';
import ptBR from 'd3-format/locale/pt-BR.json';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.extend(LocalizedFormat);
dayjs.locale('pt-br');
d3Format.formatDefaultLocale(ptBR);

const colors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabebe', '#469990', '#e6beff', '#9A6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9', '#ffffff', '#000000'];
const util = {
    formatters: {
        somethingToPercentage: (value) => value != null && !isNaN(value) ? parseFloat((value * 100)).toFixed(2) : value,
        somethingToValue: (value) => value != null && !isNaN(value) ? parseFloat(value).toFixed(2) : null,
        aValueOrTrace: (value) => value == null ? '-' : value.toLocaleString(),
        somethingToMoney: (value) => { return value; }
    },
    nextColorIndex: (i) => colors[(i % colors.length + colors.length) % colors.length],
    StandardDeviation: StandardDeviation,
};

const fieldFormatters = {};
Object.keys(filterOptions).map(key => {
    fieldFormatters[key] = (value) => filterOptions[key].options.find(item => item.value == value).displayName;
});

fieldFormatters['icf_vl_patrim_liq'] = d3Format.format('$,.2f');
fieldFormatters['icf_dt_ini_exerc'] = value => dayjs(value).format('L');
fieldFormatters['icf_dt_fim_exerc'] = value => dayjs(value).format('L');
fieldFormatters['f_short_name'] = value => value;
fieldFormatters['f_name'] = value => value;
fieldFormatters['f_cnpj'] = value => value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
fieldFormatters['xf_name'] = value => value;
fieldFormatters['xf_formal_risk'] = (value) => value == null ? 'Não informado' : ['Desconhecido', 'Risco baixo', 'Risco médio baixo', 'Risco médio', 'Risco médio alto', 'Risco alto'][value];
fieldFormatters['xf_initial_investment'] = d3Format.format('$,.2f');
fieldFormatters['xf_rescue_quota'] = value => 'D+' + value;
fieldFormatters['xf_benchmark'] = value => value;
fieldFormatters['xf_type'] = value => value;
fieldFormatters['bf_product'] = value => value;
fieldFormatters['bf_risk_level'] = (value) => value == null ? 'Não informado' : ['Desconhecido', 'Risco baixo', 'Risco médio baixo', 'Risco médio', 'Risco médio alto', 'Risco alto'][value];
fieldFormatters['bf_minimum_initial_investment'] = d3Format.format('$,.2f');
fieldFormatters['bf_rescue_quota'] = value => 'D+' + value;
fieldFormatters['bf_category_description'] = value => value;
fieldFormatters['bf_anbima_rating'] = value => value;
fieldFormatters['investment_return'] = d3Format.format('.2%');
fieldFormatters['relative_investment_return'] = d3Format.format('.2%');
fieldFormatters['correlation'] = d3Format.format('.2%');
fieldFormatters['risk'] = d3Format.format('.2%');
fieldFormatters['sharpe'] = d3Format.format(',.2f');

util.formatters.field = fieldFormatters;

module.exports = util;