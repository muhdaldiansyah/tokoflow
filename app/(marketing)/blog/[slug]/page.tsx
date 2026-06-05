import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Home, ChevronRight } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPost } from '@/lib/blog'
import { CTA } from '@/components/mdx/CTA'
import { Callout } from '@/components/mdx/Callout'

const components = { CTA, Callout }

const SITE_URL = 'https://tokoflow.com'

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  let post
  try {
    post = getPost(slug)
  } catch {
    return {}
  }
  const { meta } = post
  const url = `${SITE_URL}/blog/${slug}`
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      publishedTime: new Date(meta.date).toISOString(),
      url,
      title: meta.title,
      description: meta.description,
      ...(meta.image ? { images: [{ url: `${SITE_URL}${meta.image}` }] } : {}),
    },
  }
}

import { formatDateLong as formatDate } from "@/lib/utils/format";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let post
  try {
    post = getPost(slug)
  } catch {
    notFound()
  }
  const { meta, content } = post

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.description,
    datePublished: new Date(meta.date).toISOString(),
    dateModified: new Date(meta.date).toISOString(),
    author: { '@type': 'Person', name: 'Muhammad Aldiansyah' },
    publisher: {
      '@type': 'Organization',
      name: 'Tokoflow',
      url: SITE_URL,
    },
    ...(meta.image ? { image: `${SITE_URL}${meta.image}` } : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${slug}`,
    },
  }

  const allPosts = getAllPosts()
  const related = allPosts.filter((p) => p.slug !== slug).slice(0, 3)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Page Header */}
      <div className="border-b pt-24 lg:pt-28">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
          <nav className="mb-3 flex items-center gap-1.5 text-sm">
            <Link
              href="/"
              className="flex items-center gap-1 text-[#475569] transition-colors hover:text-[#1E293B]"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#475569]/40" />
            <Link
              href="/blog"
              className="text-[#475569] transition-colors hover:text-[#1E293B]"
            >
              Blog
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#475569]/40" />
            <span className="font-medium text-[#1E293B] truncate max-w-[200px]">
              {meta.title}
            </span>
          </nav>

          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#1E293B]">
            {meta.title}
          </h1>
          <p className="mt-2 text-sm text-[#475569]">{formatDate(meta.date)}</p>
        </div>
      </div>

      {/* Hero Image */}
      {meta.image && (
        <div className="max-w-5xl mx-auto px-4 pt-8 lg:pt-10">
          <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl">
            <Image
              src={meta.image}
              alt={meta.imageAlt ?? meta.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-5xl mx-auto px-4 py-10 lg:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="prose prose-slate prose-sm lg:prose-base max-w-none prose-headings:font-bold prose-headings:text-[#1E293B] prose-p:text-[#475569] prose-p:leading-relaxed prose-a:text-[#05A660] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-li:text-[#475569] prose-strong:text-[#1E293B] prose-code:text-[#1E293B] prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-slate-50 prose-pre:border prose-pre:border-[#E2E8F0] prose-pre:rounded-xl prose-pre:text-xs lg:prose-pre:text-sm">
            <MDXRemote source={content} components={components} />
          </div>

          {/* Related Posts */}
          {related.length > 0 && (
            <section className="mt-10 border-t border-[#E2E8F0] pt-8 space-y-4">
              <h3 className="text-lg font-semibold text-[#1E293B]">
                Artikel Terkait
              </h3>
              <div className="space-y-3">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="block text-sm lg:text-base font-medium text-[#1E293B] hover:text-[#05A660]"
                  >
                    &rarr; {p.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </>
  )
}
