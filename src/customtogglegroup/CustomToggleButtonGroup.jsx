import React from 'react'
import styled from '@emotion/styled'
import { ToggleButtonGroup } from '@mui/material'

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    margin: theme.spacing(0.5),
    border: 0,
    '&.Mui-disabled': {
      border: 0,
    },
    '&:not(:first-of-type)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-of-type': {
      borderRadius: theme.shape.borderRadius,
      
    },
  },
  '& .MuiToggleButton-root': {
    textTransform: 'none',
    fontSize: '10px',
    paddingTop: 2,
    paddingBottom: 2,
  }
}));

const CustomToggleButtonGroup = (props) => {
  return (
    <StyledToggleButtonGroup {...props} >
    </StyledToggleButtonGroup>
  )
}

export default CustomToggleButtonGroup