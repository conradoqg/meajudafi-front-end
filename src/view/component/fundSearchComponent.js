import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import Grid from '@material-ui/core/Grid';
import { useState, useRendering } from '../../util';

const useStyles = makeStyles(theme => ({
    input: {
        marginLeft: theme.spacing(1)
    },
}));

const emptyState = {
    config: {
        search: {
            term: '',
            isTyping: false
        }
    }
};

let timeout = null;

function FundSearchComponent(props) {
    const [search, setSearch] = useState(emptyState.config.search);

    const styles = useStyles();
    useRendering();

    function triggerOnSearchChanged(value) {
        props.onSearchChanged(value);
        setSearch({
            term: value,
            isTyping: false
        });
    }

    function handleSearchChange(event) {
        const value = event.target.value;
        setSearch({
            term: value,
            isTyping: true
        });

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => triggerOnSearchChanged(value), 1000);
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            const value = event.target.value;
            setSearch({
                term: value,
                isTyping: true
            });

            if (timeout) clearTimeout(timeout);
            triggerOnSearchChanged(value);
        }
    }

    console.log(search);

    let validTerm = (search.isTyping ? search.term : props.term);

    return (
        <Grid container alignItems="center" justify="flex-start">
            <Input
                id="input-with-icon-grid"
                placeholder="Nome do fundo ou CNPJ"
                value={validTerm}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                className={styles.input}
                autoComplete="new-search"
                fullWidth
                startAdornment={
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                }
                inputProps={{
                    'aria-label': 'Procura',
                }}
            />
        </Grid>
    );
}

export default FundSearchComponent;