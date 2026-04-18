import { z } from "zod";

type BoundingBox = [number, number, number, number];

type BaseElement = {
  type: string;
  id?: number;
  level?: string;
  "page number": number;
  "bounding box": BoundingBox;
};

type TextProperties = {
  font?: string | null;
  "font size": number;
  "text color"?: string | null;
  content: string;
  "hidden text"?: boolean;
};

type Paragraph = BaseElement &
  TextProperties & {
    type: "paragraph";
  };

type Heading = BaseElement &
  TextProperties & {
    type: "heading";
    "heading level": number;
  };

type Caption = BaseElement &
  TextProperties & {
    type: "caption";
    "linked content id"?: number;
  };

type Table = BaseElement & {
  type: "table";
  "number of rows": number;
  "number of columns": number;
  "previous table id"?: number;
  "next table id"?: number;
  rows: TableRow[];
};

type TableRow = {
  type: "table row";
  "row number": number;
  cells: TableCell[];
};

type TableCell = BaseElement & {
  type: "table cell";
  "row number": number;
  "column number": number;
  "row span": number;
  "column span": number;
  kids: ContentElement[];
};

type TextBlock = BaseElement & {
  type: "text block";
  kids: ContentElement[];
};

type List = BaseElement & {
  type: "list";
  "numbering style": string;
  "number of list items": number;
  "previous list id"?: number;
  "next list id"?: number;
  "list items": ListItem[];
};

type ListItem = BaseElement &
  TextProperties & {
    type: "list item";
    kids: ContentElement[];
  };

type ImageElement = BaseElement & {
  type: "image";
  source?: string;
  data?: string;
  format?: "png" | "jpeg";
};

type HeaderFooter = BaseElement & {
  type: "header" | "footer";
  kids: ContentElement[];
};

type ContentElement =
  | Paragraph
  | Heading
  | Caption
  | Table
  | TextBlock
  | List
  | ImageElement
  | HeaderFooter;

const boundingBoxSchema: z.ZodType<BoundingBox> = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);

const baseElementSchema = z.object({
  type: z.string(),
  id: z.number().int().optional(),
  level: z.string().optional(),
  "page number": z.number().int(),
  "bounding box": boundingBoxSchema,
});

const textPropertiesSchema = z.object({
  font: z.string().nullable().optional(),
  "font size": z.number(),
  "text color": z.string().nullable().optional(),
  content: z.string(),
  "hidden text": z.boolean().optional(),
});

const tableRowSchema: z.ZodType<TableRow> = z.object({
  type: z.literal("table row"),
  "row number": z.number().int(),
  cells: z.array(z.lazy(() => tableCellSchema)),
});

const paragraphSchema: z.ZodType<Paragraph> = baseElementSchema
  .extend(textPropertiesSchema.shape)
  .extend({
    type: z.literal("paragraph"),
  });

const headingSchema: z.ZodType<Heading> = baseElementSchema
  .extend(textPropertiesSchema.shape)
  .extend({
    type: z.literal("heading"),
    "heading level": z.number().int(),
  });

const captionSchema: z.ZodType<Caption> = baseElementSchema
  .extend(textPropertiesSchema.shape)
  .extend({
    type: z.literal("caption"),
    "linked content id": z.number().int().optional(),
  });

const tableSchema: z.ZodType<Table> = baseElementSchema.extend({
  type: z.literal("table"),
  "number of rows": z.number().int(),
  "number of columns": z.number().int(),
  "previous table id": z.number().int().optional(),
  "next table id": z.number().int().optional(),
  rows: z.array(tableRowSchema),
});

const tableCellSchema: z.ZodType<TableCell> = baseElementSchema.extend({
  type: z.literal("table cell"),
  "row number": z.number().int(),
  "column number": z.number().int(),
  "row span": z.number().int().min(1),
  "column span": z.number().int().min(1),
  kids: z.array(z.lazy(() => contentElementSchema)),
});

const textBlockSchema: z.ZodType<TextBlock> = baseElementSchema.extend({
  type: z.literal("text block"),
  kids: z.array(z.lazy(() => contentElementSchema)),
});

const listItemSchema: z.ZodType<ListItem> = baseElementSchema
  .extend(textPropertiesSchema.shape)
  .extend({
    type: z.literal("list item"),
    kids: z.array(z.lazy(() => contentElementSchema)),
  });

const listSchema: z.ZodType<List> = baseElementSchema.extend({
  type: z.literal("list"),
  "numbering style": z.string(),
  "number of list items": z.number().int(),
  "previous list id": z.number().int().optional(),
  "next list id": z.number().int().optional(),
  "list items": z.array(listItemSchema),
});

const imageSchema: z.ZodType<ImageElement> = baseElementSchema.extend({
  type: z.literal("image"),
  source: z.string().optional(),
  data: z.string().optional(),
  format: z.enum(["png", "jpeg"]).optional(),
});

const headerFooterSchema: z.ZodType<HeaderFooter> = baseElementSchema.extend({
  type: z.enum(["header", "footer"]),
  kids: z.array(z.lazy(() => contentElementSchema)),
});

const contentElementSchema: z.ZodType<ContentElement> = z.lazy(() =>
  z.union([
    paragraphSchema,
    headingSchema,
    captionSchema,
    tableSchema,
    textBlockSchema,
    listSchema,
    imageSchema,
    headerFooterSchema,
  ]),
);

export const openDataLoaderJsonSchema = z.object({
  "file name": z.string(),
  "number of pages": z.number().int(),
  author: z.string().nullable(),
  title: z.string().nullable(),
  "creation date": z.string().nullable(),
  "modification date": z.string().nullable(),
  kids: z.array(contentElementSchema),
});

export type OpenDataLoaderJson = z.infer<typeof openDataLoaderJsonSchema>;
