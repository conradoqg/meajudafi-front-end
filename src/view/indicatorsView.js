
import React from 'react';
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
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import FilterListIcon from '@material-ui/icons/FilterList';
import Collapse from '@material-ui/core/Collapse';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import Hidden from '@material-ui/core/Hidden';
import { produce } from 'immer';
import promisesEach from 'promise-results';
import FundFilterComponent from './component/fundFilterComponent';
import ShowStateComponent from './component/showStateComponent';
import DataHistoryChartComponent from './component/dataHistoryChartComponent';
import API from '../api';
import { rangeOptions } from './option';
import { formatters, nextColorIndex, chartFormatters } from '../util';

const styles = theme => ({
    root: {
        flexGrow: 1,
    },
    paper: {
        padding: theme.spacing.unit * 2,
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    optionsBar: {
        padding: theme.spacing.unit * 2
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
        margin: theme.spacing.unit
    },
    cropTextNormal: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    cropText: {
        maxWidth: '20em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    listItemText: {
        flex: '1 1 auto',
        minWidth: 0,
        padding: '0 50px',
        '&:first-child': {
            paddingLeft: 0
        }
    },
    appBarSpacer: theme.mixins.toolbar,
    withTooltip: theme.withTooltip,
    link: theme.link
});

const emptyState = {
    data: {
        fundIndicators: null,
        economyIndicators: null,
        fundsChanged: null,
        economyIndicatorsChartSmall: null,
        economyIndicatorsChartLarge: null
    },
    config: {
        range: '1y',
        changesRange: '1w',
        filter: FundFilterComponent.emptyState.config.filter
    },
    layout: {
        showingFilter: false
    }
};

class IndicatorsView extends React.Component {
    state = emptyState;

    async componentDidMount() {
        return this.updateData(this.state);
    }

    handleConfigRangeChange = async event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.economyIndicators = emptyState.data.economyIndicators;
            draft.data.economyIndicatorsChartSmall = emptyState.data.economyIndicatorsChartSmall;
            draft.data.economyIndicatorsChartLarge = emptyState.data.economyIndicatorsChartLarge;
            draft.data.fundIndicators = emptyState.data.fundIndicators;
        });

        this.setState(nextState);

        return this.updateData(nextState);
    }

    handleConfigChangesRangeChange = async event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.fundsChanged = emptyState.data.fundsChanged;
        });

        this.setState(nextState);

        return this.updateData(nextState);
    }

    handleChartInitialized = (figure) => {
        this.setState(produce(draft => {
            if (figure.layout.size === 'small') draft.data.economyIndicatorsChartSmall = figure;
            else if (figure.layout.size === 'large') draft.data.economyIndicatorsChartLarge = figure;
        }));
    }

    handleChartUpdate = (figure) => {
        this.setState(produce(draft => {
            if (figure.layout.size === 'small') draft.data.economyIndicatorsChartSmall = figure;
            else if (figure.layout.size === 'large') draft.data.economyIndicatorsChartLarge = figure;
        }));
    }

    handleFilterClick = () => {
        this.setState(produce(draft => {
            draft.layout.showingFilter = !draft.layout.showingFilter;
        }));
    }

    handleFilterChange = async (filter) => {
        const nextState = produce(this.state, draft => {
            draft.config.filter = filter;
            draft.layout.showingFilter = false;
            draft.data.fundIndicators = emptyState.data.fundIndicators;
        });

        this.setState(nextState);

        return this.updateData(nextState);
    }

    updateData = async (nextState) => {
        const { fundIndicators, economyIndicators, fundsChanged } = await promisesEach({
            fundIndicators: this.getFundIndicators(nextState.config),
            economyIndicators: this.getEconomyIndicators(nextState.config),
            fundsChanged: this.getFundsChanged(nextState.config)
        });

        nextState = produce(nextState, draft => {
            draft.data.fundIndicators = fundIndicators;
            draft.data.economyIndicators = economyIndicators;
            draft.data.fundsChanged = fundsChanged;

            if (economyIndicators instanceof Error) {
                draft.data.economyIndicatorsChartSmall = economyIndicators;
                draft.data.economyIndicatorsChartLarge = economyIndicators;
            } else {
                draft.data.economyIndicatorsChartSmall = this.buildChart(economyIndicators, 'small');
                draft.data.economyIndicatorsChartLarge = this.buildChart(economyIndicators, 'large');
            }
        });

        this.setState(nextState);
    }

    buildChart = (economyIndicators, size = 'small') => {
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

    getEconomyIndicators = async (config) => {
        const from = rangeOptions.find(range => range.name === config.range).toDate();

        return API.getEconomyIndicators(from);
    }

    getFundIndicators = async (config) => {
        return API.getFundIndicators(config);
    }

    getFundsChanged = async (config) => {
        const from = rangeOptions.find(range => range.name === config.changesRange).toDate();

        const fundsChanged = await API.getFundsChanged(from);

        const fundsChanges = {
            btgpactual: [],
            xpi: []
        };

        fundsChanged.forEach(change => {
            const key = change.table_name === 'btgpactual_funds' ? 'btgpactual' : 'xpi';

            const relevantChanges = [];

            if (change.action === 'I') {
                relevantChanges.push('Adicionado a lista de fundos');
            } else if (change.action === 'D') {
                relevantChanges.push('Removido da lista de fundos');
            } else {
                Object.keys(change.changed_fields).forEach(changedField => {
                    const relevantFields = {
                        xf_state: {
                            title: 'Captação',
                            text: formatters.field['xf_state']
                        },
                        xf_formal_risk: {
                            title: 'Risco formal',
                            text: formatters.field['xf_formal_risk']
                        },
                        xf_initial_investment: {
                            title: 'Investimento inicial',
                            text: formatters.field['xf_initial_investment']
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

    render() {
        const { classes } = this.props;

        return (
            <div>
                <div className={classes.appBarSpacer} />
                <Grid container spacing={16} alignItems="center">
                    <Grid item xs>
                        <Grid container alignItems="center" spacing={8}>
                            <Grid item>
                                <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                    <React.Fragment>
                                        <p>Indicadores gerais de mercado e dos fundos de investimento.</p>
                                        <p>No lado direito é possível alterar o intervalo visualizado.</p>
                                    </React.Fragment>
                                }>
                                    <Typography variant="h5" className={classes.withTooltip}>Indicadores</Typography>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <Grid container alignItems="center" spacing={8}>
                            <Grid item>
                                <Select
                                    value={this.state.config.range}
                                    onChange={this.handleConfigRangeChange}
                                    className={classes.select}
                                    inputProps={{
                                        name: 'range',
                                        id: 'range',
                                    }}>
                                    {rangeOptions.filter(range => range.name !== 'all' && range.name !== '1w').map(range => (<MenuItem key={range.name} value={range.name}>{range.displayName}</MenuItem>))}
                                </Select>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container spacing={16} alignItems="center">
                    <Grid item xs>
                        <Typography variant="h6">Mercado</Typography>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs={12}>
                        <Paper className={classes.paper} elevation={1} square={true}>
                            <Hidden smDown>
                                <DataHistoryChartComponent
                                    data={this.state.data.economyIndicatorsChartLarge}
                                    onInitialized={(figure) => this.handleChartInitialized(figure)}
                                    onUpdate={(figure) => this.handleChartUpdate(figure)} />
                            </Hidden>
                            <Hidden mdUp>
                                <DataHistoryChartComponent
                                    data={this.state.data.economyIndicatorsChartSmall}
                                    onInitialized={(figure) => this.handleChartInitialized(figure)}
                                    onUpdate={(figure) => this.handleChartUpdate(figure)} />
                            </Hidden>
                        </Paper>
                    </Grid>
                </Grid>
                <Grid container spacing={16} alignItems="center">
                    <Grid item xs>
                        <Grid container alignItems="center" spacing={8}>
                            <Grid item>
                                <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                    <React.Fragment>
                                        <p>Lista de melhores e piores fundos de investimento. </p>
                                        <p>Por padrão somente fundos listados na BTG Pactual e XP Investimentos são exibidos. No lado direito é possível alterar o filtro.</p>
                                    </React.Fragment>
                                }>
                                    <Typography variant="h6" className={classes.withTooltip}>Fundos de Investimento</Typography>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Hidden smDown>
                        <Grid item>
                            <Grid container alignItems="center" spacing={8}>
                                <Grid item>
                                    <IconButton
                                        aria-label="Filtro"
                                        onClick={this.handleFilterClick}>
                                        <FilterListIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Hidden>
                </Grid>
                <Hidden smDown>
                    <Grid container spacing={this.state.layout.showingFilter ? 16 : 0}>
                        <Grid item xs={12}>
                            <Paper elevation={1} square={true}>
                                <Collapse in={this.state.layout.showingFilter}>
                                    <FundFilterComponent onFilterChanged={this.handleFilterChange} />
                                </Collapse>
                            </Paper>
                        </Grid>
                    </Grid>
                </Hidden>
                <Grid container spacing={16} alignItems="center">
                    <Grid item xs={12} sm={6} md={3} xl={3}>
                        <IndicatorPaper title="Desempenho" field="investment_return" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} xl={3}>
                        <IndicatorPaper title="Patrimônio" field="networth" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} xl={3}>
                        <IndicatorPaper title="Cotistas" field="quotaholders" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} xl={3}>
                        <IndicatorPaper title="Risco" field="risk" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} inverted />
                    </Grid>
                </Grid>
                <Grid container spacing={16} alignItems="center">
                    <Grid item xs>
                        <Grid container alignItems="center" spacing={8}>
                            <Grid item>
                                <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                    <React.Fragment>
                                        <p>Lista de mudanças que ocorreram recentemente nos fundos de investimento. </p>
                                        <p>Somente algumas informações são monitoradas. No lado direito é possível filtrar o intervalo de exibição.</p>
                                        <p>Início da coleta em 16/02/2019.</p>
                                    </React.Fragment>
                                }>
                                    <Typography variant="h6" className={classes.withTooltip}>Mudanças nos Fundos</Typography>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <Grid container alignItems="center" spacing={8}>
                            <Grid item>
                                <Select
                                    value={this.state.config.changesRange}
                                    onChange={this.handleConfigChangesRangeChange}
                                    className={classes.select}
                                    inputProps={{
                                        name: 'changesRange',
                                        id: 'changesRange',
                                    }}>
                                    {rangeOptions.filter(range => range.name !== 'all').map(range => (<MenuItem key={range.name} value={range.name}>{range.displayName}</MenuItem>))}
                                </Select>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs={12} sm={12} md={6} xl={6}>
                        <FundsChangedPaper title="BTG Pactual" data={this.state.data.fundsChanged} broker="btgpactual" classes={classes} />
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} xl={6}>
                        <FundsChangedPaper title="XP Investimentos" data={this.state.data.fundsChanged} broker="xpi" classes={classes} />
                    </Grid>
                </Grid>
            </div >
        );
    }
}

