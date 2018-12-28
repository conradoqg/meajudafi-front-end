import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import InputAdornment from '@material-ui/core/InputAdornment';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import { produce, setAutoFreeze } from 'immer';
import filterOptions from './filterOptions';

setAutoFreeze(false);

const styles = theme => ({
    filterPaperContent: {
        padding: theme.spacing.unit * 2
    }
});

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP
        },
    },
};

const emptyState = {
    data: {
        filterOptions: filterOptions
    },
    config: {
        filter: {
            icf_classe: [],
            icf_sit: ['EM FUNCIONAMENTO NORMAL'],
            icf_condom: ['Aberto'],
            icf_fundo_cotas: ['S'],
            icf_fundo_exclusivo: ['N'],
            icf_rentab_fundo: [],
            iry_networth: { min: '1', max: '' },
            iry_quotaholders: { min: '', max: '' },
            iry_investment_return_1y: { min: '', max: '', format: value => value / 100 },
            iry_investment_return_2y: { min: '', max: '', format: value => value / 100 },
            iry_investment_return_3y: { min: '', max: '', format: value => value / 100 },
            iry_risk_1y: { min: '', max: '', format: value => value / 100 },
            iry_risk_2y: { min: '', max: '', format: value => value / 100 },
            iry_risk_3y: { min: '', max: '', format: value => value / 100 }
        }
    }
};

class FundFilterView extends React.Component {
    state = emptyState;

    static emptyState = emptyState;

    handleFilterOptionsChange = field => {
        return event => {
            const value = event.target.value;
            this.setState(produce(draft => {
                draft.config.filter[field] = value;
            }));
        };
    }

    handleFilterTextRangeChange = (field, range) => {
        return event => {
            const value = event.target.value;
            this.setState(produce(draft => {
                draft.config.filter[field][range] = value;
            }));
        };
    }

    handleFilterApplyClick = async () => {
        return this.props.onFilterChanged(this.state.config.filter);
    }

    handleFilterClearClick = async () => {
        this.setState(produce(draft => {
            draft.config.filter = emptyState.config.filter;
        }));

        return this.props.onFilterChanged(emptyState.config.filter);
    }

