import React from 'react'

import { v4 as uuidv4 } from 'uuid'

import CustomToggleButtonGroup from '../customtogglegroup/CustomToggleButtonGroup';

import { ToggleButton } from '@mui/material'

const TimeFrameToggler = ({ timeFrame, handleTimeFrame }) => {
  const children = [
    <ToggleButton value="1m" key={uuidv4()}>
      1m
    </ToggleButton>,
    <ToggleButton value="3m" key={uuidv4()}>
      3m
    </ToggleButton>,
    <ToggleButton value="5m" key={uuidv4()}>
      5m
    </ToggleButton>,
    <ToggleButton value="15m" key={uuidv4()}>
      15m
    </ToggleButton>,
    <ToggleButton value="30m" key={uuidv4()}>
      30m
    </ToggleButton>,
    <ToggleButton value="1h" key={uuidv4()}>
      1H
    </ToggleButton>,
    <ToggleButton value="2h" key={uuidv4()}>
      2H
    </ToggleButton>,
    <ToggleButton value="4h" key={uuidv4()}>
      4H
    </ToggleButton>,
    <ToggleButton value="8h" key={uuidv4()}>
      8H
    </ToggleButton>,
    <ToggleButton value="12h" key={uuidv4()}>
      12H
    </ToggleButton>,
    <ToggleButton value="1d" key={uuidv4()}>
      1D
    </ToggleButton>,
    <ToggleButton value="3d" key={uuidv4()}>
      3D
    </ToggleButton>,
    <ToggleButton value="1w" key={uuidv4()}>
      1W
    </ToggleButton>,
    <ToggleButton value="1M" key={uuidv4()}>
      1M
    </ToggleButton>,
  ]

  return (
      <CustomToggleButtonGroup
        className='timeframe__toggler'
        value={timeFrame}
        aria-label='time-frame-toggler'
        exclusive
        onChange={handleTimeFrame}
        size='small'
      >
        {children}
      </CustomToggleButtonGroup>
  )
}

export default TimeFrameToggler