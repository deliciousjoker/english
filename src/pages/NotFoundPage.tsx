import { Link } from 'react-router'
import { Icon } from '../components/ui/Icon'

export function NotFoundPage() {
  return (
    <div className="page page--narrow">
      <p className="kicker">404</p>
      <h1 className="page__title">This page is not in the book.</h1>
      <Link to="/" className="btn btn--ghost">
        <Icon name="arrowLeft" size={16} /> Back to all levels
      </Link>
    </div>
  )
}