    render = () => {
        const { classes } = this.props;

        return (
            <div className={classes.filterPaperContent}>
                <Typography variant="title" align="center" gutterBottom>Filtros</Typography>
                <Grid container spacing={24}>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Classe:</Typography>
                        <Select
                            multiple
                            displayEmpty
                            value={this.state.config.filter.icf_classe}
                            onChange={this.handleFilterOptionsChange('icf_classe')}
                            input={<Input id="select-multiple-placeholder" />}
                            renderValue={selected => selected.length === 0 ? <em>Todos</em> : selected.map(item => this.state.data.filterOptions.icf_classe.options.find(clazz => clazz.value == item).displayName).join(', ')}
                            MenuProps={MenuProps}
                            fullWidth>
                            {this.state.data.filterOptions.icf_classe.options.map(option => (
                                <MenuItem key={option.displayName} value={option.value}>
                                    <Checkbox checked={this.state.config.filter.icf_classe.indexOf(option.value) > -1} />
                                    <ListItemText primary={option.displayName} />
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Situação:</Typography>
                        <Select
                            multiple
                            value={this.state.config.filter.icf_sit}
                            onChange={this.handleFilterOptionsChange('icf_sit')}
                            input={<Input id="select-multiple-checkbox" />}
                            renderValue={selected => selected.map(item => this.state.data.filterOptions.icf_sit.options.find(clazz => clazz.value == item).displayName).join(', ')}
                            MenuProps={MenuProps}
                            fullWidth>
                            {this.state.data.filterOptions.icf_sit.options.map(classOption => (
                                <MenuItem key={classOption.displayName} value={classOption.value}>
                                    <Checkbox checked={this.state.config.filter.icf_sit.indexOf(classOption.value) > -1} />
                                    <ListItemText primary={classOption.displayName} />
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Fundo de Condomínio:</Typography>
                        <Select
                            multiple
                            value={this.state.config.filter.icf_condom}
                            onChange={this.handleFilterOptionsChange('icf_condom')}
                            input={<Input id="select-multiple-checkbox" />}
                            renderValue={selected => selected.map(item => this.state.data.filterOptions.icf_condom.options.find(clazz => clazz.value == item).displayName).join(', ')}
                            MenuProps={MenuProps}
                            fullWidth>
                            {this.state.data.filterOptions.icf_condom.options.map(classOption => (
                                <MenuItem key={classOption.displayName} value={classOption.value}>
                                    <Checkbox checked={this.state.config.filter.icf_condom.indexOf(classOption.value) > -1} />
                                    <ListItemText primary={classOption.displayName} />
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Fundo de Cotas:</Typography>
                        <Select
                            multiple
                            value={this.state.config.filter.icf_fundo_cotas}
                            onChange={this.handleFilterOptionsChange('icf_fundo_cotas')}
                            input={<Input id="select-multiple-checkbox" />}
                            renderValue={selected => selected.map(item => this.state.data.filterOptions.icf_fundo_cotas.options.find(clazz => clazz.value == item).displayName).join(', ')}
                            MenuProps={MenuProps}
                            fullWidth>
                            {this.state.data.filterOptions.icf_fundo_cotas.options.map(classOption => (
                                <MenuItem key={classOption.displayName} value={classOption.value}>
                                    <Checkbox checked={this.state.config.filter.icf_fundo_cotas.indexOf(classOption.value) > -1} />
                                    <ListItemText primary={classOption.displayName} />
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Fundo Exclusivo:</Typography>
                        <Select
                            multiple
                            value={this.state.config.filter.icf_fundo_exclusivo}
                            onChange={this.handleFilterOptionsChange('icf_fundo_exclusivo')}
                            input={<Input id="select-multiple-checkbox" />}
                            renderValue={selected => selected.map(item => this.state.data.filterOptions.icf_fundo_exclusivo.options.find(clazz => clazz.value == item).displayName).join(', ')}
                            MenuProps={MenuProps}
                            fullWidth>
                            {this.state.data.filterOptions.icf_fundo_exclusivo.options.map(classOption => (
                                <MenuItem key={classOption.displayName} value={classOption.value}>
                                    <Checkbox checked={this.state.config.filter.icf_fundo_exclusivo.indexOf(classOption.value) > -1} />
                                    <ListItemText primary={classOption.displayName} />
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Benchmark:</Typography>
                        <Select
                            multiple
                            value={this.state.config.filter.icf_rentab_fundo}
                            onChange={this.handleFilterOptionsChange('icf_rentab_fundo')}
                            input={<Input id="select-multiple-checkbox" />}
                            renderValue={selected => selected.map(item => this.state.data.filterOptions.icf_rentab_fundo.options.find(clazz => clazz.value == item).displayName).join(', ')}
                            MenuProps={MenuProps}
                            fullWidth>
                            {this.state.data.filterOptions.icf_rentab_fundo.options.map(classOption => (
                                <MenuItem key={classOption.displayName} value={classOption.value}>
                                    <Checkbox checked={this.state.config.filter.icf_rentab_fundo.indexOf(classOption.value) > -1} />
                                    <ListItemText primary={classOption.displayName} />
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Patrimonio:</Typography>
                        <Grid container spacing={24}>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_networth-from"
                                    value={this.state.config.filter.iry_networth.min}
                                    placeholder="De"
                                    onChange={this.handleFilterTextRangeChange('iry_networth', 'min')}
                                    startAdornment={<InputAdornment position="start">R$</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_networth-to"
                                    value={this.state.config.filter.iry_networth.max}
                                    placeholder="Até"
                                    onChange={this.handleFilterTextRangeChange('iry_networth', 'max')}
                                    startAdornment={<InputAdornment position="start">R$</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Cotistas:</Typography>
                        <Grid container spacing={24}>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_quotaholders-from"
                                    value={this.state.config.filter.iry_quotaholders.min}
                                    placeholder="De"
                                    onChange={this.handleFilterTextRangeChange('iry_quotaholders', 'min')}
                                    startAdornment={<InputAdornment position="start">#</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_quotaholders-to"
                                    value={this.state.config.filter.iry_quotaholders.max}
                                    placeholder="Até"
                                    onChange={this.handleFilterTextRangeChange('iry_quotaholders', 'max')}
                                    startAdornment={<InputAdornment position="start">#</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Desempenho 1A:</Typography>
                        <Grid container spacing={24}>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_investment_return_1y-from"
                                    value={this.state.config.filter.iry_investment_return_1y.min}
                                    placeholder="De"
                                    onChange={this.handleFilterTextRangeChange('iry_investment_return_1y', 'min')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_investment_return_1y-to"
                                    value={this.state.config.filter.iry_investment_return_1y.max}
                                    placeholder="Até"
                                    onChange={this.handleFilterTextRangeChange('iry_investment_return_1y', 'max')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Desempenho 2A:</Typography>
                        <Grid container spacing={24}>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_investment_return_2y-from"
                                    value={this.state.config.filter.iry_investment_return_2y.min}
                                    placeholder="De"
                                    onChange={this.handleFilterTextRangeChange('iry_investment_return_2y', 'min')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_investment_return_2y-to"
                                    value={this.state.config.filter.iry_investment_return_2y.max}
                                    placeholder="Até"
                                    onChange={this.handleFilterTextRangeChange('iry_investment_return_2y', 'max')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Desempenho 3A:</Typography>
                        <Grid container spacing={24}>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_investment_return_3y-from"
                                    value={this.state.config.filter.iry_investment_return_3y.min}
                                    placeholder="De"
                                    onChange={this.handleFilterTextRangeChange('iry_investment_return_3y', 'min')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_investment_return_3y-to"
                                    value={this.state.config.filter.iry_investment_return_3y.max}
                                    placeholder="Até"
                                    onChange={this.handleFilterTextRangeChange('iry_investment_return_3y', 'max')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Risco 1A:</Typography>
                        <Grid container spacing={24}>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_risk_1y-from"
                                    value={this.state.config.filter.iry_risk_1y.min}
                                    placeholder="De"
                                    onChange={this.handleFilterTextRangeChange('iry_risk_1y', 'min')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_risk_1y-to"
                                    value={this.state.config.filter.iry_risk_1y.max}
                                    placeholder="Até"
                                    onChange={this.handleFilterTextRangeChange('iry_risk_1y', 'max')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Risco 2A:</Typography>
                        <Grid container spacing={24}>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_risk_2y-from"
                                    value={this.state.config.filter.iry_risk_2y.min}
                                    placeholder="De"
                                    onChange={this.handleFilterTextRangeChange('iry_risk_2y', 'min')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_risk_2y-to"
                                    value={this.state.config.filter.iry_risk_2y.max}
                                    placeholder="Até"
                                    onChange={this.handleFilterTextRangeChange('iry_risk_2y', 'max')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subheading" align="center" gutterBottom>Risco 3A:</Typography>
                        <Grid container spacing={24}>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_risk_3y-from"
                                    value={this.state.config.filter.iry_risk_3y.min}
                                    placeholder="De"
                                    onChange={this.handleFilterTextRangeChange('iry_risk_3y', 'min')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Input
                                    id="iry_risk_3y-to"
                                    value={this.state.config.filter.iry_risk_3y.max}
                                    placeholder="Até"
                                    onChange={this.handleFilterTextRangeChange('iry_risk_3y', 'max')}
                                    endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                    inputProps={{
                                        'aria-label': 'De',
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={3}>
                    </Grid>
                    <Grid item xs={6} align="center">
                        <Button variant="contained" color="primary" onClick={this.handleFilterApplyClick} >Aplicar</Button>
                    </Grid>
                    <Grid item xs={6} align="center">
                        <Button variant="contained" color="secondary" onClick={this.handleFilterClearClick} >Limpar</Button>
                    </Grid>
                </Grid>
            </div>
        );
    }

}

module.exports = withStyles(styles)(FundFilterView);