function convertToBillion (amount) {
	const num = (amount / 1e9).toFixed(2)
	return num + 'B'
}

export default convertToBillion