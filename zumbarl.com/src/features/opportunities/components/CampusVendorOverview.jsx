import { FiArrowRight, FiCheck, FiShoppingBag } from 'react-icons/fi'
import { Link } from 'react-router-dom'

function CampusVendorOverviewBanner({ actionLabel, onAction, shop }) {
  const isOpen = shop?.acceptingOrders !== false
  const campus = shop?.campus || shop?.locationLabel || 'campus'
  return <section className={`campus-vendor-overview-banner ${isOpen ? 'is-open' : 'is-closed'}`}>
    <div className="campus-vendor-overview-banner-icon"><FiShoppingBag /></div>
    <div><span>In-campus service</span><h2>{isOpen ? `${shop.name} is open for campus orders` : `${shop.name} is currently closed`}</h2><p>{isOpen ? `Students can browse, order, and collect at ${campus}.` : 'The menu remains visible while new orders are paused.'}</p></div>
    <button onClick={onAction} type="button">{actionLabel}<FiArrowRight /></button>
  </section>
}

function CampusVendorMetricGrid({ metrics }) {
  return <section className={`campus-vendor-metrics has-${metrics.length}`}>
    {metrics.map(({ id, Icon, label, value, note, onSelect }) => {
      const content = <><span><Icon /> {label}</span><strong>{value}</strong><small>{note}{onSelect ? <FiArrowRight /> : null}</small></>
      return onSelect ? <button key={id} onClick={onSelect} type="button">{content}</button> : <article key={id}>{content}</article>
    })}
  </section>
}

function CampusVendorInventoryPreview({ emptyAction, emptyText, eyebrow, items, onViewAll, title, viewAllLabel = 'View all' }) {
  return <section className="vendor-workspace-panel campus-vendor-inventory-preview">
    <header><div><span>{eyebrow}</span><h2>{title}</h2></div><button onClick={onViewAll} type="button">{viewAllLabel}<FiArrowRight /></button></header>
    {items.length ? <div className="campus-vendor-preview-grid">{items.map((item) => <article key={item.id}>
      <img src={item.image} alt="" />
      <div><span>{item.category}</span><strong>{item.title}</strong><small>{item.stock} available</small></div>
      <footer><b>{item.price}</b>{item.href ? <Link to={item.href}>{item.actionLabel || 'View'}<FiArrowRight /></Link> : item.onAction ? <button onClick={item.onAction} type="button">{item.actionLabel || 'Manage'}<FiArrowRight /></button> : <em>{item.actionLabel || 'Unavailable'}</em>}</footer>
    </article>)}</div> : <div className="campus-vendor-preview-empty"><span><FiCheck /></span><div><strong>No inventory yet</strong><p>{emptyText}</p></div>{emptyAction}</div>}
  </section>
}

export { CampusVendorInventoryPreview, CampusVendorMetricGrid, CampusVendorOverviewBanner }
