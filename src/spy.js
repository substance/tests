import { isFunction } from 'substance'

export default function spy (self, name) {
  var f
  if (arguments.length === 0) {
    f = () => {}
  } else if (arguments.length === 1 && isFunction(arguments[0])) {
    f = arguments[0]
  } else {
    f = self[name]
  }
  function spyFunction (...args) {
    var res = f.call(self, ...args)
    spyFunction.callCount++
    spyFunction.args = args
    return res
  }
  spyFunction.callCount = 0
  spyFunction.args = null
  spyFunction.restore = () => {
    if (self) {
      self[name] = f
    }
  }
  spyFunction.reset = () => {
    spyFunction.callCount = 0
    spyFunction.args = null
  }
  if (self) {
    self[name] = spyFunction
  }
  return spyFunction
}
