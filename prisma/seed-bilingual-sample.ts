import { PrismaClient, Domain, Difficulty } from '@prisma/client'

const prisma = new PrismaClient()

// Sample bilingual questions (demonstrates Zh fields)
const sampleQuestions = [
  {
    questionText: "Which of the following is the FIRST canon of the (ISC)² Code of Ethics?",
    questionTextZh: "以下哪项是 (ISC)² 职业道德守则的第一条准则？",
    options: ["Act honorably, honestly, justly, responsibly, and legally", "正当地、诚实、公正、负责任且合法地行动", "Protect society, the common good, necessary public trust and confidence, and the infrastructure", "保护社会、公共利益、必要的公众信任和信心以及基础设施"],
    correctAnswer: 1,
    explanation: "The first canon of the (ISC)² Code of Ethics is to protect society, the common good, necessary public trust and confidence, and the infrastructure. This canon emphasizes putting the common good ahead of yourself.",
    explanationZh: "(ISC)² 职业道德守则的第一条准则是保护社会、公共利益、必要的公众信任和信心以及基础设施。该准则强调将公共利益置于个人利益之上。",
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    difficulty: Difficulty.EASY,
    tags: ["ethics", "isc2", "code-of-ethics"]
  },
  {
    questionText: "What are the five pillars of information security?",
    questionTextZh: "信息安全的五大支柱是什么？",
    options: ["Prevention, Detection, Response, Recovery, and Correction", "预防、检测、响应、恢复和纠正", "Confidentiality, Integrity, Availability, Authenticity, and Nonrepudiation", "机密性、完整性、可用性、真实性和不可否认性"],
    correctAnswer: 1,
    explanation: "The five pillars of information security are Confidentiality, Integrity, Availability (CIA triad), plus Authenticity and Nonrepudiation. These form the foundation of information security principles.",
    explanationZh: "信息安全的五大支柱是机密性、完整性、可用性（CIA 三要素），加上真实性和不可否认性。这些构成了信息安全原则的基础。",
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    difficulty: Difficulty.EASY,
    tags: ["cia-triad", "security-principles", "fundamentals"]
  }
]

// Sample bilingual notes
const sampleNotes = [
  {
    title: "CISSP Code of Ethics - The Four Canons",
    titleZh: "CISSP 职业道德守则 - 四条准则",
    content: `# (ISC)² Code of Professional Ethics - Four Canons

## Canon 1: Protect Society, Common Good
- This is the "do the right thing"
- Put the common good ahead of yourself
- Ensure the public can have faith in your infrastructure and security
- Any member of the public can file a claim under canon I

## Canon 2: Act Honorably, Honestly, Justly, Responsibly, and Legally
- Always follow the laws
- If conflicting laws from different jurisdictions apply, prioritize the local jurisdiction
- Any member of the public can file a complaint under canon II

## Canon 3: Provide Diligent and Competent Service to Principals
- Avoid passing yourself as an expert in areas you aren't qualified
- Maintain and expand your skills
- Only employers or those with contractual relationships can file complaints

## Canon 4: Advance and Protect the Profession
- Don't bring negative publicity to the profession
- Provide competent services, get training, act honorably
- Anyone who subscribes to a code of ethics can file a complaint`,
    contentZh: `# (ISC)² 职业道德守则 - 四条准则

## 准则一：保护社会、公共利益
- 这是"做正确的事"
- 将公共利益置于个人利益之上
- 确保公众对您的基础设施和安全有信心
- 任何公众成员都可以根据准则一提出索赔

## 准则二：正当地、诚实、公正、负责任且合法地行动
- 始终遵守法律
- 如果适用不同司法管辖区的冲突法律，优先考虑当地司法管辖区
- 任何公众成员都可以根据准则二提出投诉

## 准则三：为委托人提供勤勉和称职的服务
- 避免将自己冒充为您不具备资格领域的专家
- 维护和扩展您的技能
- 只有雇主或与您有合同关系的人可以提出投诉

## 准则四：推进和保护职业
- 不要给职业带来负面宣传
- 提供称职的服务，接受培训，正当地行事
- 任何订阅道德守则的人都可以提出投诉`,
    domain: Domain.SECURITY_RISK_MANAGEMENT,
    tags: ["ethics", "isc2", "professional-conduct"]
  }
]

// Sample bilingual flashcards
const sampleFlashcards = [
  {
    front: "What is the first canon of the (ISC)² Code of Ethics?",
    frontZh: "(ISC)² 职业道德守则的第一条准则是什么？",
    back: "Protect society, the common good, necessary public trust and confidence, and the infrastructure",
    backZh: "保护社会、公共利益、必要的公众信任和信心以及基础设施",
    domain: Domain.SECURITY_RISK_MANAGEMENT
  },
  {
    front: "What are the five pillars of information security?",
    frontZh: "信息安全的五大支柱是什么？",
    back: "Confidentiality, Integrity, Availability, Authenticity, Nonrepudiation",
    backZh: "机密性、完整性、可用性、真实性、不可否认性",
    domain: Domain.SECURITY_RISK_MANAGEMENT
  },
  {
    front: "What is the formula for ALE?",
    frontZh: "ALE 的公式是什么？",
    back: "ALE = SLE × ARO (Single Loss Expectancy × Annualized Rate of Occurrence)",
    backZh: "ALE = SLE × ARO（单次损失期望值 × 年发生率）",
    domain: Domain.SECURITY_RISK_MANAGEMENT
  }
]

async function main() {
  console.log('Starting bilingual seed (sample)...')

  // Check if data already exists
  const existingSampleQuestions = await prisma.question.count({
    where: { questionTextZh: { not: null } }
  })

  if (existingSampleQuestions > 0) {
    console.log('Sample bilingual data already exists. Skipping seed.')
    return
  }

  console.log('Seeding sample bilingual questions...')
  for (const question of sampleQuestions) {
    await prisma.question.create({ data: question })
  }
  console.log(`Created ${sampleQuestions.length} bilingual questions`)

  console.log('Seeding sample bilingual notes...')
  for (const note of sampleNotes) {
    await prisma.note.create({ data: note })
  }
  console.log(`Created ${sampleNotes.length} bilingual notes`)

  console.log('Seeding sample bilingual flashcards...')
  const now = new Date()
  for (const card of sampleFlashcards) {
    await prisma.flashcard.create({
      data: {
        ...card,
        nextReview: now,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
      },
    })
  }
  console.log(`Created ${sampleFlashcards.length} bilingual flashcards`)

  console.log('Bilingual sample seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
