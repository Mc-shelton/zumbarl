import { Link } from 'react-router-dom'

function EnterpriseJoinCta() {
  return (
    <div className="business-enterprise-join">
      <p>
        Ready For <span className="x_wd_yellow_highlight_bold_05">Talent</span>?
      </p>
      <Link to="/register" className="event-link event-play-btn">
        Try It Out -&gt;
      </Link>
    </div>
  )
}

export default EnterpriseJoinCta
