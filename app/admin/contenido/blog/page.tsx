import { getArticulos, type ArticuloRow } from '../actions'
import BlogAdmin from './BlogAdmin'

export default async function BlogPage() {
  let articulos: ArticuloRow[] = []
  try {
    articulos = await getArticulos()
  } catch {
    // render empty list on error
  }
  return <BlogAdmin articulos={articulos} />
}
