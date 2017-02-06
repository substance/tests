import startsWith from 'substance/util/startsWith'
import clone from 'substance/util/clone'
import Component from 'substance/ui/Component'
import Router from 'substance/ui/Router'
import TestItem from './TestItem'

const TILDE = '~'.charCodeAt(0)
const AT = '@'.charCodeAt(0)

class TestSuite extends Component {

  constructor(...args) {
    super(...args)

    this.moduleNames = this.props.harness.getModuleNames()

    this.handleAction('focusTest', this.handleFocusTest)
  }

  didMount() {
    this.router.on('route:changed', this.onRouteChange, this)
    this.router.start()
    this.runTests()
  }

  dispose() {
    this.router.off(this)
  }

  getInitialState() {
    this.router = new Router()
    return this.router.readRoute()
  }

  render($$) {
    let el = $$('div').addClass('sc-test-suite')

    let state = this.state
    let filter = this.state.filter || ''

    let header = $$('div').addClass('se-header')
    header.append(
      $$('div').addClass('se-logo').append('Substance TestSuite')
    )
    el.append(header)

    let toolbar = $$('div').addClass('se-toolbar')
    let moduleSelect = $$('select').ref('moduleNames')
    moduleSelect.append($$('option').attr('value', '').append('---   All   --'))
    this.moduleNames.forEach(function(moduleName) {
      let option = $$('option').attr('value', moduleName).append(moduleName)
      if (moduleName === state.filter) option.attr('selected', true)
      moduleSelect.append(option)
    })
    moduleSelect.on('change', this.onModuleSelect)
    toolbar.append(moduleSelect)

    let hideSuccessfulCheckbox = $$('input').ref('hideCheckbox')
      .attr('type', 'checkbox')
      .htmlProp('checked', state.hideSuccessful)
      .on('change', this.onToggleHideSuccessful)
    toolbar.append(
      $$('div').append(
        hideSuccessfulCheckbox,
        $$('label').append('Only show failed tests only')
      )
    )

    el.append(toolbar)

    let body = $$('div').addClass('se-body')

    let tests = $$('div').addClass('se-tests').ref('tests')
    this.props.harness.getTests().forEach(function(test) {
      let testItem = $$(TestItem, { test: test }).ref(test.name)
      if (!_filter(test, filter)) {
        testItem.addClass('sm-hidden')
      }
      tests.append(testItem)
    })

    body.append(tests)
    el.append(body)

    if (this.state.hideSuccessful) {
      el.addClass('sm-hide-successful')
    }

    return el
  }

  didUpdate(oldProps, oldState) {
    if (this.state.filter !== oldState.filter) {
      this.runTests()
    }
  }

  runTests() {
    // console.log('Running tests...')
    let testItems = this.refs.tests.getChildren()
    let tests = []
    let filter = this.state.filter || ''
    testItems.forEach(function(testItem) {
      let t = testItem.props.test
      if(_filter(t, filter)) {
        testItem.removeClass('sm-hidden')
        tests.push(t)
      } else {
        testItem.addClass('sm-hidden')
      }
    })
    const harness = this.props.harness
    harness.runTests(tests)
  }

  onModuleSelect() {
    let filter = this.refs.moduleNames.htmlProp('value')
    this.extendState({
      filter: filter
    })
    this.updateRoute()
  }

  handleFocusTest(test) {
    this.extendState({
      filter: '@' + test.name
    })
    this.updateRoute()
  }

  updateRoute() {
    this.router.writeRoute(this.state)
  }

  onRouteChange(newState) {
    this.setState(newState)
  }

  onToggleHideSuccessful() {
    let checked = this.refs.hideCheckbox.htmlProp('checked')
    if (checked) {
      this.extendState({
        hideSuccessful: checked
      })
    } else {
      let newState = clone(this.state)
      delete newState.hideSuccessful
      this.setState(newState)
    }
    this.updateRoute()
  }
}

function _filter(test, pattern) {
  if (!pattern) return true
  let moduleName = test.moduleName
  let title = test.name
  if (pattern.charCodeAt(0) === AT) {
    return startsWith(title, pattern.slice(1))
  } else if (pattern.charCodeAt(0) === TILDE) {
    return startsWith(moduleName, pattern.slice(1))
  } else {
    return moduleName === pattern
  }
}

export default TestSuite
