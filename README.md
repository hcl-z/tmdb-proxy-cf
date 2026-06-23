# tmdb-proxy-cf

基于 Cloudflare Workers 的 TMDB API 代理服务，支持 API 请求代理和图片代理，内置 CDN 级缓存。

> 原项目 [imaliang/tmdb-proxy](https://github.com/imaliang/tmdb-proxy) 的 Cloudflare Workers 版本。

## 功能

- **API 代理**：转发所有 `api.themoviedb.org` 请求
- **图片代理**：转发 `image.tmdb.org` 图片资源
- **CDN 缓存**：利用 Cloudflare 全球节点缓存，接口缓存 10 分钟
- **CORS 支持**：开箱即用，允许跨域请求

## 路由规则

| 路径 | 目标 |
|------|------|
| `/` | 跳转到 GitHub 仓库 |
| `/t/p/*` | `https://image.tmdb.org/t/p/*` |
| `/*` | `https://api.themoviedb.org/*` |

## 部署

### 前置条件

- [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
- Node.js 18+

### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/tmdb-proxy-cf.git
cd tmdb-proxy-cf

# 2. 安装依赖
npm install

# 3. 登录 Cloudflare
npx wrangler login

# 4. 部署
npm run deploy
```

部署完成后会得到一个 `*.workers.dev` 地址（国内需绑定自定义域名）。

### 绑定自定义域名

1. 进入 Cloudflare Dashboard → **Workers & Pages** → `tmdb-proxy`
2. **Settings** → **Domains & Routes** → **Add** → **Custom Domain**
3. 填入你的子域名，例如 `tmdb.yourdomain.com`（域名需托管在 Cloudflare）
4. 保存后等待几秒自动生效

### 本地开发

```bash
npm run dev
# 本地监听 http://localhost:8787
```

## 使用示例

将原来直接请求 TMDB 的地址替换为你的代理域名：

```
# 原始地址
https://api.themoviedb.org/3/movie/popular?api_key=YOUR_KEY

# 代理地址
https://tmdb.yourdomain.com/3/movie/popular?api_key=YOUR_KEY
```

图片同理：

```
# 原始地址
https://image.tmdb.org/t/p/w500/poster.jpg

# 代理地址
https://tmdb.yourdomain.com/t/p/w500/poster.jpg
```

## 与 Vercel 版本的区别

| 对比项 | Vercel 版 | Cloudflare Workers 版 |
|--------|-----------|----------------------|
| 缓存机制 | 内存 Map（单实例） | CDN 全局缓存（跨实例共享）|
| 免费额度 | 100GB 带宽/月 | 10 万次请求/天 |
| 冷启动 | 有 | 无 |
| 国内访问 | 需自定义域名 | 需自定义域名 |
| 依赖 | axios | 原生 fetch（零依赖）|

## License

MIT
