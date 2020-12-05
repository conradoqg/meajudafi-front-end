import React, { useCallback } from 'react';
import { StringParam, useQueryParam, withDefault } from 'use-query-params';
import { Link } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Blue from '@material-ui/core/colors/blue';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import FilterListIcon from '@material-ui/icons/FilterList';
import Collapse from '@material-ui/core/Collapse';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import Hidden from '@material-ui/core/Hidden';
import Skeleton from '@material-ui/lab/Skeleton';
import { produce } from 'immer';
import FundFilterComponent, { emptyState as FundFilterComponentEmptyState } from './component/fundFilterComponent';
import ShowStateComponent from './component/showStateComponent';
import DataHistoryChartComponent from './component/dataHistoryChartComponent';
import API from '../api';
import { rangeOptions } from './option';
import { settle, reportErrorIfNecessary, formatters, nextColorIndex, chartFormatters, useState, useEffect, useRendering } from '../util';

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
    },
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    optionsBar: {
        padding: theme.spacing(2)
    },
    indicatorValuePositive: {
        color: '#3cb44b'
    },
    indicatorValueBlue: {
        color: Blue[500]
    },
    indicatorValueNegative: {
        color: '#e6194B'
    },
    select: {
        margin: theme.spacing(1)
    },
    cropTextNormal: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    cropText: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    listItemText: {
        display: 'flex',
        minWidth: 0,
        padding: '0 50px',
        '&:first-child': {
            paddingLeft: 0
        }
    },
    appBarSpacer: theme.mixins.toolbar,
    withTooltip: theme.withTooltip,
    link: theme.link
}));

const emptyState = {
    data: {
        economyIndicators: {
            small: null,
            large: null
        },
        fundIndicators: null,
        fundsChanged: null,
    },
    config: {
        economyIndicatorAndFundsRange: '1y',
        fundsChangeRange: '1w',
        fundsFilter: FundFilterComponentEmptyState.config.filter
    },
    layout: {
        showingFilter: false
    }
};

function buildChart(economyIndicators, size = 'small') {
    let colorIndex = 0;

    let domain = null;
    if (size === 'large') domain = [0.08, 0.90];
    else domain = [0, 1];

    let margin = null;
    if (size === 'large') margin = { l: 0, r: 0, t: 50, b: 0 };
    else margin = { l: 15, r: 15, t: 50, b: 10 };

    return {
        data: [
            {
                x: economyIndicators.date,
                y: economyIndicators.bovespa,
                type: 'scatter',
                name: 'Bovespa',
                line: { color: nextColorIndex(colorIndex++) }
            },
            {
                x: economyIndicators.date,
                y: economyIndicators.dolar,
                type: 'scatter',
                name: 'Dólar',
                yaxis: 'y2',
                line: { color: nextColorIndex(colorIndex++) }
            },
            {
                x: economyIndicators.date,
                y: economyIndicators.euro,
                type: 'scatter',
                name: 'Euro',
                yaxis: 'y3',
                line: { color: nextColorIndex(colorIndex++) }
            }
        ],
        layout: {
            separators: ',.',
            autosize: true,
            showlegend: true,
            legend: { 'orientation': 'h' },
            dragmode: size === 'small' ? false : 'zoom',
            height: size === 'small' ? 300 : null,
            font: {
                family: '"Roboto", "Helvetica", "Arial", sans-serif'
            },
            size,
            margin,
            xaxis: {
                showspikes: true,
                spikemode: 'across',
                domain,
                fixedrange: size === 'small' ? true : false
            },
            yaxis: {
                title: 'Bovespa',
                tickformat: chartFormatters.int.tickformat,
                hoverformat: chartFormatters.int.hoverformat,
                fixedrange: true,
                visible: size === 'small' ? false : true,
            },
            yaxis2: {
                title: 'Dólar',
                anchor: 'x',
                overlaying: 'y',
                side: 'right',
                tickprefix: chartFormatters.money.tickprefix,
                tickformat: chartFormatters.money.tickformat,
                hoverformat: chartFormatters.money.hoverformat,
                fixedrange: true,
                position: 0.90,
                visible: size === 'small' ? false : true,
            },
            yaxis3: {
                title: 'Euro',
                anchor: 'free',
                overlaying: 'y',
                side: 'right',
                tickprefix: chartFormatters.money.tickprefix,
                tickformat: chartFormatters.money.tickformat,
                hoverformat: chartFormatters.money.hoverformat,
                fixedrange: true,
                position: 0.95,
                visible: size === 'small' ? false : true
            }
        },
        frames: [],
        config: {
            locale: 'pt-BR',
            displayModeBar: true
        }
    };
}

