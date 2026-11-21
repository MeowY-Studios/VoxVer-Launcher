/**
 * 各加载器 provider 的注册表
 */
import { getForgeBuilds } from './forge.provider'
import { getNeoForgeBuilds } from './neoforge.provider'
import { getFabricBuilds } from './fabric.provider'
import { getQuiltBuilds } from './quilt.provider'
import type { LoaderCatalogProvider, LoaderKind } from '../types'

export const PROVIDERS: Record<LoaderKind, LoaderCatalogProvider> = {
  forge: { loader: 'forge', getBuilds: getForgeBuilds },
  neoforge: { loader: 'neoforge', getBuilds: getNeoForgeBuilds },
  fabric: { loader: 'fabric', getBuilds: getFabricBuilds },
  quilt: { loader: 'quilt', getBuilds: getQuiltBuilds }
}
