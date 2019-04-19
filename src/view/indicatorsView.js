
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import LightGreen from '@material-ui/core/colors/lightGreen';
import Blue from '@material-ui/core/colors/blue';
import Red from '@material-ui/core/colors/red';
import Grey from '@material-ui/core/colors/grey';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import FilterListIcon from '@material-ui/icons/FilterList';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';
import { produce, setAutoFreeze } from 'immer';
import allKeys from 'promise-results/allKeys';
import * as d3Format from 'd3-format';
import ptBR from 'd3-format/locale/pt-BR.json';
import FundFilterComponent from './component/fundFilterComponent';
import ShowStateComponent from './component/showStateComponent';
import DataHistoryChartComponent from './component/dataHistoryChartComponent';
import API from '../api';
import { rangeOptions } from './option';
import { nextColorIndex } from '../util';

d3Format.formatDefaultLocale(ptBR);

setAutoFreeze(false);

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
        color: LightGreen[500]
    },
    indicatorValueBlue: {
        color: Blue[500]
    },
    indicatorValueNegative: {
        color: Red[500]
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
    // TODO: Help should be a global class
    help: {
        margin: 10,
        backgroundColor: Grey[600],
        width: 17,
        height: 17,
        fontSize: 10,
        fontWeight: 'bold'
    }
});