function IndicatorsView(props) {
    // Data
    const [economyIndicators, setEconomyIndicators] = useState(emptyState.data.economyIndicators);
    const [fundIndicators, setFundIndicators] = useState(emptyState.data.fundIndicators);
    const [fundsChanged, setFundsChanged] = useState(emptyState.data.fundsChanged);

    // Config    
    const [fundsFilter, setFundsFilter] = useState(FundFilterComponentEmptyState.config.filter);

    // Config from URL
    const [economyIndicatorAndFundsRange, setEconomyIndicatorAndFundsRange] = useQueryParam('eir', withDefault(StringParam, emptyState.config.economyIndicatorAndFundsRange));
    const [fundsChangeRange, setFundsChangeRange] = useQueryParam('fr', withDefault(StringParam, emptyState.config.fundsChangeRange));

    // Layout
    const [showingFilter, setShowingFilter] = useState(emptyState.layout.showingFilter);

    const styles = useStyles();
    useRendering();

    // Updaters
    const updateEconomyIndicators = useCallback(async function updateEconomyIndicators(setEconomyIndicators, range) {
        const economyIndicators = await settle(fetchEconomyIndicators(range));

        if (economyIndicators instanceof Error) {
            setEconomyIndicators({
                small: economyIndicators,
                large: economyIndicators
            });
        } else {
            setEconomyIndicators({
                small: buildChart(economyIndicators, 'small'),
                large: buildChart(economyIndicators, 'large')
            });
        }

        reportErrorIfNecessary(economyIndicators);
    }, []);

    const updateFundIndicators = useCallback(async function updateFundIndicators(setFundIndicators, range, filter) {
        const fundIndicators = await settle(fetchFundIndicators(range, filter));

        setFundIndicators(fundIndicators);

        reportErrorIfNecessary(fundIndicators);
    }, []);

    const updateFundsChanged = useCallback(async function updateFundsChanged(setFundsChanged, range) {
        const fundsChanged = await settle(fetchFundsChanged(range));

        setFundsChanged(fundsChanged);

        reportErrorIfNecessary(fundsChanged);
    }, []);

    // Effects
    useEffect(() => {
        setFundIndicators(emptyState.data.fundIndicators);
        updateFundIndicators(setFundIndicators, economyIndicatorAndFundsRange, fundsFilter);
    }, [updateFundIndicators, economyIndicatorAndFundsRange, fundsFilter]);

    useEffect(() => {
        setEconomyIndicators(emptyState.data.economyIndicators);
        updateEconomyIndicators(setEconomyIndicators, economyIndicatorAndFundsRange);
    }, [updateEconomyIndicators, economyIndicatorAndFundsRange]);

    useEffect(() => {
        setFundsChanged(emptyState.data.fundsChanged);
        updateFundsChanged(setFundsChanged, fundsChangeRange);
    }, [updateFundsChanged, fundsChangeRange]);

    // Fetchers
    function fetchEconomyIndicators(range) {
        const from = rangeOptions.find(rangeOption => rangeOption.name === range).toDate();

        return API.getEconomyIndicators(from);
    }

    function fetchFundIndicators(range, filter) {
        return API.getFundIndicators({ range, filter });
    }

    async function fetchFundsChanged(range) {
        const from = rangeOptions.find(rangeOption => rangeOption.name === range).toDate();

        const fundsChanged = await API.getFundsChanged(from);

        const fundsChanges = {
            btgpactual: [],
            xpi: [],
            modalmais: []
        };

        fundsChanged.forEach(change => {
            let key = null;

            if (change.table_name === 'btgpactual_funds') key = 'btgpactual';
            else if (change.table_name === 'xpi_funds') key = 'xpi';
            else if (change.table_name === 'modalmais_funds') key = 'modalmais';

            const relevantChanges = [];

            if (change.action === 'I') {
                relevantChanges.push('Adicionado a lista de fundos');
            } else if (change.action === 'D') {
                relevantChanges.push('Removido da lista de fundos');
            } else {
                Object.keys(change.changed_fields).forEach(changedField => {
                    const relevantFields = {
                        xf_funding_blocked: {
                            title: 'Captação',
                            text: formatters.field['xf_funding_blocked']
                        },
                        xf_risk: {
                            title: 'Risco formal',
                            text: formatters.field['xf_risk']
                        },
                        xf_minimal_initial_investment: {
                            title: 'Investimento inicial',
                            text: formatters.field['xf_minimal_initial_investment']
                        },
                        xf_rescue_financial_settlement: {
                            title: 'Dias para resgate',
                            text: formatters.field['xf_rescue_financial_settlement']
                        },
                        bf_is_blacklist: {
                            title: 'Captação',
                            text: formatters.field['bf_is_blacklist']
                        },
                        bf_inactive: {
                            title: 'Atividade',
                            text: formatters.field['bf_inactive']
                        },
                        bf_risk_name: {
                            title: 'Risco formal',
                            text: formatters.field['bf_risk_name']
                        },
                        bf_minimum_initial_investment: {
                            title: 'Investimento inicial',
                            text: formatters.field['bf_minimum_initial_investment']
                        },
                        bf_rescue_financial_settlement: {
                            title: 'Dias para resgate',
                            text: formatters.field['bf_rescue_financial_settlement']
                        },
                        bf_investor_type: {
                            title: 'Tipo de investidor',
                            text: formatters.field['bf_investor_type']
                        },
                        mf_risk_level: {
                            title: 'Risco formal',
                            text: formatters.field['mf_risk_level']
                        },
                        mf_minimum_initial_investment: {
                            title: 'Investimento inicial',
                            text: formatters.field['mf_minimum_initial_investment']
                        },
                        mf_rescue_quota: {
                            title: 'Dias para resgate',
                            text: formatters.field['mf_rescue_quota']
                        },
                        mf_active: {
                            title: 'Ativo',
                            text: formatters.field['mf_active']
                        }
                    };
                    if (relevantFields[changedField]) {
                        relevantChanges.push(`${relevantFields[changedField].title} mudou de ${relevantFields[changedField].text(change.row_data[changedField])} para ${relevantFields[changedField].text(change.changed_fields[changedField])}`);
                    }
                });
            }

            if (relevantChanges.length > 0)
                fundsChanges[key].push({
                    date: change.action_tstamp_stm,
                    name: change.f_short_name,
                    cnpj: change.f_cnpj,
                    changes: relevantChanges
                });
        });

        return fundsChanges;
    }

    // Handlers
    function handleConfigRangeChange(event) {
        setEconomyIndicatorAndFundsRange(event.target.value);
    }

    function handleConfigChangesRangeChange(event) {
        setFundsChangeRange(event.target.value);
    }

    function handleChartInitialized(figure) {
        setEconomyIndicators(produce(economyIndicators, draft => {
            if (figure.layout.size === 'small') draft.small = figure;
            else if (figure.layout.size === 'large') draft.large = figure;
        }));
    }

    function handleChartUpdate(figure) {
        setEconomyIndicators(produce(economyIndicators, draft => {
            if (figure.layout.size === 'small') draft.small = figure;
            else if (figure.layout.size === 'large') draft.large = figure;
        }));
    }

    function handleFilterClick() {
        setShowingFilter(!showingFilter);
    }

    function handleFilterChange(filter) {
        setShowingFilter(false);
        setFundsFilter(filter);
    }

    return (
        <div>
            <div className={styles.appBarSpacer} />
            <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                            <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                <React.Fragment>
                                    <p>Indicadores gerais de mercado e dos fundos de investimento.</p>
                                    <p>No lado direito é possível alterar o intervalo visualizado.</p>
                                </React.Fragment>
                            }>
                                <Typography variant="h5" className={styles.withTooltip}>Indicadores</Typography>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                            <Select
                                value={economyIndicatorAndFundsRange}
                                onChange={handleConfigRangeChange}
                                className={styles.select}
                                inputProps={{
                                    name: 'range',
                                    id: 'range',
                                }}>
                                {rangeOptions.filter(range => range.name !== 'all' && range.name !== '1w' && range.name !== 'best').map(range => (<MenuItem key={range.name} value={range.name}>{range.displayName}</MenuItem>))}
                            </Select>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                    <Typography variant="h6">Mercado</Typography>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Paper className={styles.paper} elevation={1} square={true}>
                        <Hidden smDown>
                            <DataHistoryChartComponent
                                data={economyIndicators.large}
                                onInitialized={figure => handleChartInitialized(figure)}
                                onUpdate={figure => handleChartUpdate(figure)} />
                        </Hidden>
                        <Hidden mdUp>
                            <DataHistoryChartComponent
                                data={economyIndicators.small}
                                onInitialized={figure => handleChartInitialized(figure)}
                                onUpdate={figure => handleChartUpdate(figure)} />
                        </Hidden>
                    </Paper>
                </Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                            <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                <React.Fragment>
                                    <p>Lista de melhores e piores fundos de investimento. </p>
                                    <p>Por padrão somente fundos listados na BTG Pactual, XP Investimentos e Modal Mais são exibidos. No lado direito é possível alterar o filtro.</p>
                                </React.Fragment>
                            }>
                                <Typography variant="h6" className={styles.withTooltip}>Fundos de Investimento</Typography>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Grid>
                <Hidden smDown>
                    <Grid item>
                        <Grid container alignItems="center" spacing={1}>
                            <Grid item>
                                <Tooltip title="Filtro" aria-label="Filtro">
                                    <IconButton
                                        aria-label="Filtro"
                                        onClick={handleFilterClick}>
                                        <FilterListIcon />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                </Hidden>
            </Grid>
            <Hidden smDown>
                <Grid container spacing={showingFilter ? 2 : 0}>
                    <Grid item xs={12}>
                        <Paper elevation={1} square={true}>
                            <Collapse in={showingFilter}>
                                <FundFilterComponent onFilterChanged={handleFilterChange} />
                            </Collapse>
                        </Paper>
                    </Grid>
                </Grid>
            </Hidden>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3} xl={3}>
                    <IndicatorPaper title="Desempenho" field="investment_return" data={fundIndicators} classes={styles} />
                </Grid>
                <Grid item xs={12} sm={6} md={3} xl={3}>
                    <IndicatorPaper title="Patrimônio" field="networth" data={fundIndicators} classes={styles} />
                </Grid>
                <Grid item xs={12} sm={6} md={3} xl={3}>
                    <IndicatorPaper title="Cotistas" field="quotaholders" data={fundIndicators} classes={styles} />
                </Grid>
                <Grid item xs={12} sm={6} md={3} xl={3}>
                    <IndicatorPaper title="Risco" field="risk" data={fundIndicators} classes={styles} inverted />
                </Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                            <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                <React.Fragment>
                                    <p>Lista de mudanças que ocorreram recentemente nos fundos de investimento. </p>
                                    <p>Somente algumas informações são monitoradas. No lado direito é possível filtrar o intervalo de exibição.</p>
                                    <p>Início da coleta em 16/02/2019.</p>
                                </React.Fragment>
                            }>
                                <Typography variant="h6" className={styles.withTooltip}>Mudanças nos Fundos</Typography>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                            <Select
                                value={fundsChangeRange}
                                onChange={handleConfigChangesRangeChange}
                                className={styles.select}
                                inputProps={{
                                    name: 'changesRange',
                                    id: 'changesRange',
                                }}>
                                {rangeOptions.filter(range => range.name !== 'all' && range.name !== 'best').map(range => (<MenuItem key={range.name} value={range.name}>{range.displayName}</MenuItem>))}
                            </Select>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={6} xl={6}>
                    <FundsChangedPaper title="XP Investimentos" data={fundsChanged} broker="xpi" classes={styles} />
                </Grid>
                <Grid item xs={12} sm={12} md={6} xl={6}>
                    <FundsChangedPaper title="BTG Pactual" data={fundsChanged} broker="btgpactual" classes={styles} />
                </Grid>
                <Grid item xs={12} sm={12} md={6} xl={6}>
                    <FundsChangedPaper title="Modal Mais" data={fundsChanged} broker="modalmais" classes={styles} />
                </Grid>
            </Grid>
        </div >
    );

}

const IndicatorPaper = props => {
    const { classes, title, field, data, inverted = false } = props;

    const getClassForValue = value => {
        if (value === 0)
            return classes.indicatorValueBlue;
        else if (value > 0)
            return inverted ? classes.indicatorValueNegative : classes.indicatorValuePositive;
        else if (value < 0)
            return inverted ? classes.indicatorValuePositive : classes.indicatorValueNegative;
    };

    return (
        <div>
            <Paper elevation={1} square={true}>
                <Grid container wrap="nowrap" className={classes.optionsBar}>
                    <Typography component="h2" variant="subtitle1"><b>{title}</b></Typography>
                </Grid>
            </Paper>
            <Paper className={classes.paper} elevation={1} square={true}>
                <ShowStateComponent
                    data={data}
                    hasData={() => {

                        const positive = data[field]['top'].map((indicator, index) => (
                            <div key={index}>
                                <ListItem divider>
                                    <ListItemText disableTypography classes={{ root: classes.listItemText }}>
                                        <Typography variant="body2" component="span" className={classes.cropText}><Link to={'/funds/' + indicator.cnpj} className={classes.link}>{indicator.name}</Link></Typography>
                                    </ListItemText>
                                    <ListItemSecondaryAction>
                                        <Typography variant="body2" component="span" className={getClassForValue(indicator.value)}>{formatters.percentage(indicator.value)}</Typography>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </div>
                        ));
                        const divider = (< ListItem divider >
                            <ListItemText disableTypography={true}>
                                <Typography variant="body2" component="span" align="center">...</Typography>
                            </ListItemText>
                        </ListItem>);
                        const negative = data[field]['bottom'].map((indicator, index) => (
                            <div key={index}>
                                <ListItem divider>
                                    <ListItemText disableTypography classes={{ root: classes.listItemText }}>
                                        <Typography variant="body2" component="span" className={classes.cropText}><Link to={'/funds/' + indicator.cnpj} className={classes.link}>{indicator.name}</Link></Typography>
                                    </ListItemText>
                                    <ListItemSecondaryAction>
                                        <Typography variant="body2" component="span" className={getClassForValue(indicator.value)}>{formatters.percentage(indicator.value)}</Typography>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </div>
                        ));
                        return (<List>
                            {positive}
                            {divider}
                            {negative}
                        </List>);
                    }}
                    isNull={() => (
                        <List>
                            {[...Array(5).keys()].map(item => (
                                <ListItem key={item} divider>
                                    <ListItemText disableTypography ><Typography variant="body2" component="span" ><Skeleton /></Typography></ListItemText>
                                    <ListItemSecondaryAction><Typography variant="body2" component="span"><Skeleton /></Typography></ListItemSecondaryAction>
                                </ListItem>
                            ))}
                            < ListItem divider >
                                <ListItemText disableTypography>
                                    <Typography variant="body2" component="span" align="center">...</Typography>
                                </ListItemText>
                            </ListItem>
                            {[...Array(5).keys()].map(item => (
                                <ListItem key={item} divider>
                                    <ListItemText disableTypography ><Typography variant="body2" component="span" ><Skeleton /></Typography></ListItemText>
                                    <ListItemSecondaryAction><Typography variant="body2" component="span"><Skeleton /></Typography></ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                    isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                    isEmpty={() => (<Typography variant="subtitle1" align="center">Sem dados à exibir</Typography>)}
                />
            </Paper>
        </div>);
};

const FundsChangedPaper = props => {
    const { classes, title, data, broker } = props;

    return (
        <div>
            <Paper elevation={1} square={true}>
                <Grid container wrap="nowrap" className={classes.optionsBar}>
                    <Typography component="h2" variant="subtitle1"><b>{title}</b></Typography>
                </Grid>
            </Paper>
            <Paper className={classes.paper} elevation={1} square={true}>
                <Grid container spacing={1} alignItems="center" justify="center">
                    <ShowStateComponent
                        data={data}
                        hasData={() => (data[broker].length > 0 ? data[broker].map((change, index) => (
                            <React.Fragment key={index}>
                                <Grid item xs={12}>
                                    <Grid container spacing={1}>
                                        <Grid item xs={12} sm={12} md={6} xl={6} >
                                            <Typography variant="body2" align="left" display="block" component="span" className={classes.cropTextNormal}>{formatters.date(change.date)} - <Link to={'/funds/' + change.cnpj} className={classes.link}>{change.name}</Link></Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={12} md={6} xl={6}>
                                            {change.changes.map((fieldChange, index) => (<Typography variant="body2" key={index} component="span" align="right" display="block">{fieldChange}</Typography>))}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </React.Fragment>
                        )) : (<Typography variant="subtitle1" align="center">Não foram rastreadas mudanças</Typography>))
                        }
                        isNull={() => (
                            <React.Fragment>
                                {
                                    [...Array(5).keys()].map(index => (
                                        <Grid item key={index} xs={12}>
                                            <Grid container spacing={1}>
                                                <Grid item xs={12} sm={12} md={6} xl={6} >
                                                    <Typography variant="body2" align="left" display="block" component="span" className={classes.cropTextNormal}><Skeleton /></Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={12} md={6} xl={6}>
                                                    <Typography variant="body2" key={index} component="span" align="right" display="block"><Skeleton /></Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    ))
                                }
                            </React.Fragment>
                        )}
                        isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                        isEmpty={() => (<Typography variant="subtitle1" align="center">Sem dados à exibir</Typography>)}
                    />
                </Grid>
            </Paper>
        </div >);
};

export default IndicatorsView;