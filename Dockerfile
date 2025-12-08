# === 构建阶段 ===
FROM node:24-alpine as build-stage

WORKDIR /app

# 安装依赖 (利用缓存)
COPY package*.json ./
# 如果在国内，建议加上淘宝源
# RUN npm config set registry https://registry.npmmirror.com
RUN npm install

# 复制代码并构建
COPY . .
RUN npm run build

# === 运行阶段 ===
FROM nginx:stable-alpine as production-stage

# 复制构建产物到 Nginx 目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]