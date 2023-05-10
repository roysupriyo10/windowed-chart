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
    paddingTop: 6,
    paddingBottom: 6,
  }
}));

const CustomToggleButtonGroup = (props) => {
  return (
    <StyledToggleButtonGroup {...props} >
    </StyledToggleButtonGroup>
  )
}

export default CustomToggleButtonGroup