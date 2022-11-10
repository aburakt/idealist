import Link from 'next/link'
import styles from './nav.module.css'

function Navigation() {
  return (
    <nav>
      <Link className={styles.link} href="/">
        Home
      </Link>
      <Link href="/about">About</Link>
    </nav>
  )
}

export default Navigation
