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
  withTooltip: {    
    textDecoration: 'underline dashed'    
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
  }
});

export default theme;