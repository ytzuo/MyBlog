import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期必须使用 YYYY-MM-DD 格式")
  .refine(
    (value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.valueOf()) &&
        date.toISOString().slice(0, 10) === value
      );
    },
    "日期必须是有效的公历日期",
  );

const slugSchema = z
  .string()
  .min(1, "slug 不能为空")
  .regex(
    /^[\p{L}\p{N}_-]+$/u,
    "slug 只能包含字母、数字、下划线和连字符",
  );

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string(),
        slug: slugSchema,
        pubDate: dateSchema,
        updatedDate: dateSchema.optional(),
        draft: z.boolean().default(false),
        heroImage: image().optional(),
        heroImageAlt: z.string().trim().min(1).optional(),
        heroImageScale: z.number().optional(),
        tags: z.array(z.string()).optional(),
        reprintAuthor: z.string().optional(),
        reprintUrl: z.url().optional(),
        reprintTitle: z.string().optional(),
        lang: z.enum(["zh", "en"]).default("zh"),
        translationKey: slugSchema,
      })
      .superRefine((data, context) => {
        if (data.heroImage && !data.heroImageAlt) {
          context.addIssue({
            code: "custom",
            path: ["heroImageAlt"],
            message: "配置 heroImage 时必须同时提供 heroImageAlt",
          });
        }
      }),
});

export const collections = { blog };
