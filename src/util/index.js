import * as d3Format from 'd3-format';
import ptBR from 'd3-format/locale/pt-BR.json';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { filterOptions } from '../view/option';

dayjs.extend(LocalizedFormat);
dayjs.locale('pt-br');
d3Format.formatDefaultLocale(ptBR);

const colors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabebe', '#469990', '#e6beff', '#9A6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9', '#ffffff', '#000000'];

export const chartFormatters = {
    investment_return: {
        tickformat: ',.0%',
        hoverformat: ',.2%'
    },
    relative_investment_return: {
        tickformat: ',.0%',
        hoverformat: ',.2%'
    },
    consistency: {
        tickformat: ',.0%',
        hoverformat: ',.2%'
    },
    correlation: {
        tickformat: ',.0%',
        hoverformat: ',.2%'
    },
    risk: {
        tickformat: ',.0%',
        hoverformat: ',.2%'
    },
    sharpe: {
        tickformat: ',.0f',
        hoverformat: ',.2f'
    },
    networth: {
        tickprefix: 'R$',
        tickformat: ',.0f',
        hoverformat: ',.2f'
    },
    int: {
        tickformat: ',.0',
        hoverformat: ',.0',
    },
    money: {
        tickprefix: 'R$',
        tickformat: ',.0f',
        hoverformat: ',.2f'
    },
    float: {
        tickformat: ',.2f',
        hoverformat: ',.2f',
    },
}

export const formatters = {
    percentage: (value) => value == null || isNaN(value) || !isFinite(value) ? '-' : d3Format.format('.2%')(value),
    money: (value) => value == null || isNaN(value) || !isFinite(value) ? '-' : d3Format.format('$,.2f')(value),
    float: (value) => value == null || isNaN(value) || !isFinite(value) ? '-' : d3Format.format(',.2f')(value),
    date: (value) => value == null ? '-' : dayjs(value).format('L'),
    capitalized: value => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
    field: {}
};

const fieldFormatters = {};
Object.keys(filterOptions).map(key => {
    return fieldFormatters[key] = (value) => filterOptions[key].options.find(item => item.value === value).displayName;
});

fieldFormatters['icf_vl_patrim_liq'] = formatters.money;
fieldFormatters['f_short_name'] = value => value;
fieldFormatters['f_name'] = value => value;
fieldFormatters['f_cnpj'] = value => value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
fieldFormatters['xf_name'] = value => value;
fieldFormatters['xf_formal_risk'] = (value) => value == null ? 'Não Identificado' : ['Desconhecido', 'Risco baixo', 'Risco médio baixo', 'Risco médio', 'Risco médio alto', 'Risco alto'][value];
fieldFormatters['xf_initial_investment'] = formatters.money;
fieldFormatters['xf_rescue_quota'] = value => 'D+' + value;
fieldFormatters['xf_benchmark'] = value => value;
fieldFormatters['xf_type'] = value => value;
fieldFormatters['bf_product'] = value => value;
fieldFormatters['bf_risk_level'] = (value) => value == null ? 'Não Identificado' : ['Desconhecido', 'Risco baixo', 'Risco médio baixo', 'Risco médio', 'Risco médio alto', 'Risco alto'][value];
fieldFormatters['bf_minimum_initial_investment'] = formatters.money;
fieldFormatters['bf_rescue_quota'] = value => 'D+' + value;
fieldFormatters['bf_category_description'] = value => value;
fieldFormatters['bf_anbima_rating'] = value => value;
fieldFormatters['investment_return'] = formatters.percentage;
fieldFormatters['relative_investment_return'] = formatters.percentage;
fieldFormatters['correlation'] = formatters.percentage;
fieldFormatters['risk'] = formatters.percentage;
fieldFormatters['sharpe'] = formatters.float;
fieldFormatters['consistency'] = formatters.percentage;
fieldFormatters['iry_accumulated_networth'] = formatters.money;
fieldFormatters['iry_investment_return_1y'] = formatters.percentage;
fieldFormatters['iry_investment_return_2y'] = formatters.percentage;
fieldFormatters['iry_investment_return_3y'] = formatters.percentage;
fieldFormatters['iry_risk_1y'] = formatters.percentage;
fieldFormatters['iry_risk_2y'] = formatters.percentage;
fieldFormatters['iry_risk_3y'] = formatters.percentage;
fieldFormatters['xf_state'] = value => value === '0' ? 'Fechada' : 'Aberta';
fieldFormatters['xf_rescue_financial_settlement'] = value => 'D+' + value;
fieldFormatters['bf_is_blacklist'] = value => (value === true || value === 't') ? 'Fechada' : 'Aberta';
fieldFormatters['bf_inactive'] = value => (value === true || value === 't') ? 'Inativo' : 'Ativo';
fieldFormatters['bf_risk_name'] = formatters.capitalized;
fieldFormatters['bf_rescue_financial_settlement'] = value => 'D+' + value;
fieldFormatters['bf_investor_type'] = value => value === 'NAO_QUALIFICADO' ? 'Não qualificado' : 'Qualificado'

formatters.field = fieldFormatters;

export const nextColorIndex = (i) => colors[(i % colors.length + colors.length) % colors.length];
export { default as Plotly } from './plotly';
