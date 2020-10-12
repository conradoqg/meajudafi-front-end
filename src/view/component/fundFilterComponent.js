import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import { produce } from 'immer';
import { filterOptions } from '../option';
import Switch from '@material-ui/core/Switch';

const useStyles = makeStyles(theme => ({
    filterPaperContent: {
        padding: theme.spacing(2)
    }
}));

export const emptyState = {
    config: {
        filter: {
            icf_classe: [],
            icf_sit: ['EM FUNCIONAMENTO NORMAL'],
            icf_condom: ['Aberto'],
            icf_fundo_cotas: [],
            icf_fundo_exclusivo: ['N'],
            icf_rentab_fundo: [],
            iry_accumulated_networth: { min: '1', max: '' },
            iry_accumulated_quotaholders: { min: '', max: '' },
            iry_investment_return_1y: { min: '', max: '', format: value => value / 100 },
            iry_investment_return_2y: { min: '', max: '', format: value => value / 100 },
            iry_investment_return_3y: { min: '', max: '', format: value => value / 100 },
            iry_risk_1y: { min: '', max: '', format: value => value / 100 },
            iry_risk_2y: { min: '', max: '', format: value => value / 100 },
            iry_risk_3y: { min: '', max: '', format: value => value / 100 },
            switch: {
                xf_id: true,
                bf_id: true,
                mf_id: true
            }
        }
    }
};