const emptyState = {
    data: {
        fundIndicators: null,
        economyIndicators: null,
        fundsChanged: {
            btgpactual: null,
            xpi: null
        }
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

    handleConfigRangeChange = async event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.economyIndicators = emptyState.data.economyIndicators;
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

    handleChartInitialized = async (figure) => {
        this.setState(produce(draft => {
            draft.data.economyIndicators = figure;
        }));
    }

    handleChartUpdate = async (figure) => {
        this.setState(produce(draft => {
            draft.data.economyIndicators = figure;
        }));
    }

    handleFilterClick = () => {
        this.setState(produce(draft => {
            draft.layout.showingFilter = !draft.layout.showingFilter;
        }));
    }

    handleFilterChanged = async (filter) => {
        const nextState = produce(this.state, draft => {
            draft.config.filter = filter;
            draft.layout.showingFilter = false;
            draft.data.fundIndicators = emptyState.data.fundIndicators;
        });

        this.setState(nextState);

        return this.updateData(nextState);
    }

    componentDidMount = async () => {
        return this.updateData(this.state);
    }

    updateData = async (nextState) => {
        try {
            const { fundIndicators, economyIndicators, fundsChanged } = await allKeys({
                fundIndicators: this.getFundIndicators(nextState.config),
                economyIndicators: this.getEconomyIndicators(nextState.config),
                fundsChanged: this.getFundsChanged(nextState.config)
            });

            nextState = produce(nextState, draft => {
                draft.data.fundIndicators = fundIndicators;
                draft.data.economyIndicators = economyIndicators;
                draft.data.fundsChanged = fundsChanged;
            });

            this.setState(nextState);
        } catch (ex) {
            console.error(ex.message);
            this.setState(produce(draft => {
                draft.data.fundIndicators = ex.message;
            }));
        }
    }

    async getEconomyIndicators(config) {
        let colorIndex = 0;
        const from = rangeOptions.find(range => range.name === config.range).toDate();

        const economyIndicators = await API.getEconomyIndicators(from);

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
                xaxis: {
                    showspikes: true,
                    spikemode: 'across',
                    domain: [0.00, 0.95]
                },
                yaxis: {
                    title: 'Bovespa',
                    tickformat: ',.0',
                    hoverformat: ',.2',
                    fixedrange: true
                },
                yaxis2: {
                    title: 'Dólar',
                    anchor: 'x',
                    overlaying: 'y',
                    side: 'right',
                    tickprefix: 'R$ ',
                    tickformat: ',.2f',
                    hoverformat: ',.2f',
                    fixedrange: true,
                    position: 0.95
                },
                yaxis3: {
                    title: 'Euro',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    tickprefix: 'R$ ',
                    tickformat: ',.2f',
                    hoverformat: ',.2f',
                    fixedrange: true,
                    position: 1
                }
            }
        };
    }

    async getFundIndicators(config) {
        return await API.getFundIndicators(config);
    }

    async getFundsChanged(config) {
        const from = rangeOptions.find(range => range.name === config.changesRange).toDate();

        const fundsChanged = await API.getFundsChanged(from);

        const fundsChanges = {
            btgpactual: [],
            xpi: []
        };

        fundsChanged.forEach(change => {
            const key = change.table_name === 'btgpactual_funds' ? 'btgpactual' : 'xpi';
            const date_field = change.table_name === 'btgpactual_funds' ? 'bf_date' : 'xf_date';

            const relevantChanges = [];
            let date = null;

            if (change.action === 'I') {
                date = change.row_data[date_field];
                relevantChanges.push('Adicionado a lista de fundos');
            } else if (change.action === 'D') {
                date = change.changed_fields[date_field];
                relevantChanges.push('Removido da lista de fundos');
            } else {
                date = change.changed_fields[date_field];
                Object.keys(change.changed_fields).forEach(changedField => {
                    const capitalized = value => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

                    const relevantFields = {
                        xf_state: {
                            title: 'Captação',
                            text: value => value === '0' ? 'Fechada' : 'Aberta'
                        },
                        xf_formal_risk: {
                            title: 'Risco formal',
                            text: value => ['Desconhecido', 'Risco baixo', 'Risco médio baixo', 'Risco médio', 'Risco médio alto', 'Risco alto'][value]
                        },
                        xf_initial_investment: {
                            title: 'Investimento inicial',
                            text: d3Format.format(',.2f')
                        },
                        xf_rescue_financial_settlement: {
                            title: 'Dias para resgate',
                            text: value => `D+${value}`
                        },
                        bf_is_blacklist: {
                            title: 'Captação',
                            text: value => value === 't' ? 'Fechada' : 'Aberta'
                        },
                        bf_inactive: {
                            title: 'Captação',
                            text: value => value ? 'Aberta' : 'Fechada'
                        },
                        bf_risk_name: {
                            title: 'Risco formal',
                            text: capitalized
                        },
                        bf_minimum_initial_investment: {
                            title: 'Investimento inicial',
                            text: d3Format.format(',.2f')
                        },
                        bf_rescue_financial_settlement: {
                            title: 'Dias para resgate',
                            text: value => `D+${value}`
                        },
                        bf_investor_type: {
                            title: 'Tipo de investidor',
                            text: value => value === 'NAO_QUALIFICADO' ? 'Não qualificado' : 'Qualificado'
                        }
                    };
                    if (relevantFields[changedField]) {
                        relevantChanges.push(`${relevantFields[changedField].title} mudou de ${relevantFields[changedField].text(change.row_data[changedField])} para ${relevantFields[changedField].text(change.changed_fields[changedField])}`);
                    }
                });
            }

            if (relevantChanges.length > 0)
                fundsChanges[key].push({
                    date: date,
                    name: change.f_short_name,
                    cnpj: change.f_cnpj,
                    changes: relevantChanges
                });
        });

        return fundsChanges;
    }

    render() {
        const { globalClasses, classes } = this.props;

        return (
            <div>
                <div className={globalClasses.appBarSpacer} />
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="display1" gutterBottom>Indicadores</Typography>
                        <Typography component="span" gutterBottom><Tooltip title={
                            <React.Fragment>
                                <p>Indicadores gerais de mercado e dos fundos de investimento.</p>
                                <p>No lado direito é possível alterar o intervalo visualizado.</p>
                            </React.Fragment>
                        }><Avatar className={classes.help}>?</Avatar></Tooltip></Typography>
                    </Grid>
                    <Grid container justify="flex-end">
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
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="headline" gutterBottom>Mercado</Typography>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs={12}>
                        <Paper className={classes.paper} elevation={1} square={true}>
                            <DataHistoryChartComponent
                                fund={this.state.data.economyIndicators}
                                onInitialized={(figure) => this.handleChartInitialized(figure)}
                                onUpdate={(figure) => this.handleChartUpdate(figure)}
                            />
                        </Paper>
                    </Grid>
                </Grid>
                <br />
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="headline" gutterBottom>Fundos de Investimento</Typography>
                        <Typography component="span" gutterBottom><Tooltip title={
                            <React.Fragment>
                                <p>Lista de melhores e piores fundos de investimento. </p>
                                <p>Por padrão somente fundos listados na BTG Pactual e XP Investimentos são exibidos. No lado direito é possível alterar o filtro.</p>
                            </React.Fragment>
                        }><Avatar className={classes.help}>?</Avatar></Tooltip></Typography>
                    </Grid>
                    <Grid container justify="flex-end">
                        <Grid item>
                            <IconButton
                                aria-label="Filtro"
                                onClick={this.handleFilterClick}>
                                <FilterListIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs={12}>
                        <Paper elevation={1} square={true}>
                            <Collapse in={this.state.layout.showingFilter}>
                                <FundFilterComponent onFilterChanged={this.handleFilterChanged} />
                            </Collapse>
                        </Paper>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs={3}>
                        <IndicatorPaper title="Desempenho" field="investment_return" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} globalClasses={globalClasses} />
                    </Grid>
                    <Grid item xs={3}>
                        <IndicatorPaper title="Patrimônio" field="networth" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} globalClasses={globalClasses} />
                    </Grid>
                    <Grid item xs={3}>
                        <IndicatorPaper title="Cotistas" field="quotaholders" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} globalClasses={globalClasses} />
                    </Grid>
                    <Grid item xs={3}>
                        <IndicatorPaper title="Risco" field="risk" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} globalClasses={globalClasses} inverted />
                    </Grid>
                </Grid>
                <br />
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="headline" gutterBottom>Mudanças nos Fundos</Typography>
                        <Typography component="span" gutterBottom><Tooltip title={
                            <React.Fragment>
                                <p>Lista de mudanças que ocorreram recentemente nos fundos de investimento. </p>
                                <p>Somente algumas informações são monitoradas. No lado direito é possível filtrar o intervalo de exibição.</p>
                                <p>Início da coleta em 16/02/2019.</p>
                            </React.Fragment>
                        }><Avatar className={classes.help}>?</Avatar></Tooltip></Typography>
                    </Grid>
                    <Grid container justify="flex-end">
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
                <Grid container spacing={16}>
                    <Grid item xs={6}>
                        <FundsChangedPaper title="BTG Pactual" data={this.state.data.fundsChanged['btgpactual']} classes={classes} globalClasses={globalClasses} />
                    </Grid>
                    <Grid item xs={6}>
                        <FundsChangedPaper title="XP Investimentos" data={this.state.data.fundsChanged['xpi']} classes={classes} globalClasses={globalClasses} />
                    </Grid>
                </Grid>
            </div >
        );
    }
}

