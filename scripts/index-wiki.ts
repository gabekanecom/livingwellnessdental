import { prisma } from '../lib/prisma';
import { indexArticle } from '../lib/wiki/embeddings';

async function indexAllArticles() {
  console.log('🔍 Finding published articles to index...\n');

  const articles = await prisma.wikiArticle.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, title: true },
  });

  if (articles.length === 0) {
    console.log('❌ No published articles found to index.');
    return;
  }

  console.log(`📚 Indexing ${articles.length} articles...\n`);

  let successful = 0;
  let failed = 0;

  for (const article of articles) {
    try {
      const chunks = await indexArticle(article.id);
      console.log(`✅ ${article.title} (${chunks} chunks)`);
      successful++;
    } catch (error) {
      console.error(`❌ ${article.title}: ${error}`);
      failed++;
    }
  }

  console.log(`\n🎉 Indexing complete!`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n💡 Note: Vector embeddings are generated but not stored in the database.');
    console.log('   Enable pgvector extension in production to store embeddings.');
  }
}

indexAllArticles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
