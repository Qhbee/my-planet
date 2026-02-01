import { defineCollection, defineContentConfig, z } from '@nuxt/content'

// ============================================================================
// Schema Definitions (可复用的 Schema 构建器)
// ============================================================================

const createBaseSchema = () => z.object({
  title: z.string(),
  description: z.string()
})

const createButtonSchema = () => z.object({
  label: z.string(),
  icon: z.string().optional(),
  to: z.string().optional(),
  color: z.enum(['primary', 'neutral', 'success', 'warning', 'error', 'info']).optional(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
  variant: z.enum(['solid', 'outline', 'subtle', 'soft', 'ghost', 'link']).optional(),
  target: z.enum(['_blank', '_self']).optional()
})

const createImageSchema = () => z.object({
  src: z.string().editor({ input: 'media' }),
  alt: z.string()
})

const createAuthorSchema = () => z.object({
  name: z.string(),
  description: z.string().optional(),
  username: z.string().optional(),
  twitter: z.string().optional(),
  to: z.string().optional(),
  avatar: createImageSchema().optional()
})

const createTestimonialSchema = () => z.object({
  quote: z.string(),
  author: createAuthorSchema()
})

// Index 页面 Schema
const indexSchema = z.object({
  hero: z.object({
    links: z.array(createButtonSchema()),
    images: z.array(createImageSchema())
  }),
  about: createBaseSchema(),
  experience: createBaseSchema().extend({
    items: z.array(z.object({
      date: z.date(),
      position: z.string(),
      company: z.object({
        name: z.string(),
        url: z.string(),
        logo: z.string().editor({ input: 'icon' }),
        color: z.string()
      })
    }))
  }),
  testimonials: z.array(createTestimonialSchema()),
  blog: createBaseSchema(),
  faq: createBaseSchema().extend({
    categories: z.array(
      z.object({
        title: z.string().nonempty(),
        questions: z.array(
          z.object({
            label: z.string().nonempty(),
            content: z.string().nonempty()
          })
        )
      }))
  })
})

// Projects Schema
const projectSchema = z.object({
  title: z.string().nonempty(),
  description: z.string().nonempty(),
  image: z.string().nonempty().editor({ input: 'media' }),
  url: z.string().optional(),
  tags: z.array(z.string()).optional(),
  date: z.date().optional(),
  category: z.string().nonempty()
})

// Blog Schema
const blogSchema = z.object({
  minRead: z.number(),
  date: z.date(),
  image: z.string().nonempty().editor({ input: 'media' }),
  author: createAuthorSchema()
})

// Pages Schema (projects.yml, blog.yml)
const pagesSchema = z.object({
  links: z.array(createButtonSchema())
})

// About Schema
const aboutSchema = z.object({
  content: z.object({}),
  images: z.array(createImageSchema())
})

// ============================================================================
// Collection Definitions (i18n: 目录分割法 + {业务}_{语言} 命名规范)
// ============================================================================
export default defineContentConfig({
  collections: {
    // ========== English Collections ==========
    index_en: defineCollection({ type: 'page', source: 'en/index.yml', schema: indexSchema }),
    projects_en: defineCollection({ type: 'data', source: 'en/projects/*.yml', schema: projectSchema }),
    blog_en: defineCollection({ type: 'page', source: 'en/blog/*.md', schema: blogSchema }),
    pages_en: defineCollection({ type: 'page', source: [{ include: 'en/projects.yml' }, { include: 'en/blog.yml' }], schema: pagesSchema }),
    about_en: defineCollection({ type: 'page', source: 'en/about.yml', schema: aboutSchema }),

    // ========== Chinese Collections ==========
    index_zh: defineCollection({ type: 'page', source: 'zh/index.yml', schema: indexSchema }),
    projects_zh: defineCollection({ type: 'data', source: 'zh/projects/*.yml', schema: projectSchema }),
    blog_zh: defineCollection({ type: 'page', source: 'zh/blog/*.md', schema: blogSchema }),
    pages_zh: defineCollection({ type: 'page', source: [{ include: 'zh/projects.yml' }, { include: 'zh/blog.yml' }], schema: pagesSchema }),
    about_zh: defineCollection({ type: 'page', source: 'zh/about.yml', schema: aboutSchema })
  }
})