const FundsChangedPaper = (props) => {
    const { globalClasses, classes, title, data } = props;

    return (
        <div>
            <Paper elevation={1} square={true}>
                <Grid container wrap="nowrap" className={classes.optionsBar}>
                    <Typography component="h2" variant="headline">{title}</Typography>
                </Grid>
            </Paper>
            <Paper className={classes.paper} elevation={1} square={true}>
                <Grid container spacing={8} alignItems="center" justify="center">
                    <ShowStateComponent
                        data={data}
                        hasData={() => {
                            return data.map((change, index) => (
                                <React.Fragment key={index}>
                                    <Grid item xs={12}>
                                        <Grid container spacing={8}>
                                            <Grid item xs>
                                                <Typography component="span" variant="body1" align="left" className={classes.cropTextNormal}>{dayjs(change.date).format('DD/MM/YYYY')} - <Link to={'/fundList/' + change.cnpj} className={globalClasses.link}>{change.name}</Link></Typography>
                                            </Grid>
                                            <Grid item xs>
                                                {change.changes.map((fieldChange, index) => (<Typography key={index} component="span" variant="body1" align="right">{fieldChange}</Typography>))}
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </React.Fragment>
                            ));
                        }}
                        isNull={() => (<Typography variant="subheading" align="center"><CircularProgress className={classes.progress} /></Typography>)}
                        isErrored={() => (<Typography variant="subheading" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                        isEmpty={() => (<Typography variant="subheading" align="center">Sem dados à exibir</Typography>)}
                    />
                </Grid>
            </Paper>
        </div>);
};

const IndicatorPaper = (props) => {
    const { globalClasses, classes, range, title, field, data, inverted = false } = props;

    const getClassForValue = value => {
        if (value === 0)
            return classes.indicatorValueBlue;
        else if (value > 0)
            return inverted ? classes.indicatorValueNegative : classes.indicatorValuePositive;
        else if (value < 0)
            return inverted ? classes.indicatorValuePositive : classes.indicatorValueNegative;
    };

    const formatValue = value => (value * 100).toFixed(2);

    return (
        <div>
            <Paper elevation={1} square={true}>
                <Grid container wrap="nowrap" className={classes.optionsBar}>
                    <Typography component="h2" variant="headline">{title}</Typography>
                </Grid>
            </Paper>
            <Paper className={classes.paper} elevation={1} square={true}>
                <ShowStateComponent
                    data={data && data[range]}
                    hasData={() => {
                        const positive = data[range][field]['top'].map((indicator, index) => (
                            <div key={index}>
                                <ListItem divider>
                                    <ListItemText disableTypography classes={{ root: classes.listItemText }}>
                                        <Typography component="span" variant="body1" className={classes.cropText}><Link to={'/fundList/' + indicator.cnpj} className={globalClasses.link}>{indicator.name}</Link></Typography>
                                    </ListItemText>
                                    <ListItemSecondaryAction>
                                        <Typography component="span" variant="body1" className={getClassForValue(indicator.value)}>{formatValue(indicator.value)}%</Typography>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </div>
                        ));
                        const divider = (< ListItem divider >
                            <ListItemText disableTypography={true}>
                                <Typography component="span" variant="body1" align="center">...</Typography>
                            </ListItemText>
                        </ListItem>);
                        const negative = data[range][field]['bottom'].map((indicator, index) => (
                            <div key={index}>
                                <ListItem divider>
                                    <ListItemText disableTypography classes={{ root: classes.listItemText }}>
                                        <Typography component="span" variant="body1" className={classes.cropText}><Link to={'/fundList/' + indicator.cnpj} className={globalClasses.link}>{indicator.name}</Link></Typography>
                                    </ListItemText>
                                    <ListItemSecondaryAction>
                                        <Typography component="span" variant="body1" className={getClassForValue(indicator.value)}>{formatValue(indicator.value)}%</Typography>
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
                    isNull={() => (<Typography variant="subheading" align="center"><CircularProgress className={classes.progress} /></Typography>)}
                    isErrored={() => (<Typography variant="subheading" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                    isEmpty={() => (<Typography variant="subheading" align="center">Sem dados à exibir</Typography>)}
                />
            </Paper>
        </div>);
};

export default withStyles(styles)(IndicatorsView);