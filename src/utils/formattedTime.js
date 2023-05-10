const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

export const formattedTime = (time) => {
  // format the remaining seconds in the required format to display in the countdown timer div
  const dateObj = new Date(time)
  const day = dateObj.getDate()
  const monthD = month[dateObj.getMonth()]
  const hours = dateObj.getHours()
  const minutes = dateObj.getMinutes();
  const seconds = dateObj.getSeconds()

  const timeString = day.toString() + ' ' + monthD.toString() + ' ' + hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');

  return timeString
}