function FundFilterComponent({ onFilterChanged }) {

    const [filter, setFilter] = useState(emptyState.config.filter);

    const classes = useStyles();

    function handleFilterOptionsChange(field) {
        return event => {
            const value = event.target.value;
            setFilter(produce(draft => {
                draft[field] = value;
            }));
        };
    }

    function handleFilterTextRangeChange(field, range) {
        return event => {
            const value = event.target.value;
            setFilter(produce(draft => {
                draft[field][range] = value;
            }));
        };
    }

    function handleSwitchChange(field) {
        return event => {
            const value = event.target.value;
            setFilter(produce(draft => {
                draft.switch[field] = value === 'false' ? true : false;
            }));
        };
    }

    function handleFilterApplyClick() {
        return onFilterChanged(filter);
    }

    function handleFilterClearClick() {
        setFilter(produce(draft => {
            draft = emptyState.config.filter;
        }));

        return onFilterChanged(emptyState.config.filter);
    }

    return (
        <div className={classes.filterPaperContent}>
            <Typography variant="h6" align="center" gutterBottom>Filtros</Typography>
            <Grid container spacing={3}>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Classe:</Typography>
                    <Select
                        multiple
                        displayEmpty
                        value={filter.icf_classe}
                        onChange={handleFilterOptionsChange('icf_classe')}
                        input={<Input id="icf_classe_input" />}
                        renderValue={selected => selected.length === 0 ? <em>Todos</em> : selected.map(item => filterOptions.icf_classe.options.find(clazz => clazz.value === item).displayName).join(', ')}
                        fullWidth>
                        {filterOptions.icf_classe.options.map(option => (
                            <MenuItem key={option.displayName} value={option.value}>
                                <Checkbox checked={filter.icf_classe.indexOf(option.value) > -1} />
                                <ListItemText primary={option.displayName} />
                            </MenuItem>
                        ))}
                    </Select>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Situação:</Typography>
                    <Select
                        multiple
                        value={filter.icf_sit}
                        onChange={handleFilterOptionsChange('icf_sit')}
                        input={<Input id="icf_sit_input" />}
                        renderValue={selected => selected.map(item => filterOptions.icf_sit.options.find(clazz => clazz.value === item).displayName).join(', ')}
                        fullWidth>
                        {filterOptions.icf_sit.options.map(classOption => (
                            <MenuItem key={classOption.displayName} value={classOption.value}>
                                <Checkbox checked={filter.icf_sit.indexOf(classOption.value) > -1} />
                                <ListItemText primary={classOption.displayName} />
                            </MenuItem>
                        ))}
                    </Select>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Fundo de Condomínio:</Typography>
                    <Select
                        multiple
                        value={filter.icf_condom}
                        onChange={handleFilterOptionsChange('icf_condom')}
                        input={<Input id="icf_condom_input" />}
                        renderValue={selected => selected.map(item => filterOptions.icf_condom.options.find(clazz => clazz.value === item).displayName).join(', ')}
                        fullWidth>
                        {filterOptions.icf_condom.options.map(classOption => (
                            <MenuItem key={classOption.displayName} value={classOption.value}>
                                <Checkbox checked={filter.icf_condom.indexOf(classOption.value) > -1} />
                                <ListItemText primary={classOption.displayName} />
                            </MenuItem>
                        ))}
                    </Select>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Fundo de Cotas:</Typography>
                    <Select
                        multiple
                        value={filter.icf_fundo_cotas}
                        onChange={handleFilterOptionsChange('icf_fundo_cotas')}
                        input={<Input id="icf_fundo_cotas_input" />}
                        renderValue={selected => selected.map(item => filterOptions.icf_fundo_cotas.options.find(clazz => clazz.value === item).displayName).join(', ')}
                        fullWidth>
                        {filterOptions.icf_fundo_cotas.options.map(classOption => (
                            <MenuItem key={classOption.displayName} value={classOption.value}>
                                <Checkbox checked={filter.icf_fundo_cotas.indexOf(classOption.value) > -1} />
                                <ListItemText primary={classOption.displayName} />
                            </MenuItem>
                        ))}
                    </Select>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Fundo Exclusivo:</Typography>
                    <Select
                        multiple
                        value={filter.icf_fundo_exclusivo}
                        onChange={handleFilterOptionsChange('icf_fundo_exclusivo')}
                        input={<Input id="icf_fundo_exclusivo_input" />}
                        renderValue={selected => selected.map(item => filterOptions.icf_fundo_exclusivo.options.find(clazz => clazz.value === item).displayName).join(', ')}
                        fullWidth>
                        {filterOptions.icf_fundo_exclusivo.options.map(classOption => (
                            <MenuItem key={classOption.displayName} value={classOption.value}>
                                <Checkbox checked={filter.icf_fundo_exclusivo.indexOf(classOption.value) > -1} />
                                <ListItemText primary={classOption.displayName} />
                            </MenuItem>
                        ))}
                    </Select>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Benchmark:</Typography>
                    <Select
                        multiple
                        value={filter.icf_rentab_fundo}
                        onChange={handleFilterOptionsChange('icf_rentab_fundo')}
                        input={<Input id="icf_rentab_fundo_input" />}
                        renderValue={selected => selected.map(item => filterOptions.icf_rentab_fundo.options.find(clazz => clazz.value === item).displayName).join(', ')}
                        fullWidth>
                        {filterOptions.icf_rentab_fundo.options.map(classOption => (
                            <MenuItem key={classOption.displayName} value={classOption.value}>
                                <Checkbox checked={filter.icf_rentab_fundo.indexOf(classOption.value) > -1} />
                                <ListItemText primary={classOption.displayName} />
                            </MenuItem>
                        ))}
                    </Select>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Patrimonio:</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Input
                                id="iry_accumulated_networth-from"
                                value={filter.iry_accumulated_networth.min}
                                placeholder="De"
                                onChange={handleFilterTextRangeChange('iry_accumulated_networth', 'min')}
                                startAdornment={<InputAdornment position="start">R$</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Input
                                id="iry_accumulated_networth-to"
                                value={filter.iry_accumulated_networth.max}
                                placeholder="Até"
                                onChange={handleFilterTextRangeChange('iry_accumulated_networth', 'max')}
                                startAdornment={<InputAdornment position="start">R$</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Cotistas:</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Input
                                id="iry_accumulated_quotaholders-from"
                                value={filter.iry_accumulated_quotaholders.min}
                                placeholder="De"
                                onChange={handleFilterTextRangeChange('iry_accumulated_quotaholders', 'min')}
                                startAdornment={<InputAdornment position="start">#</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Input
                                id="iry_accumulated_quotaholders-to"
                                value={filter.iry_accumulated_quotaholders.max}
                                placeholder="Até"
                                onChange={handleFilterTextRangeChange('iry_accumulated_quotaholders', 'max')}
                                startAdornment={<InputAdornment position="start">#</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Desempenho 1A:</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Input
                                id="iry_investment_return_1y-from"
                                value={filter.iry_investment_return_1y.min}
                                placeholder="De"
                                onChange={handleFilterTextRangeChange('iry_investment_return_1y', 'min')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Input
                                id="iry_investment_return_1y-to"
                                value={filter.iry_investment_return_1y.max}
                                placeholder="Até"
                                onChange={handleFilterTextRangeChange('iry_investment_return_1y', 'max')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Desempenho 2A:</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Input
                                id="iry_investment_return_2y-from"
                                value={filter.iry_investment_return_2y.min}
                                placeholder="De"
                                onChange={handleFilterTextRangeChange('iry_investment_return_2y', 'min')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Input
                                id="iry_investment_return_2y-to"
                                value={filter.iry_investment_return_2y.max}
                                placeholder="Até"
                                onChange={handleFilterTextRangeChange('iry_investment_return_2y', 'max')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Desempenho 3A:</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Input
                                id="iry_investment_return_3y-from"
                                value={filter.iry_investment_return_3y.min}
                                placeholder="De"
                                onChange={handleFilterTextRangeChange('iry_investment_return_3y', 'min')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Input
                                id="iry_investment_return_3y-to"
                                value={filter.iry_investment_return_3y.max}
                                placeholder="Até"
                                onChange={handleFilterTextRangeChange('iry_investment_return_3y', 'max')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Risco 1A:</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Input
                                id="iry_risk_1y-from"
                                value={filter.iry_risk_1y.min}
                                placeholder="De"
                                onChange={handleFilterTextRangeChange('iry_risk_1y', 'min')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Input
                                id="iry_risk_1y-to"
                                value={filter.iry_risk_1y.max}
                                placeholder="Até"
                                onChange={handleFilterTextRangeChange('iry_risk_1y', 'max')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Risco 2A:</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Input
                                id="iry_risk_2y-from"
                                value={filter.iry_risk_2y.min}
                                placeholder="De"
                                onChange={handleFilterTextRangeChange('iry_risk_2y', 'min')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Input
                                id="iry_risk_2y-to"
                                value={filter.iry_risk_2y.max}
                                placeholder="Até"
                                onChange={handleFilterTextRangeChange('iry_risk_2y', 'max')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={3}>
                    <Typography variant="subtitle1" align="center" gutterBottom>Risco 3A:</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Input
                                id="iry_risk_3y-from"
                                value={filter.iry_risk_3y.min}
                                placeholder="De"
                                onChange={handleFilterTextRangeChange('iry_risk_3y', 'min')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Input
                                id="iry_risk_3y-to"
                                value={filter.iry_risk_3y.max}
                                placeholder="Até"
                                onChange={handleFilterTextRangeChange('iry_risk_3y', 'max')}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                inputProps={{
                                    'aria-label': 'De',
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={3} align="center">
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={filter.switch.xf_id}
                                        onChange={handleSwitchChange('xf_id')}
                                        value={filter.switch.xf_id ? 'true' : 'false'}
                                    />
                                }
                                label="Somente fundos XP"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={filter.switch.bf_id}
                                        onChange={handleSwitchChange('bf_id')}
                                        value={filter.switch.bf_id ? 'true' : 'false'}
                                    />
                                }
                                label="Somente fundos BTG Pactual"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={filter.switch.mf_id}
                                        onChange={handleSwitchChange('mf_id')}
                                        value={filter.switch.mf_id ? 'true' : 'false'}
                                    />
                                }
                                label="Somente fundos Modal Mais"
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={6} align="center">
                    <Button variant="contained" color="primary" onClick={handleFilterApplyClick} >Aplicar</Button>
                </Grid>
                <Grid item xs={6} align="center">
                    <Button variant="contained" color="secondary" onClick={handleFilterClearClick} >Limpar</Button>
                </Grid>
            </Grid>
        </div>
    );
}

export default FundFilterComponent;