const IndicatorPaper = (props) => {
    const { classes, range, title, field, data, inverted = false } = props;

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
                        const positive = data[range][field]['top'].map((indicator, index) => (
                            <div key={index}>
                                <ListItem divider>
                                    <ListItemText disableTypography classes={{ root: classes.listItemText }}>
                                        <Typography component="span" className={classes.cropText}><Link to={'/funds/' + indicator.cnpj} className={classes.link}>{indicator.name}</Link></Typography>
                                    </ListItemText>
                                    <ListItemSecondaryAction>
                                        <Typography component="span" className={getClassForValue(indicator.value)}>{formatters.percentage(indicator.value)}</Typography>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </div>
                        ));
                        const divider = (< ListItem divider >
                            <ListItemText disableTypography={true}>
                                <Typography component="span" align="center">...</Typography>
                            </ListItemText>
                        </ListItem>);
                        const negative = data[range][field]['bottom'].map((indicator, index) => (
                            <div key={index}>
                                <ListItem divider>
                                    <ListItemText disableTypography classes={{ root: classes.listItemText }}>
                                        <Typography component="span" className={classes.cropText}><Link to={'/funds/' + indicator.cnpj} className={classes.link}>{indicator.name}</Link></Typography>
                                    </ListItemText>
                                    <ListItemSecondaryAction>
                                        <Typography component="span" className={getClassForValue(indicator.value)}>{formatters.percentage(indicator.value)}</Typography>
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
                    isNull={() => (<Typography variant="subtitle1" align="center"><CircularProgress className={classes.progress} /></Typography>)}
                    isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                    isEmpty={() => (<Typography variant="subtitle1" align="center">Sem dados à exibir</Typography>)}
                />
            </Paper>
        </div>);
};

const FundsChangedPaper = (props) => {
    const { classes, title, data, broker } = props;

    return (
        <div>
            <Paper elevation={1} square={true}>
                <Grid container wrap="nowrap" className={classes.optionsBar}>
                    <Typography component="h2" variant="subtitle1"><b>{title}</b></Typography>
                </Grid>
            </Paper>
            <Paper className={classes.paper} elevation={1} square={true}>
                <Grid container spacing={8} alignItems="center" justify="center">
                    <ShowStateComponent
                        data={data}
                        hasData={() => {
                            return data[broker].map((change, index) => (
                                <React.Fragment key={index}>
                                    <Grid item xs={12}>
                                        <Grid container spacing={8}>
                                            <Grid item xs={12} sm={12} md={6} xl={6}>
                                                <Typography component="span" align="left" className={classes.cropTextNormal}>{formatters.date(change.date)} - <Link to={'/funds/' + change.cnpj} className={classes.link}>{change.name}</Link></Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={12} md={6} xl={6}>
                                                {change.changes.map((fieldChange, index) => (<Typography key={index} component="span" align="right">{fieldChange}</Typography>))}
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </React.Fragment>
                            ));
                        }}
                        isNull={() => (<Typography variant="subtitle1" align="center"><CircularProgress className={classes.progress} /></Typography>)}
                        isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                        isEmpty={() => (<Typography variant="subtitle1" align="center">Sem dados à exibir</Typography>)}
                    />
                </Grid>
            </Paper>
        </div>);
};

export default withWidth()(withStyles(styles)(IndicatorsView));