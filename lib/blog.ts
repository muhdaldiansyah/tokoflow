import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string
  tag: string
  image?: string
  imageAlt?: string
  keywords?: string[]
  excerpt?: string
}

const DIR = path.join(process.cwd(), 'content/blog')

export function getAllPosts(): PostMeta[] {
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const { data } = matter(fs.readFileSync(path.join(DIR, f), 'utf8'))
      return { slug: f.replace('.mdx', ''), ...data } as PostMeta
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPost(slug: string) {
  const raw = fs.readFileSync(path.join(DIR, `${slug}.mdx`), 'utf8')
  const { data, content } = matter(raw)
  return { meta: { slug, ...data } as PostMeta, content }
}
