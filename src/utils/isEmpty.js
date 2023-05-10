function isEmpty(object) {
  if (Object.keys(object).length === 0 && object.constructor === Object) return true
  return false
}

export default isEmpty