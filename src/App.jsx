import { useRef } from 'react'
import './App.css'
import { useEffect } from 'react'
import { createChart } from 'lightweight-charts'
import { CrosshairMode } from 'lightweight-charts'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { responsiveFontSizes, CssBaseline } from '@mui/material'
import { themeOptions } from './theme/Theme'

let theme = createTheme(themeOptions);
theme = responsiveFontSizes(theme)

import fapi from './urls'
import convertToInternationalCurrencySystem from './utils/convertToInternationalCurrencySystem'
import TimeFrameToggler from './timeframetoggler/TimeFrameToggler'
import { KeyboardArrowRight } from '@mui/icons-material'

function App() {

  const chartContainerRef = useRef(null)



  const [ timeFrame, setTimeFrame ] = useState('1m')

  useEffect(() => setTimeFrame(JSON.parse(localStorage.getItem('timeFrame')) ?? '1m'), [])

  useEffect(
    () => {
      console.log(chartContainerRef.current.clientWidth)
      console.log(chartContainerRef.current.clientHeight)
      const chartApi = createChart(
        chartContainerRef.current,
        {
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
          // height: 450,
          crosshair: {
            mode: CrosshairMode.Normal
          },
          layout: {
            background: '#151515',
            textColor: 'white',
            fontFamily: 'Azeret Mono',
          },
          grid: {
            vertLines: {
              color: 'rgba(80, 80, 80, 0.5)',
            },
            horzLines: {
              color: 'rgba(80, 80, 80, 0.5)',
            },
          },
          rightPriceScale: {
            borderColor: 'rgba(80, 80, 80, 0.5)',
          },
          //timescale properties that dictate that the seconds while hovering are visible
          timeScale: {
            borderColor: 'rgba(80, 80, 80, 0.5)',
            timeVisible: true,
            secondsVisible: false
          },
          handleScroll: false,
          handleScale: false,
        }
      )

      const candleSeriesApi = chartApi.addCandlestickSeries(
        {
          upColor: '#00897B',
          downColor: '#FF5252',
          borderDownColor: '#FF5252',
          borderUpColor: '#00897B',
          wickDownColor: '#FF5252',
          wickUpColor: '#00897B',
        }
      )

      const volumeSeriesApi = chartApi.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceLineVisible: false,
        priceScaleId: '', // set as an overlay by setting a blank priceScaleId
      });

      //adjusting the margin to ensure that the volume bars and candlesticks don't overlap each other
      candleSeriesApi.priceScale().applyOptions({
        scaleMargins: {
          top: 0.15,
          bottom: 0.23
        }
      })

      //adjusting the margin to ensure that the candlesticks and volume bars don't overlap each other
      volumeSeriesApi.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8, // highest point of the series will be 90% away from the top
          bottom: 0,
        },
        // ticksVisible: false,
        // secondsVisible: false,
      })


      const dataSocket = new ReconnectingWebSocket(`${fapi.wss}ws/btcusdt_perpetual@continuousKline_${timeFrame}`)

      dataSocket.onopen = () => {
        console.log("Connection with binance market data stream established...");
      };

      dataSocket.addEventListener('open', () => {
        //fetching historical data to display in the chart
        fetch(`${fapi.rest}fapi/v1/continuousKlines?pair=BTCUSDT&contractType=PERPETUAL&interval=${timeFrame}&limit=1500`)
        .then(res => res.json())
        .then(data => {
          //this is the candlestick array
          const candleFetchedData = data.map(d => ({
            time: ( d[0] + 19800000 ) / 1000,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4])
          }))
          //this is the volume bar array
          const volumeFetchedData = data.map(d => ({
            time: ( d[0] + 19800000 ) / 1000,
            value: parseInt(d[5]),
            color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#00897B' : '#FF5252'
          }))
          //setting the captured data in the chart series
          candleSeriesApi.setData(candleFetchedData)
          volumeSeriesApi.setData(volumeFetchedData)
        })
        // listen to when the connection is established and incoming message is received
        dataSocket.onmessage = function handleIncomingData(event) {
          // parsing the JSON string containing candlestick data to throw into the update function of the specific series of the chart
          const message = JSON.parse(event.data);
          const { t, o, h, l, c, v } = message.k;
          const color = parseFloat(c) >= parseFloat(o) ? '#00897B' : '#FF5252'
          const change = parseFloat(c) >= parseFloat(o) ? `+${(parseFloat(c) - parseFloat(o)).toFixed(1)}` : `-${(parseFloat(o) - parseFloat(c)).toFixed(1)}`
          const percentChange = (((parseFloat(c) - parseFloat(o)) / parseFloat(o)) * 100) >= 0 ? `+${(((parseFloat(c) - parseFloat(o)) / parseFloat(o)) * 100).toFixed(2)}` : `${(((parseFloat(c) - parseFloat(o)) / parseFloat(o)) * 100).toFixed(2)}`
  
          // prerequisites to update legend
          const ohlcLegend = `O<span style="color: ${color}">${parseFloat(o).toFixed(1)}</span> H<span style="color: ${color}">${parseFloat(h).toFixed(1)}</span> L<span style="color: ${color}">${parseFloat(l).toFixed(1)}</span> C<span style="color: ${color}">${parseFloat(c).toFixed(1)}</span> <span style="color: ${color}">${change}</span> <span style="color: ${color}">(${percentChange}%)</span>`
          const volumeLegend = `<span style="color: ${color}">${convertToInternationalCurrencySystem(v)}</span>`
  
          // updating the legend that displays live candle data
          if (updateRow !== null) {
            updateRow.innerHTML = `${symbolName}&nbsp;&nbsp;${ohlcLegend}<br>Vol · BTC&nbsp;&nbsp;${volumeLegend}`
          }
  
          // this is to update the candleseries with the parsed data
          candleSeriesApi.update({
            time: ( t + 19800000 ) / 1000,
            open: parseFloat(o),
            high: parseFloat(h),
            low: parseFloat(l),
            close: parseFloat(c),
          });
  
          // this is to update the volumeseries with the parsed data
          volumeSeriesApi.update({
            time: ( t + 19800000 ) / 1000,
            value: parseInt(v),
            color: color
          });

          const timeFrameIdentifier = {
            '1m': 60,
            '3m': 60 * 3,
            '5m': 300,
            '15m': 60 * 15,
            '1h': 60 * 60,
            '2h': 60 * 60 * 2,
            '4h': 60 * 60 * 4,
            '8h': 60 * 60 * 8,
            '12h': 60 * 60 * 12,
            '1d': 60 * 60 * 24,
            '3d': 60 * 60 * 24 * 3,
            '1w': 60 * 60 * 24 * 7,
            '1M': 60 * 60 * 24 * 28
          }
          

          // fetch the remaining seconds to the close of the current candle
          const remainingSeconds = (timeFrameIdentifier[timeFrame] - ((parseInt(new Date().getTime() / 1000)) % timeFrameIdentifier[timeFrame]))

          // format the remaining seconds in the required format to display in the countdown timer div
          const dateObj = new Date(remainingSeconds * 1000)
          const minutes = dateObj.getUTCMinutes();
          const seconds = dateObj.getSeconds();
          const hours = dateObj.getUTCHours();
          // (hours ? hours.toString().padStart(2, '0') + ':' : '') + 
          const timeString = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
          // setTimerObject(prev => {
          //   return {
          //   ...timerObject,
          //   color: parseFloat(c) >= parseFloat(o) ? '#00897B' : '#FF5252',
          //   time: timeString,
          //   position: candleSeries.priceToCoordinate(parseFloat(c))
          //   }
          // })

          countDown.innerHTML = timeString

          timer.style.top = `${candleSeriesApi.priceToCoordinate(parseFloat(c)) + 6}px`
          timer.style.backgroundColor = parseFloat(c) >= parseFloat(o) ? '#00897B' : '#FF5252'
        }
      })

      // listen to when the connection to the websocket has been terminated
      dataSocket.onclose = () => {
        console.log("Connection with binance market data stream terminated. Should restart automatically...");
        // setTimeout(subscribeToBinance, 500);
      };

      // listen to any errors that might occur and restart the connection
      dataSocket.onerror = () => {
        console.log("An error has occured in the connection to the binance market data stream. Should restart automatically...")
      }

      // display the symbol name when no data is received
      const symbolName = `Bitcoin / TetherUS PERPETUAL FUTURES · ${timeFrame} · BINANCE`

      // create the div required to show the countdown timer
      const timer = document.createElement('div')
      timer.style = `
        all: unset;
        position: absolute;
        left: ${chartContainerRef.current.clientWidth - 84}px;
        top: 45px;
        text-align: center;
        z-index: 4;
        color: white;
        background-color: #00897b;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 12px;
        width: 79px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-bottom-right-radius: 3px;
        font-family: Azeret Mono
      `
      // timer.style = `
      //   all: unset;
      //   position: relative;
      //   right: 41px;
      //   top: -45px;
      //   z-index: 4;
      //   color: white;
      //   background-color: #00897b;
      //   display: inline;
      //   font-size: 12px;
      //   width: 79px;
      //   display: flex;
      //   justify-content: center;
      //   align-items: center;
      //   border-bottom-right-radius: 3px;
      //   font-family: Azeret Mono
      // `

      const countDown = document.createElement('div')
      countDown.innerHTML = 'Hello'

      timer.appendChild(countDown)

      chartContainerRef.current.appendChild(timer)

      // create the required div where the legend will be placed
      const legend = document.createElement('div');

      // positioning the legend
      legend.style = `position: absolute; color: #a6a6a6; font-weight: bold; left: 12px; top: 12px; z-index: 1; font-size: 13px; font-family: 'Azeret Mono'; line-height: 25px;`
      chartContainerRef.current.appendChild(legend);

      // two divs to switch on and off alternatively for alternate user action (hovering over candles and when not hovering)
      const hoverRow = document.createElement('div');
      const updateRow = document.createElement('div');
      
      // default configuration to be that user is not hovering over select candles
      updateRow.innerHTML = symbolName;
      hoverRow.style.display = 'none';
      legend.appendChild(hoverRow)
      legend.appendChild(updateRow)

      // function that will feed the relevant data to the legend div depending on the user action
      const handleCrosshairMove = (param) => {
        // when the user is hovering over a specific candle inside the chart
        if (param.time) {
          // switch to the div that will display past data
          updateRow.style.display = 'none'
          hoverRow.style.display = 'block'

          // receive data from candlestick
          const { open, high, low, close } = param.seriesData.get(candleSeriesApi);
          const { value, color } = param.seriesData.get(volumeSeriesApi);

          const change = close >= open ? `+${(close - open).toFixed(1)}` : `-${(open - close).toFixed(1)}`;

          const percentChange = (((close - open) / open) * 100) >= 0 ? `+${(((close - open) / open) * 100).toFixed(2)}` : `${(((close - open) / open) * 100).toFixed(2)}`;

          const ohlcLegend = `O<span style="color: ${color}">${open.toFixed(1)}</span> H<span style="color: ${color}">${high.toFixed(1)}</span> L<span style="color: ${color}">${low.toFixed(1)}</span> C<span style="color: ${color}">${close.toFixed(1)}</span> <span style="color: ${color}">${change}</span> <span style="color: ${color}">(${percentChange}%)</span>`;
          
          const volumeLegend = `<span style="color: ${color}">${convertToInternationalCurrencySystem(Number(value))}</span>`;

          // finally update the chart
          hoverRow.innerHTML = `${symbolName}&nbsp;&nbsp;${ohlcLegend}<br>Vol · BTC&nbsp;&nbsp;${volumeLegend}`
        } else {
          // if the user is not viewing a specific candle, switch to the div displaying live data updated in the incomingData function of the websocket
          hoverRow.style.display = 'none'
          updateRow.style.display = 'block'
        }
      }

      const handleResize = () => {
        chartApi.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight })
        timer.style.left = `${chartContainerRef.current.clientWidth - 84}px`
        console.log(chartContainerRef.current.clientHeight)
      }

      window.addEventListener('resize', handleResize)


      // wait for the data to load completely
      setTimeout(() => {
        chartApi.subscribeCrosshairMove(handleCrosshairMove)
        chartApi.applyOptions({handleScroll: true, handleScale: true})
      }, 2000);

      localStorage.setItem('timeFrame', JSON.stringify(timeFrame))

      return () => {
        legend.remove()
        window.removeEventListener('resize', handleResize)
        timer.remove()
        chartApi.remove()
        dataSocket.close()
      }
    },
    [timeFrame]
  )

  // function to handle the time frame change caused by the toggle button group in the control panel
  const handleTimeFrame = (e, value) => {
    //detect if changed value is latter
    if (value !== null) {
      //set the newly received value
      setTimeFrame(value);
    };
  }

  const propsObject = {
    timeFrame,
    handleTimeFrame
  }


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div ref={chartContainerRef} id='chart-container'></div>
      <div className='grow'>
        <TimeFrameToggler {...propsObject} />
      </div>
    </ThemeProvider>

    // <div
    // className='grow'
    // style={{top: `${growPosition - 17}px`, alignItems: 'center'}}
    // >
    // <span
    //   className='grow-expander'
    // >
    //   <KeyboardArrowLeft />
    // </span>
    // &nbsp;
    // <div
    //   className='grow-content'
    // >
    //   <div>
    //     {isEmpty(positionDetails) ? cutNumber(putForthMargin * entryPrice / leverage * 10, 2) : cutNumber(positionDetails.margin, 2)} <span className='symbol__base'>USDT</span>
    //   </div>
    //   <div>
    //     ({percent}%)
    //   </div>
    //   <div>
    //     {percentLev}%
    //   </div>
    // </div>
    // </div>
  )
}

export default App
