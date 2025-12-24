import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        excerpt: z.string(),
        date: z.coerce.date(),
        category: z.string(),
        readTime: z.string(),
        author: z.string().default('Resume Roast Team'),
        image: z.string().optional(),
        externalUrl: z.string().url().optional(), // Link to external post (LinkedIn, Medium, etc.)
        source: z.string().optional(), // e.g. "LinkedIn", "Twitter"
    }),
});

const examplesCollection = defineCollection({
    type: 'content',
    schema: z.object({
        role: z.string(),
        level: z.string(),
        industry: z.string(),
        description: z.string(),
        keySkills: z.array(z.string()),
    }),
});

export const collections = {
    'blog': blogCollection,
    'examples': examplesCollection,
};
