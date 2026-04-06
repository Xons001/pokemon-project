import { isMetaRefreshUiEnabled } from '@/src/modules/ops/meta-refresh'

import SiteHeaderClient from './SiteHeaderClient'

export default function SiteHeader() {
  return <SiteHeaderClient showOps={isMetaRefreshUiEnabled()} />
}
