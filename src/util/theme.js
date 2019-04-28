import { createMuiTheme } from '@material-ui/core/styles';

const defaultTheme = createMuiTheme({
    typography: {
        useNextVariants: true,
    },
});

const theme = createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    overrides: {
        MuiTooltip: {
            tooltip: {
                fontSize: defaultTheme.typography.pxToRem(14),
                backgroundColor: defaultTheme.palette.common.white,
                color: 'rgba(0, 0, 0, 0.87)',
                boxShadow: defaultTheme.shadows[1],
            }
        }
    },
    withTooltip: {
        '&:hover': {
            textDecoration: 'underline dashed'
        },
        [defaultTheme.breakpoints.down('md')]: {
            textDecoration: 'underline dashed'
        },

    },
    link: {
        textDecoration: 'none',
        color: 'black',
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline'
        },
        [defaultTheme.breakpoints.down('md')]: {
            textDecoration: 'underline',
        }
    }
});

export default theme;