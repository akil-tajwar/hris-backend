import fs from 'fs'
import path from 'path'
// const pdfParse = require('pdf-parse')
import { db } from '../config/database'
import { companyPolicyChunksModel } from '../schemas'
import { localAI, EMBEDDING_MODEL } from '../config/local-ai'
import { eq } from 'drizzle-orm'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

// pdfUrl looks like http://localhost:4000/uploads/1787549127316-290538032.pdf
// the actual file sits at uploads/1787549127316-290538032.pdf
const resolveLocalPathFromUrl = (pdfUrl: string): string => {
  const filename = pdfUrl.split('/uploads/').pop()
  if (!filename)
    throw new Error(`Could not resolve filename from pdfUrl: ${pdfUrl}`)
  return path.join(UPLOADS_DIR, filename)
}

const extractTextFromPdf = async (filePath: string): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist')
  const data = new Uint8Array(fs.readFileSync(filePath))
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdf = await loadingTask.promise
  const textParts: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
    textParts.push(pageText)
  }

  return textParts.join('\n\n')
}

// Simple paragraph-based chunking, grouped up to ~1500 chars per chunk
const chunkText = (text: string, maxChars = 1500): string[] => {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxChars && current.length > 0) {
      chunks.push(current.trim())
      current = para
    } else {
      current = current ? `${current}\n\n${para}` : para
    }
  }

  if (current.trim().length > 0) chunks.push(current.trim())

  return chunks
}

const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await localAI.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  })
  return response.data[0].embedding
}

export const buildChunksForPolicy = async ({
  tenantId,
  companyId,
  year,
  pdfUrl,
  documentName,
}: {
  tenantId: number
  companyId: number
  year: number
  pdfUrl: string
  documentName: string
}) => {
  console.log('buildChunksForPolicy called:', {
    tenantId,
    companyId,
    year,
    pdfUrl,
    documentName,
  })

  const localPath = resolveLocalPathFromUrl(pdfUrl)
  console.log('Resolved local path:', localPath)

  if (!fs.existsSync(localPath)) {
    throw new Error(`PDF file not found at ${localPath}`)
  }

  console.log('File exists, extracting text...')
  const fullText = await extractTextFromPdf(localPath)
  console.log('Extracted text length:', fullText.length)

  const chunks = chunkText(fullText)
  console.log('Chunks produced:', chunks.length)

  if (chunks.length === 0) return []

  const rows = []
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Embedding chunk ${i + 1}/${chunks.length}`)
    const embedding = await generateEmbedding(chunks[i])
    rows.push({
      tenantId,
      companyId,
      year,
      documentName,
      chunkIndex: i,
      chunkText: chunks[i],
      embedding,
    })
  }

  return rows
}

// Convenience wrapper — builds and inserts in one call (for standalone use outside transactions)
export const chunkAndStorePolicy = async (
  params: Parameters<typeof buildChunksForPolicy>[0]
) => {
  const rows = await buildChunksForPolicy(params)
  if (rows.length === 0) {
    console.warn(`chunkAndStorePolicy: no chunks for ${params.documentName}`)
    return
  }
  await db.insert(companyPolicyChunksModel).values(rows)
  console.log(
    `chunkAndStorePolicy: stored ${rows.length} chunks for ${params.documentName}`
  )
}

export const searchPolicyChunks = async (
  tenantId: number,
  question: string,
  topK = 5
): Promise<string[]> => {
  // Embed the question using the same model used during chunking
  const questionEmbedding = await generateEmbedding(question)

  // Fetch all chunks for this tenant
  const chunks = await db
    .select({
      chunkText: companyPolicyChunksModel.chunkText,
      embedding: companyPolicyChunksModel.embedding,
    })
    .from(companyPolicyChunksModel)
    .where(eq(companyPolicyChunksModel.tenantId, tenantId))

  if (chunks.length === 0) return []

  // Cosine similarity between two vectors
  const cosineSimilarity = (a: number[], b: number[]): number => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
    return magA && magB ? dot / (magA * magB) : 0
  }

  // Score each chunk and pick the top K
  const scored = chunks
    .map((chunk) => ({
      text: chunk.chunkText,
      score: cosineSimilarity(questionEmbedding, chunk.embedding as number[]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  console.log(
    'Top policy chunk scores:',
    scored.map((s) => s.score.toFixed(4))
  )

  return scored.map((s) => s.text)
}