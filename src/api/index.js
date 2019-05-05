import getFundList from './getFundList';
import getFundData from './getFundData';
import getFundStatistic from './getFundStatistic';
import getFundHistory from './getFundHistory';
import getBenchmarkStatistic from './getBenchmarkStatistic';
import getBenchmarkHistory from './getBenchmarkHistory';
import getFundIndicators from './getFundIndicators';
import getEconomyIndicators from './getEconomyIndicators';
import getFundsChanged from './getFundsChanged';
import isInMaintenanceMode from './isInMaintenanceMode';

/* global process */
export const API_URL = process.env.REACT_APP_API_URL || `api.${window.location.host}`;
export const PROTOCOL = process.env.REACT_APP_PROTOCOL ? process.env.REACT_APP_PROTOCOL + ':' : '';

export default {
    getFundList,
    getFundData,
    getFundStatistic,
    getFundHistory,
    getBenchmarkStatistic,
    getBenchmarkHistory,
    getFundIndicators,
    getEconomyIndicators,
    getFundsChanged,
    isInMaintenanceMode
};


