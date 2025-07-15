#!/bin/bash

echo "降级到 Tailwind CSS v3 以解决暗色模式问题..."

# 删除 Tailwind v4
npm uninstall tailwindcss @tailwindcss/postcss

# 安装 Tailwind v3
npm install -D tailwindcss@^3.4.0 postcss autoprefixer

# 更新 postcss 配置
cat > postcss.config.mjs << 'EOF'
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
EOF

echo "Tailwind CSS 已降级到 v3，请重启开发服务器"