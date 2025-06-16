import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // 環境変数を明示的に読み込む
  const env = loadEnv(mode, process.cwd());

  return {
    define: {
      // Viteが `import.meta.env.OPENAI_API_KEY` に反映させる
      'import.meta.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
    },
  };
});
