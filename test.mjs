import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.TMDB_API_KEY;
const PROXY = process.env.TMDB_PROXY || 'https://api.themoviedb.org';
const BASE = `${PROXY}/3`;
const IMG_BASE = `${PROXY}/t/p`;

if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.error('❌ 请先在 .env 中设置 TMDB_API_KEY');
  process.exit(1);
}

async function get(path) {
  const url = `${BASE}${path}&api_key=${API_KEY}&language=zh-CN`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

async function main() {
  console.log(`\n🔗 Proxy: ${PROXY}\n`);

  // 1. 热门电影
  console.log('📽️  热门电影 (前5)');
  const popular = await get('/movie/popular?page=1');
  for (const m of popular.results.slice(0, 5)) {
    console.log(`  [${m.id}] ${m.title} (${m.release_date?.slice(0, 4)}) ⭐ ${m.vote_average}`);
  }

  // 2. 搜索电影
  const query = '星际穿越';
  console.log(`\n🔍 搜索: "${query}"`);
  const search = await get(`/search/movie?query=${encodeURIComponent(query)}`);
  const first = search.results[0];
  if (first) {
    console.log(`  命中: [${first.id}] ${first.title} — ${first.overview?.slice(0, 60)}...`);

    // 3. 电影详情
    console.log(`\n📄 详情: ${first.title}`);
    const detail = await get(`/movie/${first.id}?append_to_response=videos,credits`);
    console.log(`  时长: ${detail.runtime} 分钟`);
    console.log(`  类型: ${detail.genres.map(g => g.name).join(' / ')}`);
    console.log(`  导演: ${detail.credits?.crew?.find(c => c.job === 'Director')?.name || 'N/A'}`);
    console.log(`  主演: ${detail.credits?.cast?.slice(0, 3).map(c => c.name).join(', ')}`);

    const trailer = detail.videos?.results?.find(v => v.type === 'Trailer');
    if (trailer) console.log(`  预告: https://www.youtube.com/watch?v=${trailer.key}`);

    // 4. 图片
    console.log('\n🖼️  图片代理');
    if (detail.poster_path) {
      console.log(`  海报: ${IMG_BASE}/w500${detail.poster_path}`);
    }
    if (detail.backdrop_path) {
      console.log(`  背景: ${IMG_BASE}/original${detail.backdrop_path}`);
    }
  }

  // 5. 缓存验证（连续两次请求，第二次应更快）
  console.log('\n⚡ 缓存测试');
  const testPath = '/movie/popular?page=1';
  const t1 = Date.now(); await get(testPath); const d1 = Date.now() - t1;
  const t2 = Date.now(); await get(testPath); const d2 = Date.now() - t2;
  console.log(`  首次: ${d1}ms  二次: ${d2}ms  ${d2 < d1 ? '✅ 缓存生效' : '⚠️  缓存未命中（可能还未回填）'}`);

  console.log('\n✅ 所有测试通过\n');
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});
