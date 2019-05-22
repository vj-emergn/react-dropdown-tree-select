import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

import TreeNode from '../tree-node'

const shouldRenderNode = (node, searchModeOn, data) => {
  if (searchModeOn || node.expanded) return true

  const parent = node._parent && data.get(node._parent)
  // if it has a parent, then check parent's state.
  // otherwise root nodes are always rendered
  return !parent || parent.expanded
}

class Tree extends Component {
  static propTypes = {
    data: PropTypes.object,
    keepTreeOnSearch: PropTypes.bool,
    keepChildrenOnSearch: PropTypes.bool,
    searchModeOn: PropTypes.bool,
    onChange: PropTypes.func,
    onNodeToggle: PropTypes.func,
    onAction: PropTypes.func,
    onCheckboxChange: PropTypes.func,
    simpleSelect: PropTypes.bool,
    radioSelect: PropTypes.bool,
    showPartiallySelected: PropTypes.bool,
    pageSize: PropTypes.number,
    readOnly: PropTypes.bool,
    clientId: PropTypes.string,
    activeDescendant: PropTypes.string,
  }

  static defaultProps = {
    pageSize: 250,
  }

  constructor(props) {
    super(props)

    this.computeInstanceProps(props)

    this.state = {
      items: this.allVisibleNodes.slice(0, this.props.pageSize),
    }
  }

  componentWillReceiveProps = nextProps => {
    this.computeInstanceProps(nextProps)
    this.setState({ items: this.allVisibleNodes.slice(0, this.currentPage * this.props.pageSize) }, () => {
      const { activeDescendant } = nextProps
      const { scrollableTarget } = this.state
      const activeLi = activeDescendant && document && document.getElementById(activeDescendant)
      if (activeLi && scrollableTarget) {
        scrollableTarget.scrollTop = activeLi.offsetTop - (scrollableTarget.clientHeight - activeLi.clientHeight) / 2
      }
    })
  }

  componentDidMount = () => {
    this.setState({ scrollableTarget: this.node.parentNode })
  }

  computeInstanceProps = props => {
    this.allVisibleNodes = this.getNodes(props)
    this.totalPages = Math.ceil(this.allVisibleNodes.length / this.props.pageSize)
    if (props.activeDescendant) {
      const currentId = props.activeDescendant.replace(/_li$/, '')
      const focusIndex = this.allVisibleNodes.findIndex(n => n.key === currentId) + 1
      this.currentPage = focusIndex > 0 ? Math.ceil(focusIndex / this.props.pageSize) : 1
    } else {
      this.currentPage = 1
    }
  }

  getNodes = props => {
    const {
      data,
      keepTreeOnSearch,
      keepChildrenOnSearch,
      searchModeOn,
      simpleSelect,
      radioSelect,
      showPartiallySelected,
      readOnly,
      onAction,
      onChange,
      onCheckboxChange,
      onNodeToggle,
      activeDescendant,
      clientId,
    } = props
    const items = []
    data.forEach(node => {
      if (shouldRenderNode(node, searchModeOn, data)) {
        items.push(
          <TreeNode
            keepTreeOnSearch={keepTreeOnSearch}
            keepChildrenOnSearch={keepChildrenOnSearch}
            key={node._id}
            {...node}
            searchModeOn={searchModeOn}
            onChange={onChange}
            onCheckboxChange={onCheckboxChange}
            onNodeToggle={onNodeToggle}
            onAction={onAction}
            simpleSelect={simpleSelect}
            radioSelect={radioSelect}
            showPartiallySelected={showPartiallySelected}
            readOnly={readOnly}
            clientId={clientId}
            activeDescendant={activeDescendant}
          />
        )
      }
    })
    return items
  }

  hasMore = () => this.currentPage < this.totalPages

  loadMore = () => {
    this.currentPage = this.currentPage + 1
    const nextItems = this.allVisibleNodes.slice(0, this.currentPage * this.props.pageSize)
    this.setState({ items: nextItems })
  }

  setNodeRef = node => {
    this.node = node
  }

  getAriaAttributes = () => {
    const { readOnly, simpleSelect } = this.props
    const attributes = {}

    attributes.role = simpleSelect ? 'listbox' : 'tree'
    attributes['aria-multiselectable'] = simpleSelect ? 'false' : 'true'
    attributes['aria-readonly'] = readOnly ? 'true' : 'false'
    return attributes
  }

  render() {
    const { searchModeOn } = this.props

    return (
      <ul className={`root ${searchModeOn ? 'searchModeOn' : ''}`} ref={this.setNodeRef} {...this.getAriaAttributes()}>
        {this.state.scrollableTarget && (
          <InfiniteScroll
            dataLength={this.state.items.length}
            next={this.loadMore}
            hasMore={this.hasMore()}
            loader={<span className="searchLoader">Loading...</span>}
            scrollableTarget={this.state.scrollableTarget}
          >
            {this.state.items}
          </InfiniteScroll>
        )}
      </ul>
    )
  }
}

export default Tree
