export const themeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffd740',
      light: '#e64a19',
      dark: '#bf360c',
    },
    secondary: {
      main: '#d84315',
    },
    background: {
      default: '#151515',
      paper: '#151515',
    },
    error: {
      main: '#e91e63',
    },
  },
  typography: {
    // fontFamily: 'IBM Plex Sans',
    fontFamily: 'Azeret Mono',
    color: '#c0c0c0'
  },
  shape: {
    borderRadius: 4,
  },
  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
    MuiTooltip: {
      arrow: true,
    },
    MuiAppBar: {
      color: 'default',
    },
    MuiPaper: {
      color: '#c0c0c0'
    },
  },
  overrides: {
    MuiButton: {
      root: {
        background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
        border: 0,
        borderRadius: 3,
        boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
        color: '#c0c0c0',
        height: 48,
        padding: '0 30px',
      },
    },
  },
  spacing: 8,